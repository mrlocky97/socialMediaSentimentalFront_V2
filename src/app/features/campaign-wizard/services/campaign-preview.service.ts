import { Injectable } from '@angular/core';
import { CampaignFormData } from '../campaign-wizardcomponent';

export interface CampaignPreview {
  summary: {
    name: string;
    type: string;
    duration: string;
    targetCount: number;
  };
  targeting: {
    hashtags: string[];
    keywords: string[];
    mentions: string[];
  };
  settings: {
    startDate: string;
    endDate: string;
    maxTweets: number;
    sentimentAnalysis: boolean;
  };
  estimatedCost: {
    apiCalls: number;
    storageGB: number;
    processingHours: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CampaignPreviewService {

  generatePreview(formData: CampaignFormData): CampaignPreview {
    const targetCount = this.calculateTargetCount(formData.targeting);
    const duration = this.calculateDuration(new Date(formData.settings.startDate), new Date(formData.settings.endDate));
    const estimatedCost = this.calculateEstimatedCost(formData);

    return {
      summary: {
        name: formData.basic.name,
        type: this.getTypeLabel(formData.basic.type),
        duration,
        targetCount
      },
      targeting: formData.targeting,
      settings: formData.settings,
      estimatedCost
    };
  }

  private calculateTargetCount(targeting: any): number {
    const hashtags = targeting.hashtags?.length || 0;
    const keywords = targeting.keywords?.length || 0;
    const mentions = targeting.mentions?.length || 0;
    return hashtags + keywords + mentions;
  }

  private calculateDuration(startDate: Date, endDate: Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  }

  private getTypeLabel(type: string): string {
    switch (type) {
      case 'hashtag': return 'Hashtag Tracking';
      case 'keyword': return 'Keyword Monitoring';
      case 'user': return 'User Mentions';
      default: return type;
    }
  }

  private calculateEstimatedCost(formData: CampaignFormData): any {
    const maxTweets = formData.settings.maxTweets;
    const targetCount = this.calculateTargetCount(formData.targeting);
    
    // Rough estimates based on campaign complexity
    const apiCallsPerTarget = maxTweets / targetCount;
    const storagePerTweet = 0.002; // 2KB per tweet
    const processingTimePerTweet = 0.1; // 0.1 seconds per tweet

    return {
      apiCalls: Math.ceil(apiCallsPerTarget * targetCount),
      storageGB: Math.ceil((maxTweets * storagePerTweet) / 1024),
      processingHours: Math.ceil((maxTweets * processingTimePerTweet) / 3600)
    };
  }

  getConfidenceLevel(preview: CampaignPreview): 'high' | 'medium' | 'low' {
    if (preview.summary.targetCount >= 3 && preview.estimatedCost.apiCalls < 5000) {
      return 'high';
    } else if (preview.summary.targetCount >= 1 && preview.estimatedCost.apiCalls < 10000) {
      return 'medium';
    }
    return 'low';
  }

  getRecommendations(preview: CampaignPreview): string[] {
    const recommendations: string[] = [];

    if (preview.summary.targetCount < 2) {
      recommendations.push('Consider adding more targeting options for better coverage');
    }

    if (preview.estimatedCost.apiCalls > 8000) {
      recommendations.push('High API usage expected - consider reducing max tweets or date range');
    }

    if (preview.targeting.hashtags.length === 0 && preview.summary.type === 'Hashtag Tracking') {
      recommendations.push('Add hashtags for better hashtag tracking results');
    }

    if (!preview.settings.sentimentAnalysis) {
      recommendations.push('Enable sentiment analysis for deeper insights');
    }

    return recommendations;
  }
}
