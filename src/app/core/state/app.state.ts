/**
 * Global Application State Management
 * Inspired by the centralized approach from SentimentalSocialNextJS
 */
import { Injectable, computed, signal } from '@angular/core';
import { UserInfo } from '../auth/model/auth.model';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed' | 'paused';
  type: 'hashtag' | 'user' | 'keyword' | 'mention' | string;
  hashtags: string[];
  keywords: string[];
  mentions: string[];
  startDate: Date | string;
  endDate: Date | string;
  maxTweets: number;
  sentimentAnalysis: boolean;
  emotionAnalysis?: boolean;
  topicsAnalysis?: boolean;
  influencerAnalysis?: boolean;
  organizationId?: string; // Hacemos el campo opcional para que sea compatible con los tipos de la API
  createdBy?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  lastDataCollection?: Date | string;
  // Campos adicionales para operaciones CRUD
  dataSources?: string[];
  timezone?: string;
  collectImages?: boolean;
  collectVideos?: boolean;
  collectReplies?: boolean;
  collectRetweets?: boolean;
  languages?: string[];
  stats?: {
    totalTweets: number;
    totalEngagement: number;
    avgSentiment: number;
    sentimentDistribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    topHashtags: Array<{ tag: string; count: number }>;
    topMentions: Array<{ mention: string; count: number }>;
    topKeywords: Array<{ keyword: string; count: number }>;
    influencers: Array<{ username: string; followers: number; engagement: number }>;
  };
}

export interface AppState {
  user: UserInfo | null;
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  selectedCampaign: Campaign | null;
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private state = signal<AppState>({
    user: null,
    campaigns: [],
    loading: false,
    error: null,
    selectedCampaign: null
  });

  // Computed selectors
  readonly user = computed(() => this.state().user);
  readonly campaigns = computed(() => this.state().campaigns);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selectedCampaign = computed(() => this.state().selectedCampaign);
  readonly activeCampaigns = computed(() => 
    this.state().campaigns.filter(c => c.status === 'active')
  );

  // State mutations
  setUser(user: UserInfo | null): void {
    this.state.update(state => ({ ...state, user }));
  }

  setCampaigns(campaigns: Campaign[]): void {
    this.state.update(state => ({ ...state, campaigns }));
  }

  addCampaign(campaign: Campaign): void {
    this.state.update(state => ({
      ...state,
      campaigns: [...state.campaigns, campaign]
    }));
  }

  updateCampaign(updatedCampaign: Campaign): void {
    this.state.update(state => ({
      ...state,
      campaigns: state.campaigns.map(c => 
        c.id === updatedCampaign.id ? updatedCampaign : c
      )
    }));
  }

  removeCampaign(campaignId: string): void {
    this.state.update(state => ({
      ...state,
      campaigns: state.campaigns.filter(c => c.id !== campaignId),
      selectedCampaign: state.selectedCampaign?.id === campaignId ? null : state.selectedCampaign
    }));
  }

  setSelectedCampaign(campaign: Campaign | null): void {
    this.state.update(state => ({ ...state, selectedCampaign: campaign }));
  }

  setLoading(loading: boolean): void {
    this.state.update(state => ({ ...state, loading }));
  }

  setError(error: string | null): void {
    this.state.update(state => ({ ...state, error }));
  }

  clearError(): void {
    this.setError(null);
  }
}
