/**
 * Index del módulo de NgRx para las campañas y scraping
 * Este archivo centraliza todas las exportaciones relacionadas con el state management
 */
import { ActionReducerMap } from '@ngrx/store';
import { CampaignEffects } from './effects/campaign.effects';
import { ScrapingEffects } from './effects/scraping.effects';
import * as fromCampaign from './reducers/campaign.reducer';
import * as fromScraping from './reducers/scraping.reducer';

export interface AppState {
  campaigns: fromCampaign.CampaignState;
  scraping: fromScraping.ScrapingState;
}

export const reducers: ActionReducerMap<AppState> = {
  campaigns: fromCampaign.campaignReducer,
  scraping: fromScraping.scrapingReducer
};

export const effects = [
  CampaignEffects,
  ScrapingEffects
];

// Exporta todos los selectores, acciones y facades para facilitar su importación
export * from './actions/campaign.actions';
export * from './actions/scraping.actions';
export * from './fecades/campaign.facade';
export * from './fecades/scraping.facade';
export * from './selectors/campaign.selectors';
export * from './selectors/scraping.selectors';

