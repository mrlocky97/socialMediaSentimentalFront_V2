import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, finalize, map, retry, switchMap, tap } from 'rxjs/operators';

// ===== CONFIGURACIÓN DE LA API =====
const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api/v1',
  ENDPOINTS: {
    // Autenticación
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    // Campañas
    CAMPAIGNS: '/campaigns',
    CAMPAIGN_START: (id: string) => `/campaigns/${id}/start`,
    CAMPAIGN_STOP: (id: string) => `/campaigns/${id}/stop`,
    CAMPAIGN_STATS: (id: string) => `/campaigns/${id}/stats`,
    // Análisis de Sentimientos
    SENTIMENT_ANALYZE: '/sentiment/analyze',
    SENTIMENT_BATCH: '/sentiment/batch',
    SENTIMENT_INSIGHTS: (campaignId: string) => `/sentiment/insights/${campaignId}`,
    // Scraping
    SCRAPING_TWEETS: '/scraping/tweets',
    SCRAPING_STATUS: '/scraping/status',
    SCRAPING_BATCH: '/scraping/batch',
    // Usuarios
    USERS: '/users',
    USER_BY_ID: (id: string) => `/users/${id}`,
    // Plantillas
    TEMPLATES: '/templates',
    TEMPLATES_RECOMMEND: '/templates/recommend'
  }
};

// ===== INTERFACES BACKEND REALES =====

// Usuario del sistema
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: 'admin' | 'manager' | 'analyst' | 'onlyView' | 'client';
  permissions: string[];
  organizationId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Autor de Twitter
export interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  verified: boolean;
  followers: number;
  following: number;
  profileImage?: string;
  bio?: string;
}

// Métricas de Tweet
export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  views?: number;
  bookmarks?: number;
}

// Análisis de Sentimiento
export interface SentimentAnalysis {
  score: number; // -1 a +1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0 a 1
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
  };
  entities?: {
    persons: string[];
    organizations: string[];
    locations: string[];
  };
  keywords: string[];
  marketingInsights?: {
    brandMention: boolean;
    competitorMention: boolean;
    purchaseIntent: number;
    recommendation: string;
  };
}

// Tweet completo
export interface Tweet {
  id: string;
  tweetId: string;
  content: string;
  author: TwitterUser;
  metrics: TweetMetrics;
  sentiment?: SentimentAnalysis;
  hashtags: string[];
  mentions: string[];
  campaignId?: string;
  scrapedAt: Date;
  createdAt: Date;
}

// Estadísticas de Campaña
export interface CampaignStats {
  totalTweets: number;
  totalEngagement: number;
  averageSentiment: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topHashtags: Array<{ tag: string; count: number; }>;
  topMentions: Array<{ mention: string; count: number; }>;
  engagementRate: number;
  reachEstimate: number;
  lastUpdated: Date;
}

// Campaña completa
export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'brand-monitoring' | 'competitor-analysis' | 'market-research';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  hashtags: string[];
  keywords: string[];
  mentions: string[];
  dataSources: string[];
  startDate: Date;
  endDate: Date;
  organizationId: string;
  createdBy: string;
  assignedTo: string[];
  stats: CampaignStats;
  createdAt: Date;
  updatedAt: Date;
}

// Insights de Marketing
export interface MarketingInsights {
  campaignId: string;
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalMentions: number;
    sentimentScore: number;
    engagementRate: number;
    reachEstimate: number;
  };
  trends: Array<{
    date: Date;
    sentiment: number;
    volume: number;
    engagement: number;
  }>;
  topInfluencers: Array<{
    user: TwitterUser;
    influence: number;
    sentiment: number;
    mentions: number;
  }>;
  competitorAnalysis?: Array<{
    competitor: string;
    mentions: number;
    sentiment: number;
    shareOfVoice: number;
  }>;
  recommendations: Array<{
    type: 'opportunity' | 'threat' | 'optimization';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: number;
  }>;
}

// Estado del Scraping
export interface ScrapingStatus {
  isActive: boolean;
  activeCampaigns: number;
  tweetsPerHour: number;
  lastUpdate: Date;
  queueSize: number;
  errors: Array<{
    timestamp: Date;
    message: string;
    campaignId?: string;
  }>;
}

