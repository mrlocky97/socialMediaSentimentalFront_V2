/**
 * Index del módulo de NgRx para las campañas
 * Este archivo centraliza todas las exportaciones relacionadas con el state management
 */
import { ActionReducerMap } from '@ngrx/store';
import * as fromCampaign from './reducers/campaign.reducer';
import { CampaignEffects } from './effects/campaign.effects';

export interface AppState {
  campaigns: fromCampaign.CampaignState;
}

export const reducers: ActionReducerMap<AppState> = {
  campaigns: fromCampaign.campaignReducer
};

export const effects = [
  CampaignEffects
];

// Exporta todos los selectores, acciones y facades para facilitar su importación
export * from './selectors/campaign.selectors';
export * from './actions/campaign.actions';
export * from './fecades/campaign.facade';
