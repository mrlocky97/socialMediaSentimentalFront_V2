/**
 * State Management Stores - Centralized Signal-based State
 * 
 * This module exports all the application stores that follow the
 * Signal-based architecture pattern for state management.
 * 
 * Pattern:
 * - Components consume computed signals (readonly)
 * - Components emit actions to stores (methods)
 * - Stores manage internal state with private signals
 * - No direct signal mutation from components
 */

export { SessionStore } from './session.store';
export { TweetsStore } from './tweets.store';
export { CampaignsStore } from './campaigns.store';

// Re-export types for convenience
export type { SessionState } from './session.store';
export type { TweetsState, Tweet, TweetFilters } from './tweets.store';
export type { CampaignsState, CampaignSummary, CampaignsFilters } from './campaigns.store';
