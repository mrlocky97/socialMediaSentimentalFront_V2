/**
 * Campaign Presentation Services - Following Single Responsibility Principle
 * Each service has one clear responsibility
 */
import { Injectable, signal, computed } from '@angular/core';
import { Campaign } from '../../../core/state/app.state';

/**
 * Campaign Display Service - Single Responsibility
 * Handles only the presentation logic for campaigns
 */
@Injectable({
  providedIn: 'root'
})
export class CampaignDisplayService {

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateRange(startDate: Date | string, endDate: Date | string): string {
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    return `${start} - ${end}`;
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'active': 'status-active',
      'inactive': 'status-inactive',
      'completed': 'status-completed',
      'paused': 'status-paused'
    };
    return statusMap[status] || 'status-unknown';
  }

  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      'active': 'play_circle',
      'inactive': 'pause_circle',
      'completed': 'check_circle',
      'paused': 'pause'
    };
    return iconMap[status] || 'help';
  }

  formatCount(count: number, unit: string): string {
    if (count === 0) return `No ${unit}`;
    if (count === 1) return `1 ${unit.slice(0, -1)}`;
    return `${count} ${unit}`;
  }
}

/**
 * Campaign Filter Service - Single Responsibility  
 * Handles only campaign filtering logic
 */
@Injectable({
  providedIn: 'root'
})
export class CampaignFilterService {
  private readonly _searchTerm = signal('');
  private readonly _statusFilter = signal<string>('all');
  private readonly _typeFilter = signal<string>('all');

  readonly searchTerm = this._searchTerm.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();
  readonly typeFilter = this._typeFilter.asReadonly();

  setSearchTerm(term: string): void {
    this._searchTerm.set(term.toLowerCase().trim());
  }

  setStatusFilter(status: string): void {
    this._statusFilter.set(status);
  }

  setTypeFilter(type: string): void {
    this._typeFilter.set(type);
  }

  clearFilters(): void {
    this._searchTerm.set('');
    this._statusFilter.set('all');
    this._typeFilter.set('all');
  }

  filterCampaigns(campaigns: Campaign[]): Campaign[] {
    return campaigns.filter(campaign => {
      // Search term filter
      const searchTerm = this._searchTerm();
      if (searchTerm && !this.matchesSearchTerm(campaign, searchTerm)) {
        return false;
      }

      // Status filter
      const statusFilter = this._statusFilter();
      if (statusFilter !== 'all' && campaign.status !== statusFilter) {
        return false;
      }

      // Type filter
      const typeFilter = this._typeFilter();
      if (typeFilter !== 'all' && campaign.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }

  private matchesSearchTerm(campaign: Campaign, searchTerm: string): boolean {
    const searchableText = [
      campaign.name,
      campaign.description || '',
      ...campaign.hashtags,
      ...campaign.keywords
    ].join(' ').toLowerCase();

    return searchableText.includes(searchTerm);
  }
}

/**
 * Campaign Sort Service - Single Responsibility
 * Handles only campaign sorting logic
 */
@Injectable({
  providedIn: 'root'
})
export class CampaignSortService {
  private readonly _sortBy = signal<keyof Campaign>('name');
  private readonly _sortDirection = signal<'asc' | 'desc'>('asc');

  readonly sortBy = this._sortBy.asReadonly();
  readonly sortDirection = this._sortDirection.asReadonly();

  setSorting(field: keyof Campaign, direction?: 'asc' | 'desc'): void {
    this._sortBy.set(field);
    
    if (direction) {
      this._sortDirection.set(direction);
    } else {
      // Toggle direction if same field
      const currentDirection = this._sortDirection();
      this._sortDirection.set(currentDirection === 'asc' ? 'desc' : 'asc');
    }
  }

  sortCampaigns(campaigns: Campaign[]): Campaign[] {
    const sortBy = this._sortBy();
    const direction = this._sortDirection();

    return [...campaigns].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return direction === 'asc' ? 1 : -1;
      if (bValue === undefined) return direction === 'asc' ? -1 : 1;

      // Handle different data types
      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return direction === 'asc' ? comparison : -comparison;
    });
  }
}

/**
 * Campaign Action Service - Single Responsibility
 * Handles only campaign action validation and coordination
 */
@Injectable({
  providedIn: 'root'
})
export class CampaignActionService {

  canStartCampaign(campaign: Campaign): boolean {
    return campaign.status === 'inactive' && 
           new Date(campaign.startDate) <= new Date() &&
           new Date(campaign.endDate) > new Date();
  }

  canStopCampaign(campaign: Campaign): boolean {
    return campaign.status === 'active';
  }

  canEditCampaign(campaign: Campaign): boolean {
    return campaign.status !== 'completed';
  }

  canDeleteCampaign(campaign: Campaign): boolean {
    return campaign.status === 'inactive' || campaign.status === 'completed';
  }

  getAvailableActions(campaign: Campaign): string[] {
    const actions: string[] = [];

    if (this.canStartCampaign(campaign)) actions.push('start');
    if (this.canStopCampaign(campaign)) actions.push('stop');
    if (this.canEditCampaign(campaign)) actions.push('edit');
    if (this.canDeleteCampaign(campaign)) actions.push('delete');

    actions.push('view'); // Always available
    
    return actions;
  }

  validateCampaignAction(campaign: Campaign, action: string): { valid: boolean; reason?: string } {
    switch (action) {
      case 'start':
        if (!this.canStartCampaign(campaign)) {
          return { valid: false, reason: 'Campaign cannot be started in current state' };
        }
        break;
      case 'stop':
        if (!this.canStopCampaign(campaign)) {
          return { valid: false, reason: 'Campaign is not currently active' };
        }
        break;
      case 'edit':
        if (!this.canEditCampaign(campaign)) {
          return { valid: false, reason: 'Completed campaigns cannot be edited' };
        }
        break;
      case 'delete':
        if (!this.canDeleteCampaign(campaign)) {
          return { valid: false, reason: 'Active campaigns cannot be deleted' };
        }
        break;
    }
    
    return { valid: true };
  }
}
