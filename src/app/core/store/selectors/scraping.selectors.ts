/**
 * Scraping Selectors - NgRx selectors for scraping state
 */
import { createSelector } from '@ngrx/store';

// Basic selectors
export const selectScrapingState = (state: any) => state.scraping;
export const selectScrapingError = (state: any) => state.scraping.error;
export const selectScrapingLoading = (state: any) => state.scraping.loading;

// Select campaign-specific scraping data
export const selectCampaignScraping = (campaignId: string) => 
  createSelector(
    selectScrapingState,
    (state) => ({
      isActive: state.activeScraping?.[campaignId] || false,
      progress: state.progress?.[campaignId] || null,
      results: state.lastResults?.[campaignId] || null,
      tweets: state.scrapedTweets?.[campaignId] || []
    })
  );

// Active scraping selectors
export const selectHasActiveScrapings = createSelector(
  selectScrapingState,
  (state) => Object.values(state.activeScraping || {}).some(Boolean)
);

export const selectActiveScrapingIds = createSelector(
  selectScrapingState,
  (state) => Object.entries(state.activeScraping || {})
    .filter(([_, isActive]) => isActive)
    .map(([id]) => id)
);
