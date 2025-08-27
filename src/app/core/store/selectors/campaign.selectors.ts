import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CampaignState } from '../reducers/campaign.reducer';

export const selectCampaignState = createFeatureSelector<CampaignState>('campaigns');

export const selectAllCampaigns = createSelector(
  selectCampaignState,
  (state: CampaignState) => state.list
);

export const selectCampaignsLoading = createSelector(
  selectCampaignState,
  (state: CampaignState) => state.loading
);

export const selectCampaignsError = createSelector(
  selectCampaignState,
  (state: CampaignState) => state.error
);

export const selectSelectedCampaign = createSelector(
  selectCampaignState,
  (state: CampaignState) => state.selectedCampaign
);

export const selectActiveCampaigns = createSelector(
  selectAllCampaigns,
  (campaigns) => campaigns.filter(c => c.status === 'active')
);

export const selectCampaignById = (id: string) => createSelector(
  selectAllCampaigns,
  (campaigns) => campaigns.find(campaign => campaign.id === id) || null
);

export const selectCampaignCount = createSelector(
  selectAllCampaigns,
  (campaigns) => campaigns.length
);

export const selectActiveCampaignCount = createSelector(
  selectActiveCampaigns,
  (campaigns) => campaigns.length
);

export const selectCampaignsByStatus = (status: string) => createSelector(
  selectAllCampaigns,
  (campaigns) => campaigns.filter(campaign => campaign.status === status)
);

export const selectCampaignsByType = (type: string) => createSelector(
  selectAllCampaigns,
  (campaigns) => campaigns.filter(campaign => campaign.type === type)
);
