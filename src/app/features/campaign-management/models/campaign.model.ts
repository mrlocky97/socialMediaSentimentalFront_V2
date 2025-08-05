/* =====================================
   CAMPAIGN MANAGEMENT - DATA MODELS
   Enterprise-grade TypeScript interfaces
   ===================================== */

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  type: CampaignType;
  objectives: CampaignObjective[];
  budget: CampaignBudget;
  timeline: CampaignTimeline;
  platforms: SocialPlatform[];
  targeting: TargetingCriteria;
  content: CampaignContent[];
  metrics: CampaignMetrics;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SCHEDULED = 'scheduled'
}

export enum CampaignType {
  BRAND_AWARENESS = 'brand_awareness',
  LEAD_GENERATION = 'lead_generation',
  SALES_CONVERSION = 'sales_conversion',
  ENGAGEMENT = 'engagement',
  TRAFFIC_DRIVE = 'traffic_drive',
  APP_PROMOTION = 'app_promotion'
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
  IMPRESSIONS = 'impressions',
  CLICKS = 'clicks',
  CONVERSIONS = 'conversions',
  ENGAGEMENT_RATE = 'engagement_rate',
  REACH = 'reach',
  BRAND_MENTIONS = 'brand_mentions'
}

export interface CampaignBudget {
  total: number;
  spent: number;
  currency: string;
  dailyLimit?: number;
  bidStrategy: BidStrategy;
}

export enum BidStrategy {
  COST_PER_CLICK = 'cpc',
  COST_PER_IMPRESSION = 'cpm',
  COST_PER_ACQUISITION = 'cpa',
  TARGET_ROAS = 'target_roas'
}

export interface CampaignTimeline {
  startDate: Date;
  endDate: Date;
  timezone: string;
  scheduledPosts: ScheduledPost[];
}

export interface ScheduledPost {
  id: string;
  contentId: string;
  platform: SocialPlatform;
  scheduledAt: Date;
  status: 'scheduled' | 'published' | 'failed';
}

export enum SocialPlatform {
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube'
}

export interface TargetingCriteria {
  demographics: Demographics;
  interests: string[];
  behaviors: string[];
  locations: Location[];
  languages: string[];
  customAudiences: string[];
}

export interface Demographics {
  ageRange: {
    min: number;
    max: number;
  };
  gender: 'all' | 'male' | 'female' | 'non_binary';
  education: string[];
  income: string[];
  relationshipStatus: string[];
}

export interface Location {
  type: 'country' | 'region' | 'city' | 'postal_code';
  value: string;
  radius?: number;
}

export interface CampaignContent {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  ctaButton?: CallToAction;
  status: ContentStatus;
  createdAt: Date;
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  CAROUSEL = 'carousel',
  STORY = 'story',
  REEL = 'reel'
}

export interface CallToAction {
  text: string;
  url: string;
  type: 'link' | 'app_download' | 'contact' | 'shop_now';
}

export enum ContentStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published'
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  engagements: number;
  conversions: number;
  reach: number;
  ctr: number; // Click-through rate
  cpm: number; // Cost per mille
  cpc: number; // Cost per click
  cpa: number; // Cost per acquisition
  roas: number; // Return on ad spend
  sentimentScore: SentimentMetrics;
  lastUpdated: Date;
}

export interface SentimentMetrics {
  positive: number;
  negative: number;
  neutral: number;
  overall: number; // -1 to 1 scale
  totalMentions: number;
}

// Response interfaces for API calls
export interface CampaignListResponse {
  campaigns: Campaign[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface CampaignFilters {
  status?: CampaignStatus[];
  type?: CampaignType[];
  platforms?: SocialPlatform[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  createdBy?: string[];
  tags?: string[];
}

export interface CampaignSortOptions {
  field: keyof Campaign;
  direction: 'asc' | 'desc';
}

// Create/Update DTOs
export interface CreateCampaignRequest {
  name: string;
  description: string;
  type: CampaignType;
  objectives: Omit<CampaignObjective, 'id' | 'current'>[];
  budget: Omit<CampaignBudget, 'spent'>;
  timeline: Omit<CampaignTimeline, 'scheduledPosts'>;
  platforms: SocialPlatform[];
  targeting: TargetingCriteria;
  tags?: string[];
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {
  id: string;
  status?: CampaignStatus;
}
