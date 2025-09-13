/**
 * Scraping Selectors - NgRx selectors for scraping state
 */
import { createSelector } from '@ngrx/store';
import { ScrapingState } from '../reducers/scraping.reducer';

// Basic selectors
export const selectScrapingState = (state: any): ScrapingState => state.scraping;
export const selectScrapingError = createSelector(selectScrapingState, (state) => state.error);
export const selectScrapingLoading = createSelector(selectScrapingState, (state) => state.loading);

// Advanced Job selectors
export const selectJobs = createSelector(selectScrapingState, (state) => state.jobs);
export const selectCurrentJob = createSelector(selectScrapingState, (state) => state.currentJob);
export const selectIsCreatingJob = createSelector(selectScrapingState, (state) => state.isCreatingJob);
export const selectIsLoadingJobs = createSelector(selectScrapingState, (state) => state.isLoadingJobs);

// Job-specific selectors
export const selectJobById = (jobId: string) =>
  createSelector(selectJobs, (jobs) => jobs.find(job => job.id === jobId));

export const selectJobsByStatus = (status: string) =>
  createSelector(selectJobs, (jobs) => jobs.filter(job => job.status === status));

export const selectRunningJobs = createSelector(selectJobs, (jobs) => 
  jobs.filter(job => job.status === 'running'));

export const selectJobsCount = createSelector(selectJobs, (jobs) => jobs.length);

export const selectRunningJobsCount = createSelector(selectRunningJobs, (jobs) => jobs.length);

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
