import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CampaignStatus } from '../scraping-monitor.component';
import { environment } from '../../../../enviroments/environment';

// Define ScrapingStatus interface for the service
export interface ScrapingStatus {
  campaignId: string;
  campaignName: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  startTime: Date;
  estimatedEndTime?: Date;
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
  metrics: {
    tweetsCollected: number;
    positiveTweets: number;
    negativeTweets: number;
    neutralTweets: number;
    apiCallsUsed: number;
    errorsEncountered: number;
  };
  currentActivity: string;
  speed: {
    tweetsPerMinute: number;
    apiCallsPerMinute: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ScrapingMonitorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/scraping`;

  async getActiveCampaigns(): Promise<ScrapingStatus[]> {
    try {
      const response = await this.http.get<{ campaigns: ScrapingStatus[] }>(
        `${this.apiUrl}/active`
      ).toPromise();
      
      return response?.campaigns || [];
    } catch (error) {
      console.error('Failed to fetch active campaigns:', error);
      // Return mock data for development
      return this.getMockActiveCampaigns();
    }
  }

  async getCampaignStatus(campaignId: string): Promise<ScrapingStatus | null> {
    try {
      const response = await this.http.get<ScrapingStatus>(
        `${this.apiUrl}/status/${campaignId}`
      ).toPromise();
      
      return response || null;
    } catch (error) {
      console.error('Failed to fetch campaign status:', error);
      return null;
    }
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    await this.http.post(`${this.apiUrl}/pause/${campaignId}`, {}).toPromise();
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    await this.http.post(`${this.apiUrl}/resume/${campaignId}`, {}).toPromise();
  }

  async stopCampaign(campaignId: string): Promise<void> {
    await this.http.post(`${this.apiUrl}/stop/${campaignId}`, {}).toPromise();
  }

  async startCampaign(campaignId: string): Promise<void> {
    await this.http.post(`${this.apiUrl}/start/${campaignId}`, {}).toPromise();
  }

  // Mock data for development
  private getMockActiveCampaigns(): ScrapingStatus[] {
    return [
      {
        campaignId: 'camp_001',
        campaignName: 'Summer Campaign 2025',
        status: 'running',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        estimatedEndTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        progress: {
          total: 1000,
          completed: 650,
          percentage: 65
        },
        metrics: {
          tweetsCollected: 650,
          positiveTweets: 320,
          negativeTweets: 180,
          neutralTweets: 150,
          apiCallsUsed: 1200,
          errorsEncountered: 5
        },
        currentActivity: 'Collecting tweets for #summer hashtag',
        speed: {
          tweetsPerMinute: 12,
          apiCallsPerMinute: 25
        }
      },
      {
        campaignId: 'camp_002',
        campaignName: 'Brand Awareness Q3',
        status: 'paused',
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        progress: {
          total: 500,
          completed: 200,
          percentage: 40
        },
        metrics: {
          tweetsCollected: 200,
          positiveTweets: 120,
          negativeTweets: 30,
          neutralTweets: 50,
          apiCallsUsed: 400,
          errorsEncountered: 2
        },
        currentActivity: 'Paused by user',
        speed: {
          tweetsPerMinute: 0,
          apiCallsPerMinute: 0
        }
      },
      {
        campaignId: 'camp_003',
        campaignName: 'Product Launch Monitor',
        status: 'completed',
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        estimatedEndTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        progress: {
          total: 2000,
          completed: 2000,
          percentage: 100
        },
        metrics: {
          tweetsCollected: 2000,
          positiveTweets: 1200,
          negativeTweets: 400,
          neutralTweets: 400,
          apiCallsUsed: 3500,
          errorsEncountered: 8
        },
        currentActivity: 'Collection completed',
        speed: {
          tweetsPerMinute: 0,
          apiCallsPerMinute: 0
        }
      },
      {
        campaignId: 'camp_004',
        campaignName: 'Crisis Monitoring',
        status: 'error',
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        progress: {
          total: 800,
          completed: 50,
          percentage: 6
        },
        metrics: {
          tweetsCollected: 50,
          positiveTweets: 10,
          negativeTweets: 30,
          neutralTweets: 10,
          apiCallsUsed: 100,
          errorsEncountered: 25
        },
        currentActivity: 'Error: API rate limit exceeded',
        speed: {
          tweetsPerMinute: 0,
          apiCallsPerMinute: 0
        }
      }
    ];
  }
}
