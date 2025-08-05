/* =====================================
   CAMPAIGN MOCK DATA
   Test data for development and testing
   ===================================== */

import {
  BidStrategy,
  Campaign,
  CampaignStatus,
  CampaignType,
  ContentStatus,
  ContentType,
  ObjectiveType,
  SocialPlatform
} from '../models/campaign.model';

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Lanzamiento Producto Q1 2025',
    description: 'Campaña integral para el lanzamiento de nuestro nuevo producto estrella en el primer trimestre',
    status: CampaignStatus.ACTIVE,
    type: CampaignType.BRAND_AWARENESS,
    objectives: [
      {
        id: 'obj1',
        type: ObjectiveType.IMPRESSIONS,
        target: 1000000,
        current: 650000,
        unit: 'impressions',
        priority: 'high'
      },
      {
        id: 'obj2',
        type: ObjectiveType.ENGAGEMENT_RATE,
        target: 5.5,
        current: 4.2,
        unit: '%',
        priority: 'medium'
      }
    ],
    budget: {
      total: 50000,
      spent: 32500,
      currency: 'USD',
      dailyLimit: 1500,
      bidStrategy: BidStrategy.COST_PER_CLICK
    },
    timeline: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      timezone: 'UTC-5',
      scheduledPosts: []
    },
    platforms: [SocialPlatform.INSTAGRAM, SocialPlatform.FACEBOOK, SocialPlatform.TWITTER],
    targeting: {
      demographics: {
        ageRange: { min: 25, max: 45 },
        gender: 'all',
        education: ['university', 'graduate'],
        income: ['middle', 'high'],
        relationshipStatus: ['single', 'married']
      },
      interests: ['technology', 'innovation', 'productivity'],
      behaviors: ['online_shoppers', 'tech_early_adopters'],
      locations: [
        { type: 'country', value: 'US' },
        { type: 'country', value: 'CA' }
      ],
      languages: ['en', 'es'],
      customAudiences: ['lookalike_customers', 'website_visitors']
    },
    content: [
      {
        id: 'content1',
        type: ContentType.IMAGE,
        title: 'Nueva Era de Productividad',
        body: 'Descubre cómo nuestro producto revolucionará tu forma de trabajar. #ProductividadMax #Innovación',
        mediaUrls: ['/assets/images/product-hero.jpg'],
        hashtags: ['#ProductividadMax', '#Innovación', '#TechLife'],
        mentions: ['@TechInfluencer', '@ProductivityGuru'],
        ctaButton: {
          text: 'Saber Más',
          url: 'https://example.com/product',
          type: 'link'
        },
        status: ContentStatus.APPROVED,
        createdAt: new Date('2025-01-05')
      }
    ],
    metrics: {
      impressions: 652000,
      clicks: 15600,
      engagements: 8950,
      conversions: 234,
      reach: 445000,
      ctr: 0.024,
      cpm: 8.5,
      cpc: 2.08,
      cpa: 138.89,
      roas: 3.2,
      sentimentScore: {
        positive: 0.72,
        negative: 0.15,
        neutral: 0.13,
        overall: 0.57,
        totalMentions: 1250
      },
      lastUpdated: new Date()
    },
    createdBy: 'user123',
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date(),
    tags: ['producto', 'lanzamiento', 'q1-2025', 'estratégico']
  },
  {
    id: '2',
    name: 'Black Friday 2024 - Mega Sale',
    description: 'Campaña especial para Black Friday con descuentos exclusivos y ofertas limitadas',
    status: CampaignStatus.COMPLETED,
    type: CampaignType.SALES_CONVERSION,
    objectives: [
      {
        id: 'obj3',
        type: ObjectiveType.CONVERSIONS,
        target: 500,
        current: 623,
        unit: 'sales',
        priority: 'high'
      }
    ],
    budget: {
      total: 25000,
      spent: 24850,
      currency: 'USD',
      dailyLimit: 2000,
      bidStrategy: BidStrategy.COST_PER_ACQUISITION
    },
    timeline: {
      startDate: new Date('2024-11-20'),
      endDate: new Date('2024-11-30'),
      timezone: 'UTC-5',
      scheduledPosts: []
    },
    platforms: [SocialPlatform.FACEBOOK, SocialPlatform.INSTAGRAM, SocialPlatform.YOUTUBE],
    targeting: {
      demographics: {
        ageRange: { min: 18, max: 55 },
        gender: 'all',
        education: [],
        income: ['low', 'middle', 'high'],
        relationshipStatus: []
      },
      interests: ['shopping', 'deals', 'fashion', 'electronics'],
      behaviors: ['frequent_online_shoppers', 'deal_seekers'],
      locations: [
        { type: 'country', value: 'US' }
      ],
      languages: ['en'],
      customAudiences: ['past_customers', 'cart_abandoners']
    },
    content: [],
    metrics: {
      impressions: 2100000,
      clicks: 84000,
      engagements: 12600,
      conversions: 623,
      reach: 1850000,
      ctr: 0.04,
      cpm: 11.83,
      cpc: 0.296,
      cpa: 39.9,
      roas: 4.8,
      sentimentScore: {
        positive: 0.85,
        negative: 0.08,
        neutral: 0.07,
        overall: 0.77,
        totalMentions: 3200
      },
      lastUpdated: new Date('2024-12-01')
    },
    createdBy: 'user456',
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-12-01'),
    tags: ['black-friday', 'descuentos', 'ventas', 'promocional']
  },
  {
    id: '3',
    name: 'Reclutamiento Talento Tech',
    description: 'Campaña de employer branding para atraer desarrolladores senior y líderes técnicos',
    status: CampaignStatus.PAUSED,
    type: CampaignType.LEAD_GENERATION,
    objectives: [
      {
        id: 'obj4',
        type: ObjectiveType.CLICKS,
        target: 5000,
        current: 2100,
        unit: 'clicks',
        priority: 'medium'
      }
    ],
    budget: {
      total: 15000,
      spent: 6750,
      currency: 'USD',
      dailyLimit: 500,
      bidStrategy: BidStrategy.COST_PER_CLICK
    },
    timeline: {
      startDate: new Date('2024-10-01'),
      endDate: new Date('2025-02-28'),
      timezone: 'UTC-5',
      scheduledPosts: []
    },
    platforms: [SocialPlatform.LINKEDIN, SocialPlatform.TWITTER],
    targeting: {
      demographics: {
        ageRange: { min: 25, max: 45 },
        gender: 'all',
        education: ['university', 'graduate'],
        income: ['high'],
        relationshipStatus: []
      },
      interests: ['software-development', 'technology', 'career-growth'],
      behaviors: ['job_seekers', 'tech_professionals'],
      locations: [
        { type: 'country', value: 'US' },
        { type: 'country', value: 'MX' },
        { type: 'country', value: 'AR' }
      ],
      languages: ['en', 'es'],
      customAudiences: ['tech_talent_pool']
    },
    content: [],
    metrics: {
      impressions: 156000,
      clicks: 2100,
      engagements: 890,
      conversions: 45,
      reach: 89000,
      ctr: 0.0135,
      cpm: 43.27,
      cpc: 3.21,
      cpa: 150,
      roas: 2.1,
      sentimentScore: {
        positive: 0.68,
        negative: 0.12,
        neutral: 0.20,
        overall: 0.56,
        totalMentions: 320
      },
      lastUpdated: new Date()
    },
    createdBy: 'user789',
    createdAt: new Date('2024-09-15'),
    updatedAt: new Date(),
    tags: ['reclutamiento', 'tech', 'employer-branding', 'talento']
  },
  {
    id: '4',
    name: 'Engagement Comunidad Q4',
    description: 'Campaña enfocada en incrementar la participación y engagement de nuestra comunidad',
    status: CampaignStatus.DRAFT,
    type: CampaignType.ENGAGEMENT,
    objectives: [
      {
        id: 'obj5',
        type: ObjectiveType.ENGAGEMENT_RATE,
        target: 8.5,
        current: 0,
        unit: '%',
        priority: 'high'
      }
    ],
    budget: {
      total: 12000,
      spent: 0,
      currency: 'USD',
      dailyLimit: 300,
      bidStrategy: BidStrategy.COST_PER_IMPRESSION
    },
    timeline: {
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-04-30'),
      timezone: 'UTC-5',
      scheduledPosts: []
    },
    platforms: [SocialPlatform.INSTAGRAM, SocialPlatform.TIKTOK, SocialPlatform.YOUTUBE],
    targeting: {
      demographics: {
        ageRange: { min: 18, max: 35 },
        gender: 'all',
        education: [],
        income: [],
        relationshipStatus: []
      },
      interests: ['social-media', 'content-creation', 'community'],
      behaviors: ['social_media_enthusiasts', 'content_creators'],
      locations: [
        { type: 'country', value: 'US' },
        { type: 'country', value: 'MX' },
        { type: 'country', value: 'CO' }
      ],
      languages: ['en', 'es'],
      customAudiences: ['community_members', 'brand_advocates']
    },
    content: [],
    metrics: {
      impressions: 0,
      clicks: 0,
      engagements: 0,
      conversions: 0,
      reach: 0,
      ctr: 0,
      cpm: 0,
      cpc: 0,
      cpa: 0,
      roas: 0,
      sentimentScore: {
        positive: 0,
        negative: 0,
        neutral: 0,
        overall: 0,
        totalMentions: 0
      },
      lastUpdated: new Date()
    },
    createdBy: 'user123',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['engagement', 'comunidad', 'q4-2024', 'social']
  },
  {
    id: '5',
    name: 'Retargeting Carritos Abandonados',
    description: 'Campaña de retargeting para recuperar usuarios que abandonaron sus carritos de compra',
    status: CampaignStatus.SCHEDULED,
    type: CampaignType.SALES_CONVERSION,
    objectives: [
      {
        id: 'obj6',
        type: ObjectiveType.CONVERSIONS,
        target: 200,
        current: 0,
        unit: 'sales',
        priority: 'high'
      }
    ],
    budget: {
      total: 8000,
      spent: 0,
      currency: 'USD',
      dailyLimit: 200,
      bidStrategy: BidStrategy.TARGET_ROAS
    },
    timeline: {
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-05-15'),
      timezone: 'UTC-5',
      scheduledPosts: []
    },
    platforms: [SocialPlatform.FACEBOOK, SocialPlatform.INSTAGRAM],
    targeting: {
      demographics: {
        ageRange: { min: 25, max: 50 },
        gender: 'all',
        education: [],
        income: ['middle', 'high'],
        relationshipStatus: []
      },
      interests: ['online_shopping', 'ecommerce'],
      behaviors: ['cart_abandoners', 'previous_purchasers'],
      locations: [
        { type: 'country', value: 'US' },
        { type: 'country', value: 'CA' }
      ],
      languages: ['en'],
      customAudiences: ['cart_abandoners_30_days', 'website_visitors']
    },
    content: [],
    metrics: {
      impressions: 0,
      clicks: 0,
      engagements: 0,
      conversions: 0,
      reach: 0,
      ctr: 0,
      cpm: 0,
      cpc: 0,
      cpa: 0,
      roas: 0,
      sentimentScore: {
        positive: 0,
        negative: 0,
        neutral: 0,
        overall: 0,
        totalMentions: 0
      },
      lastUpdated: new Date()
    },
    createdBy: 'user456',
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date(),
    tags: ['retargeting', 'carritos-abandonados', 'conversión', 'ecommerce']
  }
];
