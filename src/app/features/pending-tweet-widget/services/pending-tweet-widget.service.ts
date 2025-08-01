import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { 
  Observable, 
  BehaviorSubject, 
  timer, 
  of,
  EMPTY
} from 'rxjs';
import {
  switchMap,
  map,
  catchError,
  tap,
  startWith,
  share,
  retry,
  debounceTime,
  distinctUntilChanged
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

  // Real-time polling for pending tweets (every 30 seconds)
  readonly pendingTweets$ = this.realTimeToggleSubject.pipe(
    switchMap(isEnabled => 
      isEnabled 
        ? timer(0, 30000).pipe( // Poll every 30 seconds
            switchMap(() => this.fetchPendingTweets()),
            retry({ count: 3, delay: 5000 }) // Retry up to 3 times with 5s delay
          )
        : EMPTY
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

  // Combined data stream
  readonly data$ = this.pendingTweets$.pipe(
    startWith(null), // Start with null
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
    // Initialize real-time updates
    this.initializeRealTimeUpdates();
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

    return this.http.get<any[]>(`${environment.apiUrl}/tweets/unprocessed`).pipe(
      map(tweets => ({
        count: Array.isArray(tweets) ? tweets.length : 0,
        lastUpdated: new Date(),
        tweets: tweets || []
      } as PendingTweetData)),
      tap(() => this.loading.set(false)),
      catchError(error => {
        console.error('Error fetching pending tweets:', error);
        this.loading.set(false);
        throw error;
      })
    );
  }
}
