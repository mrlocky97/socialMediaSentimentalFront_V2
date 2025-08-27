type DataSource = 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'facebook';

export interface CreateCampaignDialogData {
  /** Puedes inyectar valores iniciales, p.ej. organizationId, timezone, etc. */
  preset?: Partial<CampaignRequest>;
  /** Modo de diálogo: 'create' o 'edit' */
  mode?: 'create' | 'edit';
  /** Título del diálogo */
  title?: string;
  /** ID de la campaña a editar (solo en modo edit) */
  campaignId?: string;
}

export interface CampaignRequest {
  name: string;
  description: string;
  type: CampaignType | string;
  dataSources: DataSource[];
  hashtags: string[];
  keywords: string[];
  mentions: string[];
  startDate: string; // ISO
  endDate: string; // ISO
  timezone: string;
  maxTweets: number;
  collectImages: boolean;
  collectVideos: boolean;
  collectReplies: boolean;
  collectRetweets: boolean;
  languages: string[];
  sentimentAnalysis: boolean;
  emotionAnalysis: boolean;
  topicsAnalysis: boolean;
  influencerAnalysis: boolean;
  organizationId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export enum CampaignType {
  HASHTAG = 'hashtag',
  KEYWORD = 'keyword',
  USER = 'user',
  CUSTOM = 'custom',
}