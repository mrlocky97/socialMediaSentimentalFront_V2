import { Injectable, computed, inject, signal } from '@angular/core';
import { CampaignService } from '../services/campaign.service';
import { Campaign } from '../state/app.state';

export interface CampaignSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  completedCampaigns: number;
  totalTweets: number;
  totalHashtags: number;
  totalKeywords: number;
  averageSentiment: number;
  topPerformingCampaign?: Campaign;
  recentActivity: Array<{
    campaignId: string;
    campaignName: string;
    action: string;
    timestamp: Date;
  }>;
}

export interface CampaignsFilters {
  status?: Campaign['status'][];
  type?: Campaign['type'][];
  searchTerm?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CampaignsState {
  list: Campaign[];
  selected: Campaign | null;
  summary: CampaignSummary | null;
  loading: boolean;
  error: string | null;
  filters: CampaignsFilters;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root',
})
export class CampaignsStore {
  private campaignService = inject(CampaignService);

  // Private signals for internal state management
  private readonly _list = signal<Campaign[]>([]);
  private readonly _selected = signal<Campaign | null>(null);
  private readonly _summary = signal<CampaignSummary | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filters = signal<CampaignsFilters>({
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  private readonly _lastUpdated = signal<Date | null>(null);

  // Public computed signals - readonly access for components
  readonly list = computed(() => this._list());
  readonly selected = computed(() => this._selected());
  readonly summary = computed(() => this._summary());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly filters = computed(() => this._filters());
  readonly lastUpdated = computed(() => this._lastUpdated());

  // Computed derived state
  readonly isEmpty = computed(() => this._list().length === 0);
  readonly hasItems = computed(() => this._list().length > 0);
  readonly totalCount = computed(() => this._list().length);
  readonly hasSelection = computed(() => this._selected() !== null);

  // Filtered and sorted campaigns
  readonly filteredList = computed(() => {
    const campaigns = this._list();
    const filters = this._filters();

    let filtered = campaigns.filter((campaign) => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(campaign.status)) return false;
      }

      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(campaign.type)) return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesName = campaign.name.toLowerCase().includes(term);
        const matchesDescription = campaign.description?.toLowerCase().includes(term);
        const matchesHashtags = campaign.hashtags.some((h) => h.toLowerCase().includes(term));
        const matchesKeywords = campaign.keywords.some((k) => k.toLowerCase().includes(term));

        if (!matchesName && !matchesDescription && !matchesHashtags && !matchesKeywords) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const campaignDate = new Date(campaign.createdAt);
        if (
          campaignDate < filters.dateRange.startDate ||
          campaignDate > filters.dateRange.endDate
        ) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filters.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'createdAt':
            aValue = a.createdAt ? new Date(a.createdAt) : new Date();
            bValue = b.createdAt ? new Date(b.createdAt) : new Date();
            break;
          case 'updatedAt':
            aValue = a.updatedAt ? new Date(a.updatedAt) : new Date();
            bValue = b.updatedAt ? new Date(b.updatedAt) : new Date();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  });

  // Status counts
  readonly statusCounts = computed(() => {
    const campaigns = this._list();
    return {
      active: campaigns.filter((c) => c.status === 'active').length,
      paused: campaigns.filter((c) => c.status === 'paused').length,
      completed: campaigns.filter((c) => c.status === 'completed').length,
      inactive: campaigns.filter((c) => c.status === 'inactive').length,
    };
  });

  // Type counts
  readonly typeCounts = computed(() => {
    const campaigns = this._list();
    return {
      hashtag: campaigns.filter((c) => c.type === 'hashtag').length,
      keyword: campaigns.filter((c) => c.type === 'keyword').length,
      user: campaigns.filter((c) => c.type === 'user').length,
      mention: campaigns.filter((c) => c.type === 'mention').length,
    };
  });

