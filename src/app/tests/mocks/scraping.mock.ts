/**
 * Mock data for testing scraping functionality
 * This file centralizes all mock data related to scraping features
 */

import { BulkScrapeSummary, ScrapeOpts } from '../../core/services/backend-api.service';
import { ScrapingProgress } from '../../core/services/scraping.service';
import { Campaign } from '../../core/state/app.state';

/**
 * Mock campaign with various tracking parameters
 */
export const MOCK_CAMPAIGN: Campaign = {
  id: 'campaign-1',
  name: 'Test Campaign',
  description: 'Test campaign description',
  hashtags: ['#test1', '#test2', '#test3'],
  keywords: ['keyword1', 'keyword2'],
  mentions: ['@user1', '@user2'],
  languages: ['es', 'en'],
  dataSources: ['twitter'],
  status: 'active',
  createdAt: new Date(),
  type: 'hashtag',
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  sentimentAnalysis: true,
  organizationId: 'org-1',
  maxTweets: 500
};

/**
 * Mock scraping options
 */
export const MOCK_SCRAPE_OPTS: ScrapeOpts = {
  limit: 30,
  language: 'es',
  includeReplies: false,
  analyzeSentiment: true,
  campaignId: 'campaign-1'
};

/**
 * Mock successful scraping response
 */
export const MOCK_SCRAPE_SUCCESS_RESPONSE: BulkScrapeSummary = {
  success: true,
  data: {
    items: [
      {
        type: 'hashtag',
        identifier: 'test1',
        requested: 1,
        totalFound: 10,
        totalScraped: 10,
        saved: 10
      }
    ],
    totalTweets: 10,
    campaignId: 'campaign-1'
  }
};

/**
 * Mock scraping response with errors
 */
export const MOCK_SCRAPE_ERROR_RESPONSE: BulkScrapeSummary = {
  success: false,
  data: {
    items: [
      {
        type: 'hashtag',
        identifier: 'error-tag',
        requested: 1,
        totalFound: 0,
        totalScraped: 0,
        saved: 0,
        errors: [
          { message: 'API rate limit exceeded' }
        ]
      }
    ],
    totalTweets: 0
  },
  message: 'Error processing request'
};

/**
 * Mock initial scraping progress state
 */
export const MOCK_INITIAL_PROGRESS: ScrapingProgress = {
  hashtags: { completed: 0, total: 0, inProgress: false },
  search: { completed: 0, total: 0, inProgress: false },
  users: { completed: 0, total: 0, inProgress: false },
  metrics: { totalScraped: 0, saved: 0, errors: 0 },
  status: 'idle',
  progress: 0
};
