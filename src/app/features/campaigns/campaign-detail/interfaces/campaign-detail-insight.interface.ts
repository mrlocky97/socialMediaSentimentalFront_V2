export interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'trend' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'positive' | 'negative' | 'neutral';
  actionable: boolean;
  action?: {
    label: string;
    type: 'optimize' | 'adjust' | 'investigate' | 'expand';
  };
  metrics?: {
    current: number;
    predicted: number;
    improvement: number;
  };
  category: 'engagement' | 'sentiment' | 'reach' | 'efficiency' | 'content';
  generatedAt: Date;
}

export interface CampaignPrediction {
  metric: 'engagement' | 'sentiment' | 'reach' | 'roi';
  current: number;
  predicted: number;
  timeframe: '7d' | '30d' | '90d';
  confidence: number;
  factors: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PerformanceTrend {
  metric: string;
  data: { date: string; value: number }[];
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  significance: 'high' | 'medium' | 'low';
}

export interface CampaignIntelligence {
  summary: string;
  score: number; // 0-100 overall performance score
  insights: AIInsight[];
  predictions: CampaignPrediction[];
  trends: PerformanceTrend[];
  recommendations: {
    immediate: AIInsight[];
    shortTerm: AIInsight[];
    longTerm: AIInsight[];
  };
  lastAnalyzed: Date;
}

// ---------------------- enums ----------------------
export enum PRIORITY_LEVELS {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum INSIGHT_TYPES {
  RECOMMENDATION = 'recommendation',
  PREDICTION = 'prediction',
  TREND = 'trend',
  ALERT = 'alert',
}

export enum CATEGORIES {
  ENGAGEMENT = 'engagement',
  SENTIMENT = 'sentiment',
  REACH = 'reach',
  EFFICIENCY = 'efficiency',
  CONTENT = 'content',
}
