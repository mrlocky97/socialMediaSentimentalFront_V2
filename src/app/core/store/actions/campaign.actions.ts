import { createAction, props } from '@ngrx/store';
import { CampaignRequest } from '../../../features/campaign-dialog/interfaces/campaign-dialog.interface';
import { Campaign } from '../../state/app.state';

// Crear campaña
export const createCampaign = createAction(
  '[Campaign] Create Campaign',
  props<{ campaign: CampaignRequest }>()
);

export const createCampaignSuccess = createAction(
  '[Campaign] Create Campaign Success',
  props<{ campaign: Campaign }>()
);

export const createCampaignFailure = createAction(
  '[Campaign] Create Campaign Failure',
  props<{ error: any }>()
);

// Cargar campañas
export const loadCampaigns = createAction(
  '[Campaign] Load Campaigns',
  props<{ filter?: any; page?: number; pageSize?: number; sort?: any }>()
);

export const loadCampaignsSuccess = createAction(
  '[Campaign] Load Campaigns Success',
  props<{ campaigns: Campaign[] }>()
);

export const loadCampaignsFailure = createAction(
  '[Campaign] Load Campaigns Failure',
  props<{ error: any }>()
);

// Actualizar campaña
export const updateCampaign = createAction(
  '[Campaign] Update Campaign',
  props<{ id: string; campaign: Partial<Campaign> }>()
);

export const updateCampaignSuccess = createAction(
  '[Campaign] Update Campaign Success',
  props<{ campaign: Campaign }>()
);

export const updateCampaignFailure = createAction(
  '[Campaign] Update Campaign Failure',
  props<{ error: any }>()
);

// Eliminar campaña
export const deleteCampaign = createAction(
  '[Campaign] Delete Campaign',
  props<{ id: string }>()
);

export const deleteCampaignSuccess = createAction(
  '[Campaign] Delete Campaign Success',
  props<{ id: string }>()
);

export const deleteCampaignFailure = createAction(
  '[Campaign] Delete Campaign Failure',
  props<{ error: any }>()
);

// Iniciar campaña
export const startCampaign = createAction(
  '[Campaign] Start Campaign',
  props<{ id: string }>()
);

export const startCampaignSuccess = createAction(
  '[Campaign] Start Campaign Success',
  props<{ id: string }>()
);

export const startCampaignFailure = createAction(
  '[Campaign] Start Campaign Failure',
  props<{ error: any }>()
);

// Detener campaña
export const stopCampaign = createAction(
  '[Campaign] Stop Campaign',
  props<{ id: string }>()
);

export const stopCampaignSuccess = createAction(
  '[Campaign] Stop Campaign Success',
  props<{ id: string }>()
);

export const stopCampaignFailure = createAction(
  '[Campaign] Stop Campaign Failure',
  props<{ error: any }>()
);

// Limpiar campañas
export const clearCampaigns = createAction(
  '[Campaign] Clear Campaigns'
);
