/**
 * Campaign Analytics Service - Isolated Business Logic
 * Handles all analytics calculations and chart configurations
 */

import { Injectable } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { CampaignStats, Tweet, TweetWithCalculatedFields } from '../../../../core/interfaces/tweet.interface';
import { computeCampaignStats, safeDivide } from '../../../../shared/utils/campaign-aggregator';


@Injectable({
  providedIn: 'root',
})
export class CampaignAnalyticsService {
  private readonly chartDefaults = Object.freeze({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
    },
  });

  /**
   * Calculate comprehensive campaign analytics
   */
  calculateAnalytics(tweets: readonly Tweet[]): {
    readonly stats: CampaignStats;
    readonly tweetsWithCalculatedFields: TweetWithCalculatedFields[];
  } {
    if (!tweets.length) {
      return {
        stats: this.createEmptyStats(),
        tweetsWithCalculatedFields: [],
      };
    }

    const stats = computeCampaignStats([...tweets]);
    const tweetsWithCalculated = this.enrichTweetsWithCalculations(tweets);

    return Object.freeze({ stats, tweetsWithCalculatedFields: tweetsWithCalculated });
  }

  /**
   * Create sentiment distribution chart configuration
   */
  createSentimentChartConfig(stats: CampaignStats): ChartConfiguration<'doughnut'> {
    return {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Negative', 'Neutral', 'Unknown'],
        datasets: [
          {
            data: [
              stats.sentimentCounts.positive,
              stats.sentimentCounts.negative,
              stats.sentimentCounts.neutral,
              stats.sentimentCounts.unknown,
            ],
            backgroundColor: ['#4CAF50', '#F44336', '#9E9E9E', '#FF9800'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        plugins: {
          ...this.chartDefaults.plugins,
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    };
  }

  /**
   * Create hashtags frequency chart configuration
   */
  createHashtagsChartConfig(stats: CampaignStats): ChartConfiguration<'bar'> {
    const topHashtags = stats.topHashtags.slice(0, 10);

    return {
      type: 'bar',
      data: {
        labels: topHashtags.map((h) => `#${h.hashtag}`),
        datasets: [
          {
            label: 'Frequency',
            data: topHashtags.map((h) => h.count),
            backgroundColor: '#2196F3',
            borderColor: '#1976D2',
            borderWidth: 1,
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    };
  }

  /**
   * Create timeline chart configuration
   */
  createTimelineChartConfig(stats: CampaignStats): ChartConfiguration<'line'> {
    const sortedDates = Object.keys(stats.tweetsByDay).sort();

    return {
      type: 'line',
      data: {
        labels: sortedDates,
        datasets: [
          {
            label: 'Tweets per Day',
            data: sortedDates.map((date) => stats.tweetsByDay[date]),
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
            tension: 0.1,
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    };
  }

  /**
   * Check if timeline chart should be displayed
   */
  shouldShowTimelineChart(stats: CampaignStats | null): boolean {
    return stats ? Object.keys(stats.tweetsByDay).length > 1 : false;
  }

  /**
   * Format number with appropriate suffix (K, M, etc.)
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Get sentiment color for Material badges
   */
  getSentimentColor(sentiment: string): 'primary' | 'warn' | 'accent' {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'primary';
      case 'negative':
        return 'warn';
      default:
        return 'accent';
    }
  }

  private enrichTweetsWithCalculations(tweets: readonly Tweet[]): TweetWithCalculatedFields[] {
    return tweets.map((tweet) => {
      const engagement = this.calculateTweetEngagement(tweet);
      const engagementRate =
        tweet.metrics.views > 0 ? safeDivide(engagement * 100, tweet.metrics.views, 2) : 0;

      return {
        ...tweet,
        calculatedEngagement: engagement,
        calculatedEngagementRate: engagementRate,
      };
    });
  }

  private calculateTweetEngagement(tweet: Tweet): number {
    const metrics = tweet.metrics;
    return metrics.engagement !== undefined
      ? metrics.engagement
      : (metrics.likes || 0) +
          (metrics.retweets || 0) +
          (metrics.replies || 0) +
          (metrics.quotes || 0) +
          (metrics.bookmarks || 0);
  }

  private createEmptyStats(): CampaignStats {
    return {
      totalTweets: 0,
      tweetsByDay: 0 as any,
      sentimentCounts: { positive: 0, negative: 0, neutral: 0, unknown: 0 },
      sentimentPercents: { positive: 0, negative: 0, neutral: 0, unknown: 0 },
      totalEngagement: 0,
      avgEngagementPerTweet: 0,
      totalLikes: 0,
      totalRetweets: 0,
      totalReplies: 0,
      totalQuotes: 0,
      totalBookmarks: 0,
      totalViews: 0,
      avgLikes: 0,
      avgRetweets: 0,
      avgReplies: 0,
      avgQuotes: 0,
      avgBookmarks: 0,
      avgViews: 0,
      globalEngagementRate: 0,
      avgEngagementPerTweetRate: 0,
      topTweetsByEngagement: [],
      topTweetsByViews: [],
      topAuthorsByEngagement: [],
      topHashtags: [],
      topMentions: [],
      topKeywords: [],
      avgProcessingTimeMs: 0,
      analysisCoverage: 0,
      languageDistribution: 0 as any,
      typeDistribution: 0 as any
    };
  }
}
