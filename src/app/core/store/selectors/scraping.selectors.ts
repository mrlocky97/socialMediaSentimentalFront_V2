/**
 * Scraping Selectors - NgRx selectors for scraping state
 */
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ScrapingState } from '../reducers/scraping.reducer';

// Feature selector
export const selectScrapingState = createFeatureSelector<ScrapingState>('scraping');

// Selectors for specific pieces of state
export const selectScrapingLoading = createSelector(
  selectScrapingState,
  (state: ScrapingState) => state.loading
);

export const selectScrapingError = createSelector(
  selectScrapingState,
  (state: ScrapingState) => state.error
);

export const selectActiveScrapings = createSelector(
  selectScrapingState,
  (state: ScrapingState) => state.activeScraping
);

export const selectCampaignIsActivelyScraped = (campaignId: string) => createSelector(
  selectScrapingState,
  (state: ScrapingState) => !!state.activeScraping[campaignId]
);

export const selectScrapingProgress = (campaignId: string) => createSelector(
  selectScrapingState,
  (state: ScrapingState) => state.progress[campaignId] || null
);

export const selectScrapingResults = (campaignId: string) => createSelector(
  selectScrapingState,
  (state: ScrapingState) => state.lastResults[campaignId] || null
);

export const selectScrapedTweets = (campaignId: string) => createSelector(
  selectScrapingState,
  (state: ScrapingState) => state.scrapedTweets[campaignId] || []
);

export const selectScrapingStatus = (campaignId: string) => createSelector(
  selectScrapingState,
  (state: ScrapingState) => state.statuses[campaignId] || null
);

export const selectHasActiveScrapings = createSelector(
  selectActiveScrapings,
  (activeScrapings: Record<string, boolean>) => Object.values(activeScrapings).some(active => active)
);

export const selectActiveScrapingIds = createSelector(
  selectActiveScrapings,
  (activeScrapings: Record<string, boolean>) => 
    Object.entries(activeScrapings)
      .filter(([_, active]) => active)
      .map(([id, _]) => id)
);