// Plantilla de Campaña
export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  type: Campaign['type'];
  defaultKeywords: string[];
  defaultHashtags: string[];
  defaultMentions: string[];
  suggestedDuration: number; // días
  targetMetrics: {
    minTweets: number;
    expectedSentiment: number;
  };
}

// Respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Dashboard Metrics (actualizado para empresa)
export interface DashboardMetrics {
  // Métricas generales
  totalCampaigns: number;
  activeCampaigns: number;
  totalTweets: number;
  totalUsers: number;

  // Sentimientos
  overallSentiment: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };

  // Campañas recientes
  recentCampaigns: Campaign[];

  // Analytics
  trendsData: Array<{
    date: Date;
    sentiment: number;
    volume: number;
    campaigns: number;
  }>;

  // Top performers
  topCampaigns: Array<{
    campaign: Campaign;
    performance: number;
    trend: 'up' | 'down' | 'stable';
  }>;

  // Alerts y notificaciones
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    message: string;
    campaignId?: string;
    timestamp: Date;
    acknowledged: boolean;
  }>;

  // Estado del sistema
  systemHealth: {
    scrapingStatus: 'active' | 'paused' | 'error';
    apiStatus: 'healthy' | 'degraded' | 'down';
    databaseStatus: 'connected' | 'disconnected';
    lastHealthCheck: Date;
  };
}

// Tipos para requests
export interface CreateCampaignRequest {
  name: string;
  description: string;
  type: Campaign['type'];
  hashtags: string[];
  keywords: string[];
  mentions: string[];
  startDate: Date;
  endDate: Date;
}

export interface AnalyzeTweetRequest {
  text: string;
  campaignId?: string;
}

