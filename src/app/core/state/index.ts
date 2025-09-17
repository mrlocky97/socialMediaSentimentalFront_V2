/**
 * State Management Stores - Centralized Signal-based State
 * 
 * This module exports application stores that follow the
 * Signal-based architecture pattern for state management.
 * 
 * Note: Campaigns now use NgRx exclusively (CampaignFacade)
 * 
 * Pattern:
 * - Components consume computed signals (readonly)
 * - Components emit actions to stores (methods)
 * - Stores manage internal state with private signals
 * - No direct signal mutation from components
 */

export { SessionStore } from './session.store';
export { TweetsStore } from './tweets.store';
// CampaignsStore removed - now using NgRx CampaignFacade exclusively

// Re-export types for convenience
export type { SessionState } from './session.store';
export type { Tweet, TweetFilters, TweetsState } from './tweets.store';
// CampaignsState types removed - now in NgRx selectors
