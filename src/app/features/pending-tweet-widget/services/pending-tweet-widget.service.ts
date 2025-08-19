import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  of
} from 'rxjs';
import {
  catchError,
  debounceTime,
  map,
  share,
  switchMap,
  tap
} from 'rxjs/operators';
import { environment } from '../../../../enviroments/environment';

export interface PendingTweetData {
  count: number;
  lastUpdated: Date;
  tweets: any[];
}

@Injectable({ providedIn: 'root' })
export class PendingTweetService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // REACTIVE STATE WITH SIGNALS
  // ================================

  pending = signal<number | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  lastUpdated = signal<Date | null>(null);
  isRealTimeEnabled = signal<boolean>(true);

  // ================================
  // RXJS SUBJECTS FOR REACTIVE FLOWS
  // ================================

  private readonly refreshSubject = new BehaviorSubject<void>(undefined);
  private readonly realTimeToggleSubject = new BehaviorSubject<boolean>(true);

  // ================================
  // REACTIVE STREAMS
  // ================================

  // Real-time polling DESACTIVADO para evitar saturación del backend
  readonly pendingTweets$ = this.realTimeToggleSubject.pipe(
    switchMap(isEnabled =>
      // DESACTIVADO: No hacer polling automático
      EMPTY
    ),
    share() // Share the subscription among multiple subscribers
  );

  // Manual refresh stream
  readonly manualRefresh$ = this.refreshSubject.pipe(
    debounceTime(500), // Prevent spam clicking
    switchMap(() => this.fetchPendingTweets()),
    catchError(error => {
      console.error('Manual refresh failed:', error);
      return of(null);
    })
  );

  // Combined data stream - SOLO MANUAL, sin polling automático
  readonly data$ = this.manualRefresh$.pipe(
    // REMOVIDO: startWith(null) para evitar peticiones automáticas al inicializar
    tap(data => {
      if (data) {
        this.pending.set(data.count);
        this.lastUpdated.set(data.lastUpdated);
        this.error.set(null);
      }
      this.loading.set(false);
    }),
    catchError(error => {
      this.error.set('Error al cargar los tweets pendientes');
      this.loading.set(false);
      this.pending.set(null);
      return of(null);
    })
  );

  constructor() {
    // DESACTIVADO: No inicializar actualizaciones automáticas para evitar peticiones inmediatas
    console.log('  PendingTweetService initialized WITHOUT automatic updates');
  }

  // ================================
  // PUBLIC METHODS
  // ================================

  /**
   * Carga la cantidad de tweets pendientes de procesar manualmente.
   */
  loadPending(): void {
    this.loading.set(true);
    this.refreshSubject.next();
  }

  /**
   * Habilita o deshabilita las actualizaciones en tiempo real.
   */
  toggleRealTimeUpdates(enabled: boolean): void {
    this.isRealTimeEnabled.set(enabled);
    this.realTimeToggleSubject.next(enabled);
  }

  /**
   * Obtiene los datos de tweets pendientes de forma reactiva.
   */
  getPendingTweetsStream(): Observable<PendingTweetData | null> {
    return this.data$;
  }

  /**
   * Fuerza una actualización inmediata.
   */
  forceRefresh(): void {
    this.loading.set(true);
    this.refreshSubject.next();
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private initializeRealTimeUpdates(): void {
    // Subscribe to the combined data stream
    this.data$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Subscribe to manual refresh
    this.manualRefresh$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => {
      if (data) {
        this.pending.set(data.count);
        this.lastUpdated.set(data.lastUpdated);
        this.error.set(null);
      }
      this.loading.set(false);
    });
  }

  private fetchPendingTweets(): Observable<PendingTweetData> {
    this.loading.set(true);
    this.error.set(null);

    // Check if backend is available
    return this.http.get<any[]>(`${environment.apiUrl}/tweets/unprocessed`).pipe(
      map(tweets => ({
        count: Array.isArray(tweets) ? tweets.length : 0,
        lastUpdated: new Date(),
        tweets: tweets || []
      } as PendingTweetData)),
      tap(() => this.loading.set(false)),
      catchError(error => {
        console.warn('Backend not available, using mock data:', error);
        this.loading.set(false);

        // Return mock data when backend is not available
        return of({
          count: Math.floor(Math.random() * 50) + 10,
          lastUpdated: new Date(),
          tweets: this.generateMockTweets()
        } as PendingTweetData);
      })
    );
  }

  private generateMockTweets(): any[] {
    const mockTweets = [
      { id: 1, text: 'Great product! #satisfied', sentiment: 'positive', platform: 'twitter' },
      { id: 2, text: 'Not happy with the service', sentiment: 'negative', platform: 'twitter' },
      { id: 3, text: 'Average experience', sentiment: 'neutral', platform: 'facebook' },
      { id: 4, text: 'Amazing quality!', sentiment: 'positive', platform: 'instagram' },
      { id: 5, text: 'Could be better', sentiment: 'negative', platform: 'linkedin' }
    ];

    const count = Math.floor(Math.random() * 30) + 5;
    return Array.from({ length: count }, (_, i) => ({
      ...mockTweets[i % mockTweets.length],
      id: i + 1,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    }));
  }
}
