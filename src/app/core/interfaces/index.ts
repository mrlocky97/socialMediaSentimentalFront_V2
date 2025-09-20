/**
 * CORE INTERFACES INDEX
 * Exportación central de todas las interfaces core de la aplicación
 * Esta es la fuente única de verdad para imports de interfaces
 */

// Existing interfaces
export * from './repositories.interface';
export * from './scraping.interface';

// Tweet interfaces (exported before campaign to avoid CampaignStats conflict)
export type {
  LanguageDistribution, SentimentCounts,
  SentimentPercents,
  TopAuthor,
  TopHashtag, TopKeyword, TopMention, Tweet,
  TweetAuthor, TweetFilter, TweetMetrics, TweetsByDay, TweetSentiment,
  TweetSentimentEmotions,
  TweetsResponse, TweetWithCalculatedFields, TypeDistribution
} from './tweet.interface';

// Campaign interfaces unificadas (ÚNICA fuente de verdad)
// Note: CampaignStats is now exported from campaign.interface (unified version)
export * from './campaign.interface';

// Type utilities and re-exports for compatibility
export type {
  Campaign, CampaignModel, CampaignState as NgRxCampaignState,
  CampaignFilters as UnifiedCampaignFilters
} from './campaign.interface';
