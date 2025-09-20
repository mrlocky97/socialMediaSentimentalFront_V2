/**
 * UNIFIED CAMPAIGN INTERFACES
 * Consolidación de todas las interfaces de Campaign dispersas en el proyecto
 * Esta es la ÚNICA fuente de verdad para interfaces de Campaign
 */

// ===============================
// CORE CAMPAIGN INTERFACE
// ===============================

export interface Campaign {
  // Campos básicos (de app.state.ts)
  id: string;
  name: string;
  description?: string;
  
  // Estado y tipo unificados
  status: CampaignStatus;
  type: CampaignType;
  
  // Datos de scraping (de app.state.ts)
  hashtags: string[];
  keywords: string[];
  mentions: string[];
  
  // Fechas
  startDate: Date | string;
  endDate: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  lastDataCollection?: Date | string;
  
  // Configuración
  maxTweets: number;
  sentimentAnalysis: boolean;
  emotionAnalysis?: boolean;
  topicsAnalysis?: boolean;
  influencerAnalysis?: boolean;
  
  // Organización y permisos
  organizationId?: string;
  createdBy?: string;
  
  // Configuración adicional (de app.state.ts)
  dataSources?: string[];
  timezone?: string;
  collectImages?: boolean;
  collectVideos?: boolean;
  collectReplies?: boolean;
  collectRetweets?: boolean;
  languages?: string[];
  
  // Estadísticas integradas
  stats?: CampaignStats;
  
  // Campos enterprise (de campaign.model.ts)
  tags?: string[];
  objectives?: CampaignObjective[];
  budget?: CampaignBudget;
  timeline?: CampaignTimeline;
  platforms?: SocialPlatform[];
  targeting?: TargetingCriteria;
  content?: CampaignContent[];
  metrics?: CampaignMetrics;
}

// ===============================
// ENUMS UNIFICADOS
// ===============================

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SCHEDULED = 'scheduled',
  // Compatibilidad con versión simple
  INACTIVE = 'inactive'
}

export enum CampaignType {
  HASHTAG = 'hashtag',
  USER = 'user', 
  KEYWORD = 'keyword',
  MENTION = 'mention',
  // Tipos enterprise
  BRAND_AWARENESS = 'brand_awareness',
  LEAD_GENERATION = 'lead_generation',
  SALES_CONVERSION = 'sales_conversion',
  ENGAGEMENT = 'engagement',
  TRAFFIC_DRIVE = 'traffic_drive',
  APP_PROMOTION = 'app_promotion'
}

export enum SocialPlatform {
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok'
}

// ===============================
// INTERFACES DE APOYO
// ===============================

export interface CampaignStats {
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
}

export interface CampaignObjective {
  id: string;
  type: ObjectiveType;
  target: number;
  current: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
}

export enum ObjectiveType {
  REACH = 'reach',
  ENGAGEMENT = 'engagement',
  CLICKS = 'clicks',
  CONVERSIONS = 'conversions',
  BRAND_AWARENESS = 'brand_awareness'
}

export interface CampaignBudget {
  total: number;
  spent: number;
  currency: string;
  dailyLimit?: number;
  bidStrategy: 'cpc' | 'cpm' | 'cpa' | 'manual';
}

export interface CampaignTimeline {
  startDate: Date;
  endDate: Date;
  timezone: string;
}

export interface TargetingCriteria {
  demographics?: Demographics;
  interests?: string[];
  behaviors?: string[];
  locations?: Location[];
  languages?: string[];
  devices?: ('desktop' | 'mobile' | 'tablet')[];
}

export interface Demographics {
  ageMin?: number;
  ageMax?: number;
  genders?: ('male' | 'female' | 'all')[];
  incomeLevel?: ('low' | 'medium' | 'high')[];
  education?: ('high_school' | 'college' | 'graduate')[];
}

export interface Location {
  type: 'country' | 'region' | 'city' | 'postal_code';
  value: string;
  radius?: number; // km
}

export interface CampaignContent {
  id: string;
  type: 'text' | 'image' | 'video' | 'carousel';
  title: string;
  description: string;
  mediaUrls: string[];
  callToAction?: CallToAction;
  scheduledPosts?: ScheduledPost[];
}

export interface CallToAction {
  type: 'learn_more' | 'shop_now' | 'sign_up' | 'download' | 'contact';
  text: string;
  url: string;
}

export interface ScheduledPost {
  id: string;
  platform: SocialPlatform;
  scheduledTime: Date;
  content: CampaignContent;
  status: 'scheduled' | 'published' | 'failed';
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  cpa: number; // Cost per acquisition
  sentiment?: SentimentMetrics;
}

export interface SentimentMetrics {
  positive: number;
  negative: number;
  neutral: number;
  confidence: number;
}

// ===============================
// STATE INTERFACES
// ===============================

export interface CampaignState {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface CampaignFilters {
  status?: CampaignStatus | string;
  type?: CampaignType | string;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  organizationId?: string;
  createdBy?: string;
  tags?: string[];
}

export interface CampaignSortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'status' | 'budget';
  direction: 'asc' | 'desc';
}

// ===============================
// API INTERFACES
// ===============================

export interface CampaignListResponse {
  data: Campaign[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type: CampaignType;
  hashtags?: string[];
  keywords?: string[];
  mentions?: string[];
  startDate: Date;
  endDate: Date;
  maxTweets: number;
  sentimentAnalysis: boolean;
  organizationId?: string;
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {
  id: string;
}

// ===============================
// UTILITY TYPES
// ===============================

export type CampaignSummary = Pick<Campaign, 'id' | 'name' | 'status' | 'type' | 'stats'>;

export type CampaignPreview = Pick<Campaign, 'id' | 'name' | 'description' | 'status' | 'createdAt'>;

// Re-export para compatibilidad
export type { Campaign as CampaignModel };