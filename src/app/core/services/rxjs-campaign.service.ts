/**
 * Campaign Service con RxJS - Ejemplo práctico
 * Implementa patterns específicos para el manejo de campañas
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  of,
  throwError
} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  mergeMap,
  retry,
  shareReplay,
  switchMap,
  tap
} from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';
import { Campaign } from '../../core/state/app.state';

export interface CampaignFilters {
  search: string;
  status: string;
  type: string;
  dateRange: { start: Date | null; end: Date | null };
}

export interface CampaignStats {
  total: number;
  active: number;
  completed: number;
  averageTweets: number;
}

export interface CampaignListState {
  campaigns: Campaign[];
  filteredCampaigns: Campaign[];
  filters: CampaignFilters;
  stats: CampaignStats;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class RxjsCampaignService {
  private readonly http = inject(HttpClient);

  // ================================
  // STATE MANAGEMENT WITH SIGNALS
  // ================================

  private readonly stateSignal = signal<CampaignListState>({
    campaigns: [],
    filteredCampaigns: [],
    filters: {
      search: '',
      status: 'all',
      type: 'all',
      dateRange: { start: null, end: null }
    },
    stats: { total: 0, active: 0, completed: 0, averageTweets: 0 },
    loading: false,
    error: null
  });

  // Computed signals para el estado
  readonly campaigns = computed(() => this.stateSignal().campaigns);
  readonly filteredCampaigns = computed(() => this.stateSignal().filteredCampaigns);
  readonly isLoading = computed(() => this.stateSignal().loading);
  readonly stats = computed(() => this.stateSignal().stats);
  readonly hasError = computed(() => !!this.stateSignal().error);

  // ================================
  // SUBJECTS FOR REACTIVE STREAMS
  // ================================

  // Filtros reactivos
  private readonly searchSubject = new BehaviorSubject<string>('');
  private readonly statusFilterSubject = new BehaviorSubject<string>('all');
  private readonly typeFilterSubject = new BehaviorSubject<string>('all');

  // Acciones CRUD
  private readonly refreshSubject = new Subject<void>();
  private readonly campaignUpdateSubject = new Subject<Campaign>();
  private readonly campaignDeleteSubject = new Subject<string>();

  // ================================
  // REACTIVE STREAMS SETUP
  // ================================

  // Stream principal de campañas - SIN inicialización automática
  readonly campaigns$ = this.refreshSubject.pipe(
    // REMOVIDO: startWith(null) para evitar peticiones automáticas al inicializar
    tap(() => this.updateState({ loading: true, error: null })),
    switchMap(() => this.fetchCampaigns()),
    tap(campaigns => {
      const stats = this.calculateStats(campaigns);
      this.updateState({
        campaigns,
        stats,
        loading: false
      });
    }),
    catchError(error => {
      this.updateState({
        loading: false,
        error: error.message
      });
      return of([]);
    }),
    shareReplay(1)
  );

  // Stream de filtros combinados
  readonly filters$ = combineLatest([
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ),
    this.statusFilterSubject,
    this.typeFilterSubject
  ]).pipe(
    map(([search, status, type]) => ({
      search: search.toLowerCase().trim(),
      status,
      type
    }))
  );

  // Stream de campañas filtradas
  readonly filteredCampaigns$ = combineLatest([
    this.campaigns$,
    this.filters$
  ]).pipe(
    map(([campaigns, filters]) =>
      this.applyFilters(campaigns, filters)
    ),
    tap(filteredCampaigns => {
      this.updateState({ filteredCampaigns });
    }),
    shareReplay(1)
  );

  // Stream de actualizaciones de campañas
  readonly campaignUpdates$ = this.campaignUpdateSubject.pipe(
    mergeMap(updatedCampaign =>
      this.updateCampaign(updatedCampaign).pipe(
        tap(() => this.refresh()),
        catchError(error => {
          console.error('Failed to update campaign:', error);
          return of(null);
        })
      )
    )
  );

  // Stream de eliminaciones
  readonly campaignDeletions$ = this.campaignDeleteSubject.pipe(
    mergeMap(campaignId =>
      this.deleteCampaign(campaignId).pipe(
        tap(() => this.refresh()),
        catchError(error => {
          console.error('Failed to delete campaign:', error);
          return of(null);
        })
      )
    )
  );

  // Real-time updates DESACTIVADO para evitar saturación del backend
  readonly realtimeUpdates$ = of(null).pipe(
    tap(() => console.log('� Campaign real-time updates DESACTIVADO para evitar saturación del backend'))
  );

  constructor() {
    // DESACTIVADO: No inicializar suscripciones automáticas para evitar peticiones inmediatas
    console.log('  CampaignService initialized WITHOUT automatic subscriptions');
    // this.filteredCampaigns$.subscribe();
    // this.campaignUpdates$.subscribe();
    // this.campaignDeletions$.subscribe();
  }

  // ================================
  // PUBLIC API METHODS
  // ================================

  /**
   * Cargar campañas iniciales
   */
  loadCampaigns(): Observable<Campaign[]> {
    this.refresh();
    return this.campaigns$;
  }

  /**
   * Buscar campañas
   */
  search(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * Filtrar por estado
   */
  filterByStatus(status: string): void {
    this.statusFilterSubject.next(status);
  }

  /**
   * Filtrar por tipo
   */
  filterByType(type: string): void {
    this.typeFilterSubject.next(type);
  }

  /**
   * Limpiar todos los filtros
   */
  clearFilters(): void {
    this.searchSubject.next('');
    this.statusFilterSubject.next('all');
    this.typeFilterSubject.next('all');
  }

  /**
   * Crear nueva campaña
   */
  createCampaign(campaignData: Partial<Campaign>): Observable<Campaign> {
    this.updateState({ loading: true });

    return this.http.post<Campaign>(`${environment.apiUrl}/campaigns`, campaignData)
      .pipe(
        tap(() => {
          this.refresh(); // Recargar lista
        }),
        catchError(error => {
          this.updateState({
            loading: false,
            error: 'Failed to create campaign'
          });
          return throwError(() => error);
        }),
        finalize(() => this.updateState({ loading: false }))
      );
  }

  /**
   * Actualizar campaña
   */
  updateCampaignData(campaign: Campaign): void {
    this.campaignUpdateSubject.next(campaign);
  }

  /**
   * Eliminar campaña
   */
  deleteCampaignById(campaignId: string): void {
    this.campaignDeleteSubject.next(campaignId);
  }

  /**
   * Obtener campaña por ID
   */
  getCampaignById(id: string): Observable<Campaign | undefined> {
    return this.campaigns$.pipe(
      map(campaigns => campaigns.find(c => c.id === id))
    );
  }

  /**
   * Obtener estadísticas en tiempo real
   */
  getStats(): Observable<CampaignStats> {
    return this.campaigns$.pipe(
      map(campaigns => this.calculateStats(campaigns))
    );
  }

  /**
   * Buscar campañas similares
   */
  findSimilarCampaigns(campaign: Campaign): Observable<Campaign[]> {
    return this.campaigns$.pipe(
      map(campaigns =>
        campaigns.filter(c =>
          c.id !== campaign.id &&
          (c.type === campaign.type ||
            c.hashtags.some(tag => campaign.hashtags.includes(tag)))
        )
      )
    );
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private fetchCampaigns(): Observable<Campaign[]> {
    return this.http.get<{ campaigns: Campaign[] }>(`${environment.apiUrl}/campaigns`)
      .pipe(
        map(response => response.campaigns || []),
        retry(2)
      );
  }

  private updateCampaign(campaign: Campaign): Observable<Campaign> {
    return this.http.put<Campaign>(
      `${environment.apiUrl}/campaigns/${campaign.id}`,
      campaign
    );
  }

  private deleteCampaign(campaignId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/campaigns/${campaignId}`);
  }

  private applyFilters(campaigns: Campaign[], filters: any): Campaign[] {
    return campaigns.filter(campaign => {
      // Filtro de búsqueda
      const matchesSearch = !filters.search ||
        campaign.name.toLowerCase().includes(filters.search) ||
        campaign.description?.toLowerCase().includes(filters.search) ||
        campaign.hashtags.some(tag => tag.toLowerCase().includes(filters.search)) ||
        campaign.keywords.some(keyword => keyword.toLowerCase().includes(filters.search));

      // Filtro de estado
      const matchesStatus = filters.status === 'all' ||
        campaign.status === filters.status;

      // Filtro de tipo
      const matchesType = filters.type === 'all' ||
        campaign.type === filters.type;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  private calculateStats(campaigns: Campaign[]): CampaignStats {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'active').length;
    const completed = campaigns.filter(c => c.status === 'completed').length;
    const averageTweets = total > 0 ?
      campaigns.reduce((sum, c) => sum + (c.maxTweets || 0), 0) / total : 0;

    return { total, active, completed, averageTweets };
  }

  private refresh(): void {
    this.refreshSubject.next();
  }

  private updateState(partial: Partial<CampaignListState>): void {
    const currentState = this.stateSignal();
    this.stateSignal.set({ ...currentState, ...partial });
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    this.searchSubject.complete();
    this.statusFilterSubject.complete();
    this.typeFilterSubject.complete();
    this.refreshSubject.complete();
    this.campaignUpdateSubject.complete();
    this.campaignDeleteSubject.complete();
  }
}