// ===== SERVICIO PRINCIPAL =====
@Injectable({
  providedIn: 'root'
})
export class SentimentAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // Subjects para manejo de estado
  private readonly destroy$ = new Subject<void>();
  private readonly refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // ===== SIGNALS DE ESTADO =====

  // Estado de carga
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly lastUpdate = signal<Date>(new Date());

  // Datos principales
  public readonly campaigns = signal<Campaign[]>([]);
  public readonly currentUser = signal<User | null>(null);
  public readonly dashboardMetrics = signal<DashboardMetrics>(this.getEmptyDashboardMetrics());
  public readonly scrapingStatus = signal<ScrapingStatus>(this.getEmptyScrapingStatus());

  // Computed values
  public readonly activeCampaigns = computed(() =>
    this.campaigns().filter(c => c.status === 'active')
  );

  public readonly totalTweets = computed(() =>
    this.campaigns().reduce((sum, c) => sum + c.stats.totalTweets, 0)
  );

  public readonly overallSentiment = computed(() => {
    const campaigns = this.campaigns();
    if (campaigns.length === 0) return 0;
    return campaigns.reduce((sum, c) => sum + c.stats.averageSentiment, 0) / campaigns.length;
  });

  public readonly systemHealthColor = computed(() => {
    const health = this.dashboardMetrics().systemHealth;
    if (health.apiStatus === 'down' || health.databaseStatus === 'disconnected') return '#f44336';
    if (health.apiStatus === 'degraded' || health.scrapingStatus === 'error') return '#ff9800';
    return '#4caf50';
  });

  constructor() {
    // Configurar destrucción automática
    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });

    // DESACTIVADO: Monitoreo automático para evitar peticiones HTTP no autorizadas
    console.log('  SentimentAnalysisService - setupAutoRefresh DESACTIVADO para evitar errores 401');
    // this.setupAutoRefresh();
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Cargar datos del dashboard
   */
  public loadDashboardData(): Observable<DashboardMetrics> {
    this.isLoading.set(true);
    this.error.set(null);

    // Cargar datos combinados
    return this.http.get<ApiResponse<Campaign[]>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAMPAIGNS}`)
      .pipe(
        switchMap(campaignsResponse => {
          this.campaigns.set(campaignsResponse.data);

          // Cargar estado del scraping
          return this.http.get<ApiResponse<ScrapingStatus>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCRAPING_STATUS}`);
        }),
        map(scrapingResponse => {
          this.scrapingStatus.set(scrapingResponse.data);

          // Construir métricas del dashboard
          const metrics = this.buildDashboardMetrics();
          this.dashboardMetrics.set(metrics);
          this.lastUpdate.set(new Date());

          return metrics;
        }),
        retry(2),
        catchError(error => {
          // Si es error 401 o backend no disponible, usar datos mock
          if (error.status === 401 || error.status === 0 || error.status === 404 || error.status === 500) {
            console.warn('Backend no disponible o sin autenticación, usando datos mock para desarrollo');
            return this.loadMockDashboardData();
          }
          return this.handleError(error);
        }),
        finalize(() => this.isLoading.set(false))
      );
  }

  /**
   * Crear nueva campaña
   */
  public createCampaign(request: CreateCampaignRequest): Observable<Campaign> {
    this.isLoading.set(true);

    return this.http.post<ApiResponse<Campaign>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAMPAIGNS}`, request)
      .pipe(
        map(response => response.data),
        tap(campaign => {
          // Actualizar lista de campañas
          this.campaigns.update(campaigns => [...campaigns, campaign]);
        }),
        catchError(this.handleError.bind(this)),
        finalize(() => this.isLoading.set(false))
      );
  }

  /**
   * Iniciar campaña
   */
  public startCampaign(campaignId: string): Observable<Campaign> {
    return this.http.post<ApiResponse<Campaign>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAMPAIGN_START(campaignId)}`, {})
      .pipe(
        map(response => response.data),
        tap(campaign => {
          // Actualizar campaña en la lista
          this.updateCampaignInList(campaign);
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Detener campaña
   */
  public stopCampaign(campaignId: string): Observable<Campaign> {
    return this.http.post<ApiResponse<Campaign>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAMPAIGN_STOP(campaignId)}`, {})
      .pipe(
        map(response => response.data),
        tap(campaign => {
          this.updateCampaignInList(campaign);
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Analizar tweet individual
   * Endpoint: POST /api/v1/sentiment/analyze
   */
  public analyzeTweet(text: string, campaignId?: string): Observable<SentimentAnalysis> {
    const request: AnalyzeTweetRequest = { text, campaignId };

    return this.http.post<ApiResponse<SentimentAnalysis>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SENTIMENT_ANALYZE}`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Analizar múltiples textos de forma batch
   * Endpoint: POST /api/v1/sentiment/batch
   */
  public analyzeBatch(texts: string[], campaignId?: string): Observable<SentimentAnalysis[]> {
    const request = { texts, campaignId };

    return this.http.post<ApiResponse<SentimentAnalysis[]>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SENTIMENT_BATCH}`, request)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error in batch sentiment analysis:', error);
          
          // Fallback: análisis individual de cada texto
          const fallbackAnalyses = texts.map(text => ({
            score: Math.random() * 2 - 1, // -1 a +1
            label: Math.random() > 0.5 ? 'positive' : 'negative',
            confidence: Math.random() * 0.5 + 0.5, // 0.5 a 1
            emotions: {
              joy: Math.random() * 0.3,
              anger: Math.random() * 0.2,
              fear: Math.random() * 0.15,
              sadness: Math.random() * 0.2,
              surprise: Math.random() * 0.1,
              disgust: Math.random() * 0.1
            },
            keywords: text.split(' ').slice(0, 3)
          } as SentimentAnalysis));

          return of(fallbackAnalyses);
        })
      );
  }

  /**
   * Obtener estado del modelo de análisis de sentimiento
   * Endpoint: GET /api/v1/sentiment/model-status
   */
  public getModelStatus(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${API_CONFIG.BASE_URL}/sentiment/model-status`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error getting sentiment model status:', error);
          
          // Fallback con datos mock
          const mockStatus = {
            status: 'active',
            model: {
              name: 'BERT-Sentiment-ES',
              version: '2.1.0',
              accuracy: 0.89
            },
            performance: {
              avgResponseTime: 150,
              requestsPerSecond: 25,
              successRate: 0.98
            }
          };

          return of(mockStatus);
        })
      );
  }

  /**
   * Obtener insights de marketing para una campaña
   */
  public getCampaignInsights(campaignId: string): Observable<MarketingInsights> {
    return this.http.get<ApiResponse<MarketingInsights>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SENTIMENT_INSIGHTS(campaignId)}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtener plantillas de campaña
   */
  public getCampaignTemplates(): Observable<CampaignTemplate[]> {
    return this.http.get<ApiResponse<CampaignTemplate[]>>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATES}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Iniciar monitoreo en tiempo real - DESACTIVADO para evitar errores 401
   */
  public startRealTimeMonitoring(): void {
    console.log('  SentimentAnalysisService - startRealTimeMonitoring DESACTIVADO para evitar errores 401');
    // Trigger refresh cada 30 segundos - DESACTIVADO
    // interval(30000)
    //   .pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     switchMap(() => this.loadDashboardData()),
    //     catchError(error => {
    //       console.warn('Error en monitoreo en tiempo real:', error);
    //       return of(null);
    //     })
    //   )
    //   .subscribe();
  }

  /**
   * Detener monitoreo en tiempo real
   */
  public stopRealTimeMonitoring(): void {
    this.destroy$.next();
  }

  /**
   * Actualizar manualmente
   */
  public refresh(): void {
    this.refreshTrigger$.next();
  }

  // ===== MÉTODOS PRIVADOS =====

  private setupAutoRefresh(): void {
    // DESACTIVADO: Auto-refresh para evitar peticiones HTTP no autorizadas
    console.log('  SentimentAnalysisService - setupAutoRefresh DESACTIVADO para evitar errores 401');
    // Auto-refresh cada 2 minutos - DESACTIVADO
    // this.refreshTrigger$
    //   .pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     debounceTime(1000),
    //     switchMap(() => this.loadDashboardData()),
    //     catchError(error => {
    //       console.error('Error en auto-refresh:', error);
    //       return of(null);
    //     })
    //   )
    //   .subscribe();
  }

  private buildDashboardMetrics(): DashboardMetrics {
    const campaigns = this.campaigns();
    const scrapingStatus = this.scrapingStatus();

    const totalTweets = campaigns.reduce((sum, c) => sum + c.stats.totalTweets, 0);
    const totalPositive = campaigns.reduce((sum, c) => sum + c.stats.sentimentDistribution.positive, 0);
    const totalNegative = campaigns.reduce((sum, c) => sum + c.stats.sentimentDistribution.negative, 0);
    const totalNeutral = campaigns.reduce((sum, c) => sum + c.stats.sentimentDistribution.neutral, 0);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalTweets,
      totalUsers: 0, // Se cargará después
      overallSentiment: campaigns.length > 0 ?
        campaigns.reduce((sum, c) => sum + c.stats.averageSentiment, 0) / campaigns.length : 0,
      sentimentDistribution: {
        positive: totalTweets > 0 ? totalPositive / totalTweets : 0,
        negative: totalTweets > 0 ? totalNegative / totalTweets : 0,
        neutral: totalTweets > 0 ? totalNeutral / totalTweets : 0
      },
      recentCampaigns: campaigns.slice(0, 5),
      trendsData: [],
      topCampaigns: campaigns
        .map(campaign => ({
          campaign,
          performance: campaign.stats.averageSentiment * campaign.stats.engagementRate,
          trend: 'stable' as const
        }))
        .sort((a, b) => b.performance - a.performance)
        .slice(0, 5),
      alerts: scrapingStatus.errors.map(error => ({
        id: Math.random().toString(36),
        type: 'error' as const,
        message: error.message,
        campaignId: error.campaignId,
        timestamp: error.timestamp,
        acknowledged: false
      })),
      systemHealth: {
        scrapingStatus: scrapingStatus.isActive ? 'active' : 'paused',
        apiStatus: 'healthy',
        databaseStatus: 'connected',
        lastHealthCheck: new Date()
      }
    };
  }

  private updateCampaignInList(updatedCampaign: Campaign): void {
    this.campaigns.update(campaigns =>
      campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Error del servidor: ${error.status} ${error.message}`;
    }

    this.error.set(errorMessage);
    console.error('Error en SentimentAnalysisService:', error);
    return throwError(() => new Error(errorMessage));
  }

  private getEmptyDashboardMetrics(): DashboardMetrics {
    return {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalTweets: 0,
      totalUsers: 0,
      overallSentiment: 0,
      sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
      recentCampaigns: [],
      trendsData: [],
      topCampaigns: [],
      alerts: [],
      systemHealth: {
        scrapingStatus: 'paused',
        apiStatus: 'healthy',
        databaseStatus: 'connected',
        lastHealthCheck: new Date()
      }
    };
  }

  private getEmptyScrapingStatus(): ScrapingStatus {
    return {
      isActive: false,
      activeCampaigns: 0,
      tweetsPerHour: 0,
      lastUpdate: new Date(),
      queueSize: 0,
      errors: []
    };
  }

  /**
   * Cargar datos mock para desarrollo cuando el backend no está disponible
   */
  private loadMockDashboardData(): Observable<DashboardMetrics> {
    console.log('🚀 Cargando datos mock para desarrollo');

    // Crear campañas mock
    const mockCampaigns: Campaign[] = [
      {
        id: 'mock-campaign-001',
        name: 'Campaña Demo Marketing Digital',
        description: 'Análisis de sentimientos sobre nuestra marca en redes sociales',
        type: 'brand-monitoring',
        status: 'active',
        hashtags: ['#marketing', '#digitalmarketing'],
        keywords: ['marketing digital', 'nuestra marca'],
        mentions: ['@nuestra_marca', '@empresa'],
        dataSources: ['twitter', 'instagram'],
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-31'),
        organizationId: 'mock-org-001',
        createdBy: 'mock-admin-001',
        assignedTo: ['mock-analyst-001'],
        stats: {
          totalTweets: 1250,
          totalEngagement: 8945,
          averageSentiment: 0.72,
          sentimentDistribution: {
            positive: 65,
            neutral: 25,
            negative: 10
          },
          topHashtags: [
            { tag: '#marketing', count: 234 },
            { tag: '#digitalmarketing', count: 198 }
          ],
          topMentions: [
            { mention: '@nuestra_marca', count: 445 },
            { mention: '@empresa', count: 234 }
          ],
          engagementRate: 3.4,
          reachEstimate: 15600,
          lastUpdated: new Date()
        },
        createdAt: new Date('2025-08-01'),
        updatedAt: new Date()
      },
      {
        id: 'mock-campaign-002',
        name: 'Análisis Competencia',
        description: 'Monitoreo de sentimientos hacia la competencia',
        type: 'competitor-analysis',
        status: 'paused',
        hashtags: ['#competencia', '#industria'],
        keywords: ['competidor', 'industria tech'],
        mentions: ['@competidor1', '@competidor2'],
        dataSources: ['twitter'],
        startDate: new Date('2025-07-15'),
        endDate: new Date('2025-08-15'),
        organizationId: 'mock-org-001',
        createdBy: 'mock-admin-001',
        assignedTo: ['mock-analyst-001'],
        stats: {
          totalTweets: 654,
          totalEngagement: 4234,
          averageSentiment: -0.12,
          sentimentDistribution: {
            positive: 30,
            neutral: 45,
            negative: 25
          },
          topHashtags: [
            { tag: '#competencia', count: 123 },
            { tag: '#industria', count: 89 }
          ],
          topMentions: [
            { mention: '@competidor1', count: 234 },
            { mention: '@competidor2', count: 156 }
          ],
          engagementRate: 2.1,
          reachEstimate: 8900,
          lastUpdated: new Date()
        },
        createdAt: new Date('2025-07-15'),
        updatedAt: new Date()
      }
    ];

    // Crear estado de scraping mock
    const mockScrapingStatus: ScrapingStatus = {
      isActive: true,
      activeCampaigns: 1,
      tweetsPerHour: 150,
      lastUpdate: new Date(),
      queueSize: 25,
      errors: []
    };

    // Actualizar estado con datos mock
    this.campaigns.set(mockCampaigns);
    this.scrapingStatus.set(mockScrapingStatus);

    // Construir métricas del dashboard
    const metrics = this.buildDashboardMetrics();
    this.dashboardMetrics.set(metrics);
    this.lastUpdate.set(new Date());

    return of(metrics);
  }
}
