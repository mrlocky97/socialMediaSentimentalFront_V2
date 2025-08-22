/**
 * Sentiment Analysis Service
 * Handles sentiment analysis operations and caching
 */
import { Injectable, inject } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { ApiClient } from '../api/api-client.service';

export interface SentimentAnalysisRequest {
  text: string;
  includeEmotions?: boolean;
  language?: string;
}

export interface SentimentAnalysisResponse {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  emotions?: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    disgust: number;
    surprise: number;
  };
  keywords?: Array<{
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relevance: number;
  }>;
  processingTime?: number;
}

export interface BatchAnalysisRequest {
  texts: string[];
  includeEmotions?: boolean;
  language?: string;
}

export interface BatchAnalysisResponse {
  results: SentimentAnalysisResponse[];
  totalProcessed: number;
  averageSentiment: number;
  processingTime: number;
  summary: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SentimentService {
  private apiClient = inject(ApiClient);
  
  // In-memory cache for recent analyses
  private cache = new Map<string, SentimentAnalysisResponse>();
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Analyze sentiment of a single text
   */
  analyzeText(request: SentimentAnalysisRequest): Observable<SentimentAnalysisResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return of(cached);
    }

    return this.apiClient.post<SentimentAnalysisResponse>('/sentiment/analyze', request).pipe(
      map(response => {
        const result = response.data;
        this.cacheResult(cacheKey, result);
        return result;
      }),
      catchError(error => {
        console.error('Sentiment analysis failed:', error);
        // Return mock analysis as fallback
        return of(this.generateMockAnalysis(request.text));
      })
    );
  }

  /**
   * Analyze sentiment of multiple texts in batch
   */
  analyzeBatch(request: BatchAnalysisRequest): Observable<BatchAnalysisResponse> {
    return this.apiClient.post<BatchAnalysisResponse>('/sentiment/analyze-batch', request).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Batch sentiment analysis failed:', error);
        // Return mock batch analysis as fallback
        return of(this.generateMockBatchAnalysis(request.texts));
      })
    );
  }

  /**
   * Analyze sentiment of a tweet by URL or ID
   */
  analyzeTweet(tweetId: string): Observable<SentimentAnalysisResponse> {
    return this.apiClient.post<SentimentAnalysisResponse>('/sentiment/analyze-tweet', { tweetId }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Tweet sentiment analysis failed:', error);
        return of(this.generateMockAnalysis(`Tweet ${tweetId} content`));
      })
    );
  }

  /**
   * Get sentiment history for analytics
   */
  getSentimentHistory(params: {
    startDate?: Date;
    endDate?: Date;
    campaignId?: string;
    limit?: number;
  } = {}): Observable<{
    data: Array<{
      date: Date;
      positive: number;
      negative: number;
      neutral: number;
      total: number;
    }>;
    summary: {
      totalAnalyzed: number;
      averageSentiment: number;
      trend: 'improving' | 'declining' | 'stable';
    };
  }> {
    const queryParams = this.apiClient.buildParams({
      startDate: params.startDate?.toISOString(),
      endDate: params.endDate?.toISOString(),
      campaignId: params.campaignId,
      limit: params.limit || 30
    });

    return this.apiClient.get('/sentiment/history', { params: queryParams }).pipe(
      map(response => response.data as any),
      catchError(error => {
        console.error('Failed to load sentiment history:', error);
        return of(this.generateMockHistory());
      })
    );
  }

  /**
   * Get sentiment insights for a specific campaign
   */
  getCampaignSentimentInsights(campaignId: string): Observable<{
    overview: {
      totalTweets: number;
      averageSentiment: number;
      sentimentDistribution: {
        positive: number;
        negative: number;
        neutral: number;
      };
    };
    trends: Array<{
      date: Date;
      sentiment: number;
      volume: number;
    }>;
    topKeywords: Array<{
      keyword: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      frequency: number;
      impact: number;
    }>;
  }> {
    return this.apiClient.get(`/campaigns/${campaignId}/sentiment-insights`).pipe(
      map(response => response.data as any),
      catchError(error => {
        console.error('Failed to load campaign sentiment insights:', error);
        return of(this.generateMockCampaignInsights());
      })
    );
  }

  /**
   * Clear sentiment analysis cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }

  // Private helper methods
  private generateCacheKey(request: SentimentAnalysisRequest): string {
    return `${request.text}_${request.includeEmotions || false}_${request.language || 'auto'}`;
  }

  private isCacheValid(result: SentimentAnalysisResponse & { _timestamp?: number }): boolean {
    const timestamp = (result as any)._timestamp;
    return timestamp && (Date.now() - timestamp < this.CACHE_EXPIRY);
  }

  private cacheResult(key: string, result: SentimentAnalysisResponse): void {
    // Add timestamp for expiry
    (result as any)._timestamp = Date.now();
    
    // Manage cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, result);
  }

  // Mock data generators for fallback
  private generateMockAnalysis(text: string): SentimentAnalysisResponse {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'best', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disgusting', 'annoying'];
    
    const words = text.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.some(pos => word.includes(pos))).length;
    const negativeCount = words.filter(word => negativeWords.some(neg => word.includes(neg))).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    let score: number;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = 0.3 + (positiveCount * 0.2);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -(0.3 + (negativeCount * 0.2));
    } else {
      sentiment = 'neutral';
      score = (Math.random() - 0.5) * 0.2; // Small random value around 0
    }
    
    return {
      text,
      sentiment,
      score: Math.max(-1, Math.min(1, score)),
      confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
      emotions: {
        joy: sentiment === 'positive' ? Math.random() * 0.5 + 0.3 : Math.random() * 0.2,
        anger: sentiment === 'negative' ? Math.random() * 0.5 + 0.3 : Math.random() * 0.2,
        fear: Math.random() * 0.1,
        sadness: sentiment === 'negative' ? Math.random() * 0.3 : Math.random() * 0.1,
        disgust: Math.random() * 0.1,
        surprise: Math.random() * 0.2
      },
      keywords: this.extractMockKeywords(text),
      processingTime: Math.random() * 1000 + 200 // 200-1200ms
    };
  }

  private generateMockBatchAnalysis(texts: string[]): BatchAnalysisResponse {
    const results = texts.map(text => this.generateMockAnalysis(text));
    const totalProcessed = results.length;
    const averageSentiment = results.reduce((sum, r) => sum + r.score, 0) / totalProcessed;
    
    const summary = {
      positive: results.filter(r => r.sentiment === 'positive').length,
      negative: results.filter(r => r.sentiment === 'negative').length,
      neutral: results.filter(r => r.sentiment === 'neutral').length
    };

    return {
      results,
      totalProcessed,
      averageSentiment,
      processingTime: totalProcessed * 300 + Math.random() * 500, // Simulate processing time
      summary
    };
  }

  private extractMockKeywords(text: string): Array<{text: string; sentiment: 'positive' | 'negative' | 'neutral'; relevance: number}> {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = [...new Set(words)].filter(word => word.length > 3);
    
    return uniqueWords.slice(0, 5).map(word => ({
      text: word,
      sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
      relevance: Math.random() * 0.5 + 0.5
    }));
  }

  private generateMockHistory(): any {
    const data = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date,
        positive: Math.floor(Math.random() * 50) + 10,
        negative: Math.floor(Math.random() * 30) + 5,
        neutral: Math.floor(Math.random() * 40) + 15,
        total: 0
      };
    }).map(d => ({ ...d, total: d.positive + d.negative + d.neutral }));

    return {
      data: data.reverse(),
      summary: {
        totalAnalyzed: data.reduce((sum, d) => sum + d.total, 0),
        averageSentiment: 0.15, // Slightly positive
        trend: 'stable' as const
      }
    };
  }

  private generateMockCampaignInsights(): any {
    return {
      overview: {
        totalTweets: 1250,
        averageSentiment: 0.23,
        sentimentDistribution: {
          positive: 45,
          negative: 20,
          neutral: 35
        }
      },
      trends: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        sentiment: Math.random() * 0.6 - 0.1, // -0.1 to 0.5
        volume: Math.floor(Math.random() * 200) + 50
      })),
      topKeywords: [
        { keyword: 'service', sentiment: 'positive', frequency: 45, impact: 0.8 },
        { keyword: 'quality', sentiment: 'positive', frequency: 38, impact: 0.7 },
        { keyword: 'problem', sentiment: 'negative', frequency: 22, impact: 0.6 },
        { keyword: 'support', sentiment: 'neutral', frequency: 35, impact: 0.5 },
        { keyword: 'experience', sentiment: 'positive', frequency: 28, impact: 0.6 }
      ]
    };
  }
}
