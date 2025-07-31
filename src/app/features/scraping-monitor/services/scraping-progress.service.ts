import { Injectable } from '@angular/core';
import { ScrapingStatus } from './scraping-monitor.service';

@Injectable({
  providedIn: 'root'
})
export class ScrapingProgressService {

  exportProgress(campaignId: string): void {
    // Create CSV export of campaign progress
    const campaign = this.getCurrentCampaignData(campaignId);
    if (!campaign) return;

    const csvData = this.generateProgressCSV(campaign);
    this.downloadCSV(csvData, `campaign-${campaignId}-progress.csv`);
  }

  generateProgressReport(campaign: ScrapingStatus): string {
    const report = `
Campaign Progress Report
========================

Campaign: ${campaign.campaignName}
ID: ${campaign.campaignId}
Status: ${campaign.status}
Started: ${campaign.startTime.toLocaleString()}

Progress:
- Completed: ${campaign.progress.completed}/${campaign.progress.total} (${campaign.progress.percentage}%)
- Tweets Collected: ${campaign.metrics.tweetsCollected}
- API Calls Used: ${campaign.metrics.apiCallsUsed}
- Errors: ${campaign.metrics.errorsEncountered}

Sentiment Analysis:
- Positive: ${campaign.metrics.positiveTweets} tweets
- Negative: ${campaign.metrics.negativeTweets} tweets  
- Neutral: ${campaign.metrics.neutralTweets} tweets

Performance:
- Tweets per minute: ${campaign.speed.tweetsPerMinute}
- API calls per minute: ${campaign.speed.apiCallsPerMinute}

Current Activity: ${campaign.currentActivity}
    `.trim();

    return report;
  }

  calculateEfficiencyMetrics(campaign: ScrapingStatus): {
    efficiency: number;
    errorRate: number;
    sentimentAccuracy: number;
    timeUtilization: number;
  } {
    const totalOperations = campaign.metrics.apiCallsUsed;
    const successfulOperations = totalOperations - campaign.metrics.errorsEncountered;
    const efficiency = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0;

    const errorRate = totalOperations > 0 ? (campaign.metrics.errorsEncountered / totalOperations) * 100 : 0;

    const totalClassified = campaign.metrics.positiveTweets + 
                           campaign.metrics.negativeTweets + 
                           campaign.metrics.neutralTweets;
    const sentimentAccuracy = campaign.metrics.tweetsCollected > 0 ? 
                             (totalClassified / campaign.metrics.tweetsCollected) * 100 : 0;

    const elapsedTime = (new Date().getTime() - campaign.startTime.getTime()) / 60000; // minutes
    const expectedTime = campaign.progress.total / (campaign.speed.tweetsPerMinute || 1);
    const timeUtilization = expectedTime > 0 ? Math.min((elapsedTime / expectedTime) * 100, 100) : 0;

    return {
      efficiency: Math.round(efficiency),
      errorRate: Math.round(errorRate * 100) / 100,
      sentimentAccuracy: Math.round(sentimentAccuracy),
      timeUtilization: Math.round(timeUtilization)
    };
  }

  predictCompletionTime(campaign: ScrapingStatus): Date | null {
    if (campaign.status === 'completed' || campaign.speed.tweetsPerMinute === 0) {
      return null;
    }

    const remaining = campaign.progress.total - campaign.progress.completed;
    const minutesRemaining = remaining / campaign.speed.tweetsPerMinute;
    
    return new Date(Date.now() + minutesRemaining * 60000);
  }

  getProgressTrend(campaign: ScrapingStatus): 'increasing' | 'decreasing' | 'stable' {
    // This would ideally use historical data
    // For now, we'll simulate based on current metrics
    
    if (campaign.metrics.errorsEncountered > 10) {
      return 'decreasing';
    }
    
    if (campaign.speed.tweetsPerMinute > 15) {
      return 'increasing';
    }
    
    return 'stable';
  }

  private getCurrentCampaignData(campaignId: string): ScrapingStatus | null {
    // This would fetch current campaign data
    // For now, return null as we don't have access to the service data
    return null;
  }

  private generateProgressCSV(campaign: ScrapingStatus): string {
    const headers = [
      'Timestamp',
      'Campaign ID',
      'Campaign Name',
      'Status',
      'Progress %',
      'Tweets Collected',
      'Positive',
      'Negative', 
      'Neutral',
      'API Calls',
      'Errors',
      'Speed (tweets/min)',
      'Current Activity'
    ];

    const row = [
      new Date().toISOString(),
      campaign.campaignId,
      campaign.campaignName,
      campaign.status,
      campaign.progress.percentage,
      campaign.metrics.tweetsCollected,
      campaign.metrics.positiveTweets,
      campaign.metrics.negativeTweets,
      campaign.metrics.neutralTweets,
      campaign.metrics.apiCallsUsed,
      campaign.metrics.errorsEncountered,
      campaign.speed.tweetsPerMinute,
      campaign.currentActivity
    ];

    return [headers.join(','), row.join(',')].join('\n');
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  exportDetailedAnalytics(campaign: ScrapingStatus): void {
    const analytics = {
      campaign: {
        id: campaign.campaignId,
        name: campaign.campaignName,
        status: campaign.status,
        duration: {
          started: campaign.startTime,
          estimated_end: campaign.estimatedEndTime,
          elapsed_minutes: (new Date().getTime() - campaign.startTime.getTime()) / 60000
        }
      },
      progress: campaign.progress,
      metrics: campaign.metrics,
      performance: this.calculateEfficiencyMetrics(campaign),
      predictions: {
        estimated_completion: this.predictCompletionTime(campaign),
        trend: this.getProgressTrend(campaign)
      },
      export_time: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(analytics, null, 2);
    this.downloadJSON(jsonContent, `campaign-${campaign.campaignId}-analytics.json`);
  }

  private downloadJSON(jsonContent: string, filename: string): void {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
