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
  statuses: {},
};

export const scrapingReducer = createReducer(
  initialState,

  on(ScrapingActions.hashtagScraping, (state, { campaign }) => ({
    ...state,
    loading: true,
    error: null,
    activeScraping: { ...state.activeScraping, [campaign.id]: true },
  })),

  on(ScrapingActions.hashtagScrapingSuccess, (state, { campaignId }) => ({
    ...state,
    loading: false,
    activeScraping: { ...state.activeScraping, [campaignId]: false },
    error: null,
  })),

  on(ScrapingActions.hashtagScrapingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error.message || 'Unknown error',
  }))
);
