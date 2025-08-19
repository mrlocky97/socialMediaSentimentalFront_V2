/**
 * ===== DATA MANAGER SERVICE - OPTIMIZADO PARA DEMO =====
 * Servicio unificado que maneja toda la data de la aplicación
 * Elimina duplicaciones y optimiza para velocidad en demo
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { catchError, finalize, map, retry, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';

// ===== INTERFACES OPTIMIZADAS =====
export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'brand-monitoring' | 'competitor-analysis' | 'market-research';
  status: 'draft' | 'active' | 'paused' | 'completed';
  hashtags: string[];
  keywords: string[];
  startDate: Date;
  endDate: Date;
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
    score: number; // -1 to 1
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
  private readonly destroyRef = inject(DestroyRef);

  // ===== ESTADO CENTRALIZADO =====
  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  
  // Signals principales
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  public readonly isOnline = signal<boolean>(true);
  
  // Data signals
  public readonly campaigns = signal<Campaign[]>([]);
  public readonly recentTweets = signal<Tweet[]>([]);
  public readonly pendingTweetsCount = signal<number>(0);
  
  // Computed values optimizados
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
    // Setup auto-refresh cada 5 minutos (solo si está online)
    timer(0, 300000) // 5 minutos
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.isOnline() ? this.loadDashboardData() : of(null))
      )
      .subscribe({
        error: (error) => console.warn('Auto-refresh error:', error)
      });
  }

  // ===== MÉTODOS PRINCIPALES =====

  /**
   * Cargar todos los datos del dashboard de forma optimizada
   */
  public loadDashboardData(): Observable<DashboardData> {
    if (this.isLoading()) {
      return of(this.getCurrentData());
    }

    this.setLoading(true);

    return this.http.get<ApiResponse<DashboardData>>(`${environment.apiUrl}/dashboard`)
      .pipe(
        retry(2),
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Error loading dashboard data');
          }
          return response.data;
        }),
        tap(data => {
          // Actualizar estado
          this.campaigns.set(data.campaigns);
          this.recentTweets.set(data.recentTweets);
          this.pendingTweetsCount.set(data.systemStatus.pendingTweets);
          this.isOnline.set(true);
          this.error.set(null);
        }),
        catchError(error => {
          console.warn('Backend no disponible, usando datos mock');
          this.isOnline.set(false);
          return this.loadMockData();
        }),
        shareReplay(1),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Crear nueva campaña
   */
  public createCampaign(campaignData: Partial<Campaign>): Observable<Campaign> {
    if (!this.isOnline()) {
      return this.createMockCampaign(campaignData);
    }

    this.setLoading(true);

    return this.http.post<ApiResponse<Campaign>>(`${environment.apiUrl}/campaigns`, campaignData)
      .pipe(
        map(response => response.data),
        tap(campaign => {
          // Actualizar lista local
          this.campaigns.update(campaigns => [...campaigns, campaign]);
        }),
        catchError(error => {
          console.warn('Error creando campaña, usando mock');
          return this.createMockCampaign(campaignData);
        }),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Controlar campaña (start/stop)
   */
  public toggleCampaign(campaignId: string, action: 'start' | 'stop'): Observable<Campaign> {
    if (!this.isOnline()) {
      return this.toggleMockCampaign(campaignId, action);
    }

    return this.http.post<ApiResponse<Campaign>>(`${environment.apiUrl}/campaigns/${campaignId}/${action}`, {})
      .pipe(
        map(response => response.data),
        tap(campaign => {
          this.updateCampaignInList(campaign);
        }),
        catchError(error => {
          console.warn(`Error en ${action} campaña, usando mock`);
          return this.toggleMockCampaign(campaignId, action);
        })
      );
  }

  /**
   * Obtener tweets de una campaña
   */
  public getCampaignTweets(campaignId: string, limit = 50): Observable<Tweet[]> {
    if (!this.isOnline()) {
      return this.getMockCampaignTweets(campaignId);
    }

    return this.http.get<ApiResponse<Tweet[]>>(`${environment.apiUrl}/campaigns/${campaignId}/tweets?limit=${limit}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.warn('Error obteniendo tweets, usando mock');
          return this.getMockCampaignTweets(campaignId);
        })
      );
  }

  /**
   * Forzar refresh de datos
   */
  public refresh(): void {
    this.refresh$.next();
    this.loadDashboardData().subscribe();
  }

  // ===== MÉTODOS PRIVADOS =====

  private setLoading(loading: boolean): void {
    this.isLoading.set(loading);
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

  // ===== DATOS MOCK OPTIMIZADOS =====

  private loadMockData(): Observable<DashboardData> {
    const mockCampaigns: Campaign[] = [
      {
        id: 'demo-001',
        name: '🚀 Campaña Demo - Marketing Digital',
        description: 'Análisis de sentimientos sobre nuestra marca',
        type: 'brand-monitoring',
        status: 'active',
        hashtags: ['#marketing', '#digitalmarketing', '#brand'],
        keywords: ['marketing digital', 'nuestra marca', 'innovación'],
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-31'),
        stats: {
          totalTweets: 1250,
          averageSentiment: 0.72,
          sentimentDistribution: { positive: 65, negative: 10, neutral: 25 },
          engagementRate: 3.4,
          reachEstimate: 15600,
          lastUpdated: new Date()
        },
        createdAt: new Date('2025-08-01')
      },
      {
        id: 'demo-002',
        name: '🔍 Análisis Competencia Tech',
        description: 'Monitoreo de competitors en el sector tecnológico',
        type: 'competitor-analysis',
        status: 'paused',
        hashtags: ['#tech', '#startup', '#innovation'],
        keywords: ['tecnología', 'startup', 'competencia'],
        startDate: new Date('2025-07-15'),
        endDate: new Date('2025-08-15'),
        stats: {
          totalTweets: 654,
          averageSentiment: -0.12,
          sentimentDistribution: { positive: 30, negative: 25, neutral: 45 },
          engagementRate: 2.1,
          reachEstimate: 8900,
          lastUpdated: new Date()
        },
        createdAt: new Date('2025-07-15')
      },
      {
        id: 'demo-003',
        name: '📊 Investigación de Mercado',
        description: 'Análisis de tendencias del mercado actual',
        type: 'market-research',
        status: 'completed',
        hashtags: ['#market', '#research', '#trends'],
        keywords: ['mercado', 'tendencias', 'consumidor'],
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-07-31'),
        stats: {
          totalTweets: 892,
          averageSentiment: 0.45,
          sentimentDistribution: { positive: 50, negative: 15, neutral: 35 },
          engagementRate: 2.8,
          reachEstimate: 12400,
          lastUpdated: new Date()
        },
        createdAt: new Date('2025-07-01')
      }
    ];

    const mockTweets: Tweet[] = [
      {
        id: 'tweet-001',
        content: '¡Increíble herramienta de marketing digital! Me está ayudando mucho con mi estrategia. #marketing',
        author: { username: 'marketingpro', displayName: 'Marketing Pro', verified: true },
        sentiment: { score: 0.8, label: 'positive', confidence: 0.92 },
        metrics: { likes: 45, retweets: 12, replies: 8 },
        campaignId: 'demo-001',
        createdAt: new Date(Date.now() - 3600000) // 1 hora atrás
      },
      {
        id: 'tweet-002',
        content: 'La competencia está lanzando productos interesantes, pero creo que podemos hacerlo mejor.',
        author: { username: 'techanalyst', displayName: 'Tech Analyst', verified: false },
        sentiment: { score: -0.2, label: 'neutral', confidence: 0.75 },
        metrics: { likes: 23, retweets: 5, replies: 12 },
        campaignId: 'demo-002',
        createdAt: new Date(Date.now() - 7200000) // 2 horas atrás
      },
      {
        id: 'tweet-003',
        content: 'El análisis de mercado muestra tendencias muy positivas para este sector. #research',
        author: { username: 'dataresearcher', displayName: 'Data Researcher', verified: true },
        sentiment: { score: 0.6, label: 'positive', confidence: 0.88 },
        metrics: { likes: 67, retweets: 28, replies: 15 },
        campaignId: 'demo-003',
        createdAt: new Date(Date.now() - 10800000) // 3 horas atrás
      }
    ];

    const mockData: DashboardData = {
      campaigns: mockCampaigns,
      recentTweets: mockTweets,
      metrics: {
        totalCampaigns: mockCampaigns.length,
        activeCampaigns: mockCampaigns.filter(c => c.status === 'active').length,
        totalTweets: mockCampaigns.reduce((sum, c) => sum + c.stats.totalTweets, 0),
        overallSentiment: 0.35
      },
      systemStatus: {
        isOnline: false,
        lastSync: new Date(),
        pendingTweets: 47
      }
    };

    // Actualizar estado
    this.campaigns.set(mockData.campaigns);
    this.recentTweets.set(mockData.recentTweets);
    this.pendingTweetsCount.set(mockData.systemStatus.pendingTweets);

    return of(mockData);
  }

  private createMockCampaign(campaignData: Partial<Campaign>): Observable<Campaign> {
    const newCampaign: Campaign = {
      id: `mock-${Date.now()}`,
      name: campaignData.name || 'Nueva Campaña',
      description: campaignData.description || 'Descripción de campaña demo',
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

    this.campaigns.update(campaigns => [...campaigns, newCampaign]);
    return of(newCampaign);
  }

  private toggleMockCampaign(campaignId: string, action: 'start' | 'stop'): Observable<Campaign> {
    const campaign = this.campaigns().find(c => c.id === campaignId);
    if (!campaign) {
      return throwError(() => new Error('Campaña no encontrada'));
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      status: action === 'start' ? 'active' : 'paused'
    };

    this.updateCampaignInList(updatedCampaign);
    return of(updatedCampaign);
  }

  private getMockCampaignTweets(campaignId: string): Observable<Tweet[]> {
    return of(this.recentTweets().filter(t => t.campaignId === campaignId));
  }
}
