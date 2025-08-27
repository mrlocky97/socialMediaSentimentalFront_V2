// ... existing imports and state definition

import { createReducer, on } from "@ngrx/store";

export const campaignReducer = createReducer(
  initialState,

  // ... otros reducers

  // --- Reducer para crear campaña ---
  on(CampaignActions.createCampaign, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CampaignActions.createCampaignSuccess, (state, { campaign }) => ({
    ...state,
    list: [...state.list, campaign], // Agrega la nueva campaña a la lista
    loading: false,
  })),

  on(CampaignActions.createCampaignFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error: error.message || 'Failed to create campaign',
  }))
);