  // Recent campaigns (last 30 days)
  readonly recentCampaigns = computed(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this._list().filter((campaign) => new Date(campaign.createdAt) >= thirtyDaysAgo);
  });

  // Complete state as computed
  readonly state = computed<CampaignsState>(() => ({
    list: this._list(),
    selected: this._selected(),
    summary: this._summary(),
    loading: this._loading(),
    error: this._error(),
    filters: this._filters(),
    lastUpdated: this._lastUpdated(),
  }));

  // Actions - methods that update the store state
  loadCampaigns(filters?: CampaignsFilters) {
    this._loading.set(true);
    this._error.set(null);

    const campaignFilter = this.mapToCampaignFilter(filters);

    this.campaignService.getAll(campaignFilter, 1, 100).subscribe({
      next: (response: any) => {
        const campaigns = response.data?.data || [];
        this._list.set(campaigns);
        this._loading.set(false);
        this._lastUpdated.set(new Date());
        this.updateSummary();
      },
      error: (error: any) => {
        console.warn('Backend not available, using mock data for campaigns');
        // Use mock data when backend is not available
        const mockCampaigns = this.createMockCampaigns();
        this._list.set(mockCampaigns);
        this._loading.set(false);
        this._lastUpdated.set(new Date());
        this.updateSummary();
      },
    });
  }

  // Helper method to create mock campaigns for testing
  private createMockCampaigns(): Campaign[] {
    return [
      {
        id: 'campaign-1',
        name: 'Social Media Sentiment Analysis',
        description: 'Monitoring brand sentiment across social platforms',
        hashtags: ['#brand', '#sentiment', '#social'],
        keywords: ['customer satisfaction', 'brand perception'],
        mentions: ['@company', '@support'],
        languages: ['es', 'en'],
        dataSources: ['twitter'],
        status: 'active',
        createdAt: new Date(2024, 8, 1),
        updatedAt: new Date(),
        type: 'hashtag',
        startDate: new Date(2024, 8, 1),
        endDate: new Date(2024, 11, 31),
        sentimentAnalysis: true,
        organizationId: 'org-1',
        maxTweets: 1000,
        stats: {
          totalTweets: 1247,
          totalEngagement: 3892,
          avgSentiment: 0.75,
          sentimentDistribution: {
            positive: 689,
            negative: 156,
            neutral: 402
          },
          topHashtags: [
            { tag: '#brand', count: 423 },
            { tag: '#sentiment', count: 298 }
          ],
          topMentions: [
            { mention: '@company', count: 234 },
            { mention: '@support', count: 189 }
          ],
          topKeywords: [
            { keyword: 'customer satisfaction', count: 567 },
            { keyword: 'brand perception', count: 321 }
          ],
          influencers: [
            { username: '@influencer1', followers: 15000, engagement: 1250 },
            { username: '@influencer2', followers: 8500, engagement: 890 }
          ]
        }
      },
      {
        id: 'campaign-2',
        name: 'Product Launch Tracking',
        description: 'Tracking reception of new product launch',
        hashtags: ['#newproduct', '#launch'],
        keywords: ['product launch', 'innovation'],
        mentions: ['@productteam'],
        languages: ['es', 'en'],
        dataSources: ['twitter'],
        status: 'active',
        createdAt: new Date(2024, 8, 15),
        updatedAt: new Date(),
        type: 'keyword',
        startDate: new Date(2024, 8, 15),
        endDate: new Date(2024, 10, 15),
        sentimentAnalysis: true,
        organizationId: 'org-1',
        maxTweets: 500,
        stats: {
          totalTweets: 789,
          totalEngagement: 2156,
          avgSentiment: 0.68,
          sentimentDistribution: {
            positive: 456,
            negative: 98,
            neutral: 235
          },
          topHashtags: [
            { tag: '#newproduct', count: 398 },
            { tag: '#launch', count: 245 }
          ],
          topMentions: [
            { mention: '@productteam', count: 167 }
          ],
          topKeywords: [
            { keyword: 'product launch', count: 423 },
            { keyword: 'innovation', count: 298 }
          ],
          influencers: [
            { username: '@techreviewer', followers: 25000, engagement: 1890 }
          ]
        }
      },
      {
        id: 'campaign-3',
        name: 'Competitor Analysis',
        description: 'Monitoring competitor mentions and sentiment',
        hashtags: ['#competitor'],
        keywords: ['competition', 'market analysis'],
        mentions: ['@competitor1', '@competitor2'],
        languages: ['es'],
        dataSources: ['twitter'],
        status: 'paused',
        createdAt: new Date(2024, 7, 1),
        updatedAt: new Date(),
        type: 'mention',
        startDate: new Date(2024, 7, 1),
        endDate: new Date(2024, 9, 30),
        sentimentAnalysis: true,
        organizationId: 'org-1',
        maxTweets: 750,
        stats: {
          totalTweets: 623,
          totalEngagement: 1456,
          avgSentiment: 0.45,
          sentimentDistribution: {
            positive: 187,
            negative: 234,
            neutral: 202
          },
          topHashtags: [
            { tag: '#competitor', count: 298 }
          ],
          topMentions: [
            { mention: '@competitor1', count: 234 },
            { mention: '@competitor2', count: 189 }
          ],
          topKeywords: [
            { keyword: 'competition', count: 345 },
            { keyword: 'market analysis', count: 278 }
          ],
          influencers: [
            { username: '@analyst', followers: 12000, engagement: 670 }
          ]
        }
      },
    ];
  }

  loadCampaign(id: string) {
    this._loading.set(true);
    this._error.set(null);

    this.campaignService.getById(id).subscribe({
      next: (response: any) => {
        const campaign = response.data;
        this._selected.set(campaign);
        this._loading.set(false);

        // Also update in list if it exists
        this._list.update((current) => current.map((c) => (c.id === campaign.id ? campaign : c)));
      },
      error: (error: any) => {
        this._error.set(error.message || 'Failed to load campaign');
        this._loading.set(false);
      },
    });
  }

  createCampaign(campaignData: Partial<Campaign>) {
    this._loading.set(true);
    this._error.set(null);

    this.campaignService.create(campaignData).subscribe({
      next: (response: any) => {
        const campaign = response.data;
        this._list.update((current) => [campaign, ...current]);
        this._selected.set(campaign);
        this._loading.set(false);
        this._lastUpdated.set(new Date());
        this.updateSummary();
      },
      error: (error: any) => {
        this._error.set(error.message || 'Failed to create campaign');
        this._loading.set(false);
      },
    });
  }

  updateCampaign(id: string, updates: Partial<Campaign>) {
    this._loading.set(true);
    this._error.set(null);

    this.campaignService.update(id, updates).subscribe({
      next: (response: any) => {
        const campaign = response.data;
        this._list.update((current) => current.map((c) => (c.id === campaign.id ? campaign : c)));

        // Update selected if it's the same campaign
        if (this._selected()?.id === campaign.id) {
          this._selected.set(campaign);
        }

        this._loading.set(false);
        this._lastUpdated.set(new Date());
        this.updateSummary();
      },
      error: (error: any) => {
        this._error.set(error.message || 'Failed to update campaign');
        this._loading.set(false);
      },
    });
  }

  deleteCampaign(id: string) {
    this._loading.set(true);
    this._error.set(null);

    this.campaignService.delete(id).subscribe({
      next: () => {
        this._list.update((current) => current.filter((c) => c.id !== id));

        // Clear selected if it was the deleted campaign
        if (this._selected()?.id === id) {
          this._selected.set(null);
        }

        this._loading.set(false);
        this._lastUpdated.set(new Date());
        this.updateSummary();
      },
      error: (error: any) => {
        this._error.set(error.message || 'Failed to delete campaign');
        this._loading.set(false);
      },
    });
  }

  selectCampaign(campaign: Campaign | null) {
    this._selected.set(campaign);
  }

  clearSelection() {
    this._selected.set(null);
  }

  updateFilters(filters: Partial<CampaignsFilters>) {
    this._filters.update((current) => ({ ...current, ...filters }));
  }

  clearFilters() {
    this._filters.set({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  }

  setLoading(loading: boolean) {
    this._loading.set(loading);
  }

  setError(error: string | null) {
    this._error.set(error);
  }

  clearError() {
    this._error.set(null);
  }

  refresh() {
    this.loadCampaigns();
  }

  // Campaign control actions
  startCampaign(id: string) {
    this.updateCampaign(id, { status: 'active' });
  }

  pauseCampaign(id: string) {
    this.updateCampaign(id, { status: 'paused' });
  }

  completeCampaign(id: string) {
    this.updateCampaign(id, { status: 'completed' });
  }

  // Private helper methods
  private updateSummary() {
    const campaigns = this._list();
    const statusCounts = this.statusCounts();

    const summary: CampaignSummary = {
      totalCampaigns: campaigns.length,
      activeCampaigns: statusCounts.active,
      pausedCampaigns: statusCounts.paused,
      completedCampaigns: statusCounts.completed,
      totalTweets: campaigns.reduce((sum, c) => sum + (c.maxTweets || 0), 0),
      totalHashtags: campaigns.reduce((sum, c) => sum + c.hashtags.length, 0),
      totalKeywords: campaigns.reduce((sum, c) => sum + c.keywords.length, 0),
      averageSentiment: 0, // TODO: Calculate from actual sentiment data
      topPerformingCampaign: campaigns.find((c) => c.status === 'active'), // TODO: Implement proper logic
      recentActivity: campaigns.slice(0, 5).map((c) => ({
        campaignId: c.id,
        campaignName: c.name,
        action: `Campaign ${c.status}`,
        timestamp: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      })),
    };

    this._summary.set(summary);
  }

  private mapToCampaignFilter(filters?: CampaignsFilters): any {
    if (!filters) return {};

    return {
      status: filters.status,
      type: filters.type,
      search: filters.searchTerm,
      dateRange: filters.dateRange
        ? {
            start: filters.dateRange.startDate,
            end: filters.dateRange.endDate,
          }
        : undefined,
    };
  }
}
