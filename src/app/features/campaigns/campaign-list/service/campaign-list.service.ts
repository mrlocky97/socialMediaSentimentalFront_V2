// campaign-filter.service.ts
import { Injectable, signal } from '@angular/core';
import { Campaign } from '../../models/campaign.model';


export interface CampaignFilters {
  search: string;
  status: string[];
  type: string[];
  platforms: string[];
}

@Injectable({ providedIn: 'root' })
export class CampaignFilterService {
  private filters = signal<CampaignFilters>({
    search: '',
    status: [],
    type: [],
    platforms: [],
  });

  getFilters() {
    return this.filters.asReadonly();
  }

  updateFilters(newFilters: Partial<CampaignFilters>): void {
    this.filters.update((current) => ({ ...current, ...newFilters }));
  }

  resetFilters(): void {
    this.filters.set({
      search: '',
      status: [],
      type: [],
      platforms: [],
    });
  }

  filterCampaigns(campaigns: Campaign[], filters: CampaignFilters): Campaign[] {
    return campaigns.filter((campaign) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesName = campaign.name.toLowerCase().includes(search);
        const matchesDescription = campaign.description?.toLowerCase().includes(search) || false;
        if (!matchesName && !matchesDescription) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(campaign.status)) {
        return false;
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(campaign.type)) {
        return false;
      }

      return true;
    });
  }
}
