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

// Selectores adicionales para reemplazar CampaignsStore functionality
export const selectCampaignStats = createSelector(
  selectAllCampaigns,
  (campaigns) => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    draft: campaigns.filter(c => c.status === 'inactive').length,
    completed: campaigns.filter(c => c.status === 'completed').length
  })
);

export const selectStatusCounts = createSelector(
  selectAllCampaigns,
  (campaigns) => ({
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    inactive: campaigns.filter(c => c.status === 'inactive').length,
  })
);

export const selectTypeCounts = createSelector(
  selectAllCampaigns,
  (campaigns) => ({
    hashtag: campaigns.filter(c => c.type === 'hashtag').length,
    keyword: campaigns.filter(c => c.type === 'keyword').length,
    user: campaigns.filter(c => c.type === 'user').length,
    mention: campaigns.filter(c => c.type === 'mention').length,
  })
);

export const selectRecentCampaigns = createSelector(
  selectAllCampaigns,
  (campaigns) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return campaigns.filter(campaign => new Date(campaign.createdAt) >= thirtyDaysAgo);
  }
);

export const selectCampaignSummary = createSelector(
  selectAllCampaigns,
  selectStatusCounts,
  (campaigns, statusCounts) => ({
    totalCampaigns: campaigns.length,
    activeCampaigns: statusCounts.active,
    pausedCampaigns: statusCounts.paused,
    completedCampaigns: statusCounts.completed,
    totalTweets: campaigns.reduce((sum, c) => sum + (c.maxTweets || 0), 0),
    totalHashtags: campaigns.reduce((sum, c) => sum + c.hashtags.length, 0),
    totalKeywords: campaigns.reduce((sum, c) => sum + c.keywords.length, 0),
    averageSentiment: 0.65, // TODO: Calculate from actual sentiment data
    topPerformingCampaign: campaigns.find(c => c.status === 'active'),
    recentActivity: campaigns.slice(0, 5).map(c => ({
      campaignId: c.id,
      campaignName: c.name,
      action: `Campaign ${c.status}`,
      timestamp: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    })),
  })
);

export const selectIsEmpty = createSelector(
  selectAllCampaigns,
  (campaigns) => campaigns.length === 0
);

export const selectHasItems = createSelector(
  selectAllCampaigns,
  (campaigns) => campaigns.length > 0
);

export const selectTotalCount = createSelector(
  selectAllCampaigns,
  (campaigns) => campaigns.length
);

export const selectHasSelection = createSelector(
  selectSelectedCampaign,
  (selected) => selected !== null
);
