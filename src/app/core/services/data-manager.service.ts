/**
 * ===== DATA MANAGER SERVICE - BACKEND ACTIVADO =====
 * Servicio unificado para toda la gestión de datos con conectividad backend
 */

import { HttpClient } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { catchError, finalize, map, mergeMap, retryWhen, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';
import { BackendTestService } from './backend-test.service';

// ===== INTERFACES =====
export interface Campaign {
  _id?: string; //optional
  id: string;
  name: string;
  description: string;
  type: 'brand-monitoring' | 'competitor-analysis' | 'market-research';
  status: 'draft' | 'active' | 'paused' | 'completed';
  hashtags: string[];
  keywords: string[];
  mentions?: string[];
  startDate: Date;
  endDate: Date;
  organizationId?: string;
  dataSources?: string[];
  languages?: string[];
  maxTweets?: number;
  stats: {
    totalTweets: number;
    averageSentiment: number;
    sentimentDistribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    engagementRate: number;
    reachEstimate: number;
    lastUpdated: Date;
  };
  createdAt: Date;
}

export interface Tweet {
  id: string;
  content: string;
  author: {
    username: string;
    displayName: string;
    verified: boolean;
  };
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
  campaignId: string;
  createdAt: Date;
}

export interface DashboardData {
  campaigns: Campaign[];
  recentTweets: Tweet[];
  metrics: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalTweets: number;
    overallSentiment: number;
  };
  systemStatus: {
    isOnline: boolean;
    lastSync: Date;
    pendingTweets: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataManagerService {
  private readonly http = inject(HttpClient);
  private readonly backendTest = inject(BackendTestService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  // ===== ESTADO REACTIVO =====
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly isOnline = signal<boolean>(true);
  public readonly campaigns = signal<Campaign[]>([]);
  public readonly recentTweets = signal<Tweet[]>([]);
  public readonly pendingTweetsCount = signal<number>(0);

  // ===== COMPUTED VALUES =====
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

  public readonly dashboardMetrics = computed(() => ({
    totalCampaigns: this.campaigns().length,
    activeCampaigns: this.activeCampaigns().length,
    totalTweets: this.totalTweets(),
    overallSentiment: this.overallSentiment()
  }));

  constructor() {
    // Inicializar con datos mock para desarrollo
    this.initializeMockData();

    // Test conectividad backend si está habilitado
    if (environment.features?.realTimeUpdates) {
      this.testBackendConnectivity();
    }
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Cargar datos del dashboard
   */
  public loadDashboardData(): Observable<DashboardData> {
    if (this.isLoading()) {
      return of(this.getCurrentData());
    }

    this.setLoading(true);

    if (!this.isOnline()) {
      return this.getMockDashboardData();
    }

    return this.http.get<ApiResponse<DashboardData>>(`${environment.apiUrl}/dashboard`)
      .pipe(
        // Only retry once and only for network/server errors (status 0 or 5xx).
        // Avoid retrying on 4xx (client errors like 404) which cause duplicate requests.
        retryWhen(errors => errors.pipe(
          mergeMap((err, i) => {
            const shouldRetry = !err?.status || err.status >= 500;
            if (shouldRetry && i < 1) {
              // retry once after short delay
              return timer(1000);
            }
            return throwError(() => err);
          })
        )),
        map((response: ApiResponse<DashboardData>) => {
          if (!response.success) {
            throw new Error(response.message || 'Error loading data');
          }
          return response.data;
        }),
        tap((data: DashboardData) => {
          this.updateState(data);
        }),
        catchError(() => {
          console.info('Backend offline, using mock data');
          this.isOnline.set(false);
          return this.getMockDashboardData();
        }),
        finalize(() => this.setLoading(false)),
        shareReplay(1)
      );
  }

  /**
   * Crear nueva campaña
   */
  public createCampaign(campaignData: Partial<Campaign>): Observable<Campaign> {
    const mockCampaign = this.createMockCampaignData(campaignData);
    
    if (!this.isOnline()) {
      this.campaigns.update(campaigns => [...campaigns, mockCampaign]);
      return of(mockCampaign);
    }

    return this.http.post<ApiResponse<Campaign>>(`${environment.apiUrl}/campaigns`, campaignData)
      .pipe(
        map((response: ApiResponse<Campaign>) => response.data),
        tap((campaign: Campaign) => {
          this.campaigns.update(campaigns => [...campaigns, campaign]);
        }),
        catchError(() => {
          // Fallback a mock
          this.campaigns.update(campaigns => [...campaigns, mockCampaign]);
          return of(mockCampaign);
        })
      );
  }

  /**
   * Toggle campaña (start/stop)
   */
  public toggleCampaign(campaignId: string, action: 'start' | 'stop'): Observable<Campaign> {
    const campaign = this.campaigns().find(c => c.id === campaignId);
    if (!campaign) {
      return throwError(() => new Error('Campaign not found'));
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      status: action === 'start' ? 'active' : 'paused'
    };

    this.updateCampaignInList(updatedCampaign);
    return of(updatedCampaign);
  }

  /**
   * Obtener tweets de campaña
   */
  public getCampaignTweets(campaignId: string): Observable<Tweet[]> {
    const tweets = this.recentTweets().filter(t => t.campaignId === campaignId);
    return of(tweets);
  }

  /**
   * Refrescar datos
   */
  public refresh(): void {
    this.refresh$.next();
    this.loadDashboardData().subscribe();
  }

  // ===== MÉTODOS PRIVADOS =====

  private testBackendConnectivity(): void {
    this.backendTest.runFullConnectivityTest()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        this.isOnline.set(result.overall);
        console.log('Backend connectivity:', result.overall ? 'ONLINE' : 'OFFLINE');
      });
  }

  private initializeMockData(): void {
    this.getMockDashboardData().subscribe();
  }

  private setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  private updateState(data: DashboardData): void {
    this.campaigns.set(data.campaigns);
    this.recentTweets.set(data.recentTweets);
    this.pendingTweetsCount.set(data.systemStatus.pendingTweets);
    this.isOnline.set(true);
    this.error.set(null);
  }

  private updateCampaignInList(updatedCampaign: Campaign): void {
    this.campaigns.update(campaigns =>
      campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c)
    );
  }

  private getCurrentData(): DashboardData {
    return {
      campaigns: this.campaigns(),
      recentTweets: this.recentTweets(),
      metrics: this.dashboardMetrics(),
      systemStatus: {
        isOnline: this.isOnline(),
        lastSync: new Date(),
        pendingTweets: this.pendingTweetsCount()
      }
    };
  }

  private createMockCampaignData(campaignData: Partial<Campaign>): Campaign {
    return {
      id: `mock-${Date.now()}`,
      name: campaignData.name || 'Nueva Campaña',
      description: campaignData.description || 'Descripción de campaña',
      type: campaignData.type || 'brand-monitoring',
      status: 'draft',
      hashtags: campaignData.hashtags || [],
      keywords: campaignData.keywords || [],
      startDate: campaignData.startDate || new Date(),
      endDate: campaignData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stats: {
        totalTweets: 0,
        averageSentiment: 0,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        engagementRate: 0,
        reachEstimate: 0,
        lastUpdated: new Date()
      },
      createdAt: new Date()
    };
  }

  private getMockDashboardData(): Observable<DashboardData> {
    const mockCampaigns: Campaign[] = [
      {
        id: 'demo-001',
        name: '🚀 Demo Marketing Campaign',
        description: 'Análisis de sentimientos de nuestra marca',
        type: 'brand-monitoring',
        status: 'active',
        hashtags: ['#marketing', '#brand'],
        keywords: ['marketing', 'brand'],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        stats: {
          totalTweets: 1250,
          averageSentiment: 0.72,
          sentimentDistribution: { positive: 0.65, negative: 0.10, neutral: 0.25 },
          engagementRate: 3.4,
          reachEstimate: 15600,
          lastUpdated: new Date()
        },
        createdAt: new Date('2025-01-01')
      },
      {
        id: 'demo-002',
        name: '🔍 Competitor Analysis',
        description: 'Análisis de competencia',
        type: 'competitor-analysis',
        status: 'paused',
        hashtags: ['#tech', '#startup'],
        keywords: ['tech', 'startup'],
        startDate: new Date('2024-12-15'),
        endDate: new Date('2025-01-15'),
        stats: {
          totalTweets: 654,
          averageSentiment: -0.12,
          sentimentDistribution: { positive: 0.30, negative: 0.25, neutral: 0.45 },
          engagementRate: 2.1,
          reachEstimate: 8900,
          lastUpdated: new Date()
        },
        createdAt: new Date('2024-12-15')
      }
    ];

    const mockTweets: Tweet[] = [
      {
        id: 'tweet-001',
        content: '¡Excelente herramienta de marketing! #marketing',
        author: { username: 'user1', displayName: 'Marketing User', verified: true },
        sentiment: { score: 0.8, label: 'positive', confidence: 0.92 },
        metrics: { likes: 45, retweets: 12, replies: 8 },
        campaignId: 'demo-001',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'tweet-002',
        content: 'Interesante análisis de competencia #tech',
        author: { username: 'user2', displayName: 'Tech User', verified: false },
        sentiment: { score: 0.3, label: 'neutral', confidence: 0.75 },
        metrics: { likes: 23, retweets: 5, replies: 12 },
        campaignId: 'demo-002',
        createdAt: new Date(Date.now() - 7200000)
      }
    ];

    const mockData: DashboardData = {
      campaigns: mockCampaigns,
      recentTweets: mockTweets,
      metrics: {
        totalCampaigns: mockCampaigns.length,
        activeCampaigns: 1,
        totalTweets: 1904,
        overallSentiment: 0.30
      },
      systemStatus: {
        isOnline: false,
        lastSync: new Date(),
        pendingTweets: 47
      }
    };

    // Actualizar estado
    this.updateState(mockData);
    
    return of(mockData).pipe(
      finalize(() => this.setLoading(false))
    );
  }
}
