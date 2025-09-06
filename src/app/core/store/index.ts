/**
 * Index del módulo de NgRx para las campañas, scraping y tweets
 * Este archivo centraliza todas las exportaciones relacionadas con el state management
 */
import { ActionReducerMap } from '@ngrx/store';
import { CampaignEffects } from './effects/campaign.effects';
import { ScrapingEffects } from './effects/scraping.effects';
import { TweetEffects } from './effects/tweet.effects';
import * as fromCampaign from './reducers/campaign.reducer';
import * as fromScraping from './reducers/scraping.reducer';
import * as fromTweet from './reducers/tweet.reducer';

export interface AppState {
  campaigns: fromCampaign.CampaignState;
  scraping: fromScraping.ScrapingState;
  tweets: fromTweet.TweetState;
}

export const reducers: ActionReducerMap<AppState> = {
  campaigns: fromCampaign.campaignReducer,
  scraping: fromScraping.scrapingReducer,
  tweets: fromTweet.tweetReducer
};

export const effects = [
  CampaignEffects,
  ScrapingEffects,
  TweetEffects
];

// Exporta todos los selectores, acciones y facades para facilitar su importación
export * from './actions/campaign.actions';
export * from './actions/scraping.actions';
export * from './actions/tweet.actions';
export * from './fecades/campaign.facade';
export * from './fecades/scraping.facade';
export * from './fecades/tweet.facade';
export * from './selectors/campaign.selectors';
export * from './selectors/scraping.selectors';
export * from './selectors/tweet.selectors';

