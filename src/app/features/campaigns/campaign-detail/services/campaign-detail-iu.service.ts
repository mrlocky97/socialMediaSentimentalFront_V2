/**
 * Campaign UI Service - UI Logic & Constants
 * Handles display logic, constants, and UI-related utilities
 */

import { Injectable } from '@angular/core';
import { TweetWithCalculatedFields } from '../../../../core/interfaces/tweet.interface';
import { Campaign } from '../../../../core/state/app.state';
import { TableAction, TableColumn, TableConfig } from '../../../../shared/components/solid-data-table/interfaces/solid-data-table.interface';

@Injectable({
  providedIn: 'root',
})
export class CampaignUIService {
  private readonly statusIcons = Object.freeze({
    active: 'play_circle',
    paused: 'pause_circle',
    completed: 'check_circle',
    inactive: 'drafts',
    cancelled: 'cancel',
  });

  private readonly typeIcons = Object.freeze({
    hashtag: 'tag',
    keyword: 'search',
    user: 'person',
    mention: 'alternate_email',
  });

  private readonly statusLabels = Object.freeze({
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    inactive: 'Inactive',
    cancelled: 'Cancelled',
  });

  private readonly typeLabels = Object.freeze({
    hashtag: 'Hashtag Monitoring',
    keyword: 'Keyword Tracking',
    user: 'User Monitoring',
    mention: 'Mention Tracking',
  });

  /**
   * Get status icon for campaign
   */
  getStatusIcon(status: string): string {
    return this.statusIcons[status as keyof typeof this.statusIcons] ?? 'help';
  }

  /**
   * Get type icon for campaign
   */
  getTypeIcon(type: string): string {
    return this.typeIcons[type as keyof typeof this.typeIcons] ?? 'campaign';
  }

  /**
   * Get status label for display
   */
  getStatusLabel(status: string): string {
    return this.statusLabels[status as keyof typeof this.statusLabels] ?? status;
  }

  /**
   * Get type label for display
   */
  getTypeLabel(type: string): string {
    return this.typeLabels[type as keyof typeof this.typeLabels] ?? type;
  }

  /**
   * Check if campaign was created recently (within last 5 minutes)
   */
  isRecentlyCreated(campaign: Campaign): boolean {
    if (!campaign.createdAt) return false;

    const createdAtDate = new Date(campaign.createdAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    return createdAtDate > fiveMinutesAgo;
  }

  /**
   * Create optimized table configuration for tweets
   */
  createTweetTableConfig(): {
    readonly columns: TableColumn<TweetWithCalculatedFields>[];
    readonly config: TableConfig;
    readonly actions: TableAction<TweetWithCalculatedFields>[];
  } {
    const columns: TableColumn<TweetWithCalculatedFields>[] = [
      {
        key: 'content',
        label: 'Tweet Content',
        sortable: false,
        width: '280px',
        formatter: (content: string) =>
          content.length > 80 ? content.substring(0, 80) + '...' : content,
      },
      {
        key: 'author',
        label: 'Author',
        sortable: false,
        width: '140px',
        formatter: (author: any) => author?.username || 'Unknown',
      },
      {
        key: 'sentiment',
        label: 'Sentiment',
        sortable: true,
        width: '110px',
        formatter: (sentiment: any) => sentiment?.label || 'Unknown',
      },
      {
        key: 'calculatedEngagement',
        label: 'Engagement',
        sortable: true,
        width: '100px',
        formatter: (value: number, row?: TweetWithCalculatedFields) => {
          // Use calculated field first, fallback to metrics
          const engagement = value ?? row?.metrics?.engagement ?? 0;
          return engagement.toString();
        },
      },
      {
        key: 'calculatedEngagementRate',
        label: 'Eng. Rate %',
        sortable: true,
        width: '110px',
        formatter: (value: number) => {
          return value !== undefined ? `${value.toFixed(2)}%` : '0.00%';
        },
      },
      {
        key: 'language',
        label: 'Language',
        sortable: true,
        width: '90px',
      },
      {
        key: 'tweetCreatedAt',
        label: 'Date',
        sortable: true,
        width: '120px',
        formatter: (date: string) => new Date(date).toLocaleDateString(),
      },
    ];

    const config: TableConfig = Object.freeze({
      showSearch: true,
      showPagination: true,
      showSelection: false,
      multiSelection: false,
      pageSize: 25,
      pageSizeOptions: [10, 25, 50, 100],
    });

    const actions: TableAction<TweetWithCalculatedFields>[] = [
      { icon: 'visibility', label: 'View', color: 'primary' },
      { icon: 'link', label: 'Open Tweet', color: 'primary' },
    ];

    return Object.freeze({ columns, config, actions });
  }

  /**
   * Generate Twitter URL for tweet
   */
  generateTweetUrl(tweetId: string): string {
    return `https://twitter.com/i/web/status/${tweetId}`;
  }

  /**
   * Truncate text for display
   */
  truncateText(text: string, maxLength: number = 100): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Get progress percentage
   */
  getProgressPercent(completed: number, total: number): number {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }

  /**
   * Get scraping status text
   */
  getScrapingStatusText(status: string | null): string {
    switch (status) {
      case 'idle':
        return 'Ready to start scraping';
      case 'running':
        return 'Scraping in progress...';
      case 'completed':
        return 'Scraping completed successfully';
      case 'error':
        return 'Error occurred during scraping';
      default:
        return 'No scraping data yet';
    }
  }
}
