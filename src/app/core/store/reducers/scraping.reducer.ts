/**
 * Scraping Reducers - NgRx reducers for scraping operations
 */
import { createReducer, on } from '@ngrx/store';
import { ScrapingProgress } from '../../services/scraping.service';
import * as ScrapingActions from '../actions/scraping.actions';

export interface ScrapingState {
  activeScraping: Record<string, boolean>; // Map of campaignId -> isActive
  progress: Record<string, ScrapingProgress>; // Map of campaignId -> progress
  lastResults: Record<string, any>; // Map of campaignId -> result
  scrapedTweets: Record<string, any[]>; // Map of campaignId -> tweets
  loading: boolean;
  error: string | null;
  statuses: Record<string, any>; // Map of campaignId -> status
}

export const initialState: ScrapingState = {
  activeScraping: {},
  progress: {},
  lastResults: {},
  scrapedTweets: {},
  loading: false,
  error: null,
  statuses: {}
};

export const scrapingReducer = createReducer(
  initialState,
  
  // Start scraping
  on(ScrapingActions.startScraping, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ScrapingActions.startScrapingSuccess, (state, { campaignId }) => ({
    ...state,
    activeScraping: { 
      ...state.activeScraping, 
      [campaignId]: true 
    },
    loading: false
  })),
  
  on(ScrapingActions.startScrapingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error?.message || 'Failed to start scraping'
  })),
  
  // Update progress
  on(ScrapingActions.updateScrapingProgress, (state, { progress }) => {
    // Get campaign ID from the progress object (might be in different places depending on implementation)
    const campaignId = (progress as any).campaignId || Object.keys(state.activeScraping).find(id => state.activeScraping[id]) || '';
    
    if (!campaignId) return state;
    
    return {
      ...state,
      progress: {
        ...state.progress,
        [campaignId]: progress
      }
    };
  }),
  
  // Cancel scraping
  on(ScrapingActions.cancelScraping, (state) => ({
    ...state,
    loading: true
  })),
  
  on(ScrapingActions.cancelScrapingSuccess, (state, { campaignId }) => ({
    ...state,
    activeScraping: {
      ...state.activeScraping,
      [campaignId]: false
    },
    loading: false
  })),
  
  on(ScrapingActions.cancelScrapingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error?.message || 'Failed to cancel scraping'
  })),
  
  // Scraping completed
  on(ScrapingActions.scrapingCompleted, (state, { campaignId, result }) => ({
    ...state,
    activeScraping: {
      ...state.activeScraping,
      [campaignId]: false
    },
    lastResults: {
      ...state.lastResults,
      [campaignId]: result
    }
  })),
  
  // Get status
  on(ScrapingActions.getScrapingStatus, (state) => ({
    ...state,
    loading: true
  })),
  
  on(ScrapingActions.getScrapingStatusSuccess, (state, { status }) => {
    const campaignId = status.campaignId || '';
    
    return {
      ...state,
      statuses: {
        ...state.statuses,
        [campaignId]: status
      },
      loading: false
    };
  }),
  
  on(ScrapingActions.getScrapingStatusFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error?.message || 'Failed to get scraping status'
  })),
  
  // Fetch tweets
  on(ScrapingActions.fetchScrapedTweets, (state) => ({
    ...state,
    loading: true
  })),
  
  on(ScrapingActions.fetchScrapedTweetsSuccess, (state, { campaignId, tweets }) => ({
    ...state,
    scrapedTweets: {
      ...state.scrapedTweets,
      [campaignId]: tweets
    },
    loading: false
  })),
  
  on(ScrapingActions.fetchScrapedTweetsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error?.message || 'Failed to fetch scraped tweets'
  })),
  
  // Clear state
  on(ScrapingActions.clearScrapingState, () => ({
    ...initialState
  }))
);
