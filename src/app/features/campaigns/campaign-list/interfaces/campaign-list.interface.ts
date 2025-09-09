// Types for better type safety
export interface CampaignStats {
  total: number;
  active: number;
  paused: number;
  draft: number;
}

export interface BulkActionConfig {
  key: 'pause' | 'resume' | 'delete';
  icon: string;
  labelKey: string;
  cssClass?: string;
  requiresConfirmation?: boolean;
}

export interface StatConfig {
  key: keyof CampaignStats;
  icon: string;
  iconClass: string;
  labelKey: string;
}
