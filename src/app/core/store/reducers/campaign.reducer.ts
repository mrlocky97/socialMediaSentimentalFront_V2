import { createReducer, on } from "@ngrx/store";
import * as CampaignActions from '../actions/campaign.actions';
import { Campaign } from "../../state/app.state";

export interface CampaignState {
  list: Campaign[];
  selectedCampaign: Campaign | null;
  loading: boolean;
  error: string | null;
}

export const initialState: CampaignState = {
  list: [],
  selectedCampaign: null,
  loading: false,
  error: null
};

export const campaignReducer = createReducer(
  initialState,

  // Crear campaña
  on(CampaignActions.createCampaign, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CampaignActions.createCampaignSuccess, (state, { campaign }) => ({
    ...state,
    list: [...state.list, campaign],
    loading: false,
  })),

  on(CampaignActions.createCampaignFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error.message || 'Failed to create campaign',
  })),

  // Cargar campañas
  on(CampaignActions.loadCampaigns, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CampaignActions.loadCampaignsSuccess, (state, { campaigns }) => ({
    ...state,
    list: campaigns,
    loading: false,
  })),

  on(CampaignActions.loadCampaignsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error.message || 'Failed to load campaigns',
  })),

  // Actualizar campaña
  on(CampaignActions.updateCampaign, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CampaignActions.updateCampaignSuccess, (state, { campaign }) => ({
    ...state,
    list: state.list.map(c => c.id === campaign.id ? campaign : c),
    selectedCampaign: state.selectedCampaign?.id === campaign.id ? campaign : state.selectedCampaign,
    loading: false,
  })),

  on(CampaignActions.updateCampaignFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error.message || 'Failed to update campaign',
  })),

  // Eliminar campaña
  on(CampaignActions.deleteCampaign, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CampaignActions.deleteCampaignSuccess, (state, { id }) => ({
    ...state,
    list: state.list.filter(c => c.id !== id),
    selectedCampaign: state.selectedCampaign?.id === id ? null : state.selectedCampaign,
    loading: false,
  })),

  on(CampaignActions.deleteCampaignFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error.message || 'Failed to delete campaign',
  })),

  // Iniciar campaña
  on(CampaignActions.startCampaign, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CampaignActions.startCampaignSuccess, (state, { id }) => ({
    ...state,
    list: state.list.map(c => c.id === id ? { ...c, status: 'active' } : c),
    selectedCampaign: state.selectedCampaign?.id === id 
      ? { ...state.selectedCampaign, status: 'active' } 
      : state.selectedCampaign,
    loading: false,
  })),

  on(CampaignActions.startCampaignFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error.message || 'Failed to start campaign',
  })),

  // Detener campaña
  on(CampaignActions.stopCampaign, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CampaignActions.stopCampaignSuccess, (state, { id }) => ({
    ...state,
    list: state.list.map(c => c.id === id ? { ...c, status: 'paused' } : c),
    selectedCampaign: state.selectedCampaign?.id === id 
      ? { ...state.selectedCampaign, status: 'paused' } 
      : state.selectedCampaign,
    loading: false,
  })),

  on(CampaignActions.stopCampaignFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error.message || 'Failed to stop campaign',
  })),

  // Limpiar campañas
  on(CampaignActions.clearCampaigns, (state) => ({
    ...state,
    list: [],
    selectedCampaign: null,
  }))
);
