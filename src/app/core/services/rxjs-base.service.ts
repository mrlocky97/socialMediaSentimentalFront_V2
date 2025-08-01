/**
 * Servicio Base RxJS - Patrones y Mejores Prácticas
 * Implementa los principales patterns de RxJS para la aplicación
 */
import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { 
  Observable, 
  Subject, 
  BehaviorSubject, 
  ReplaySubject,
  combineLatest,
  merge,
  timer,
  interval,
  fromEvent,
  of,
  throwError,
  EMPTY
} from 'rxjs';
import {
  map,
  filter,
  switchMap,
  mergeMap,
  concatMap,
  exhaustMap,
  debounceTime,
  distinctUntilChanged,
  startWith,
  shareReplay,
  catchError,
  retry,
  retryWhen,
  delay,
  take,
  takeUntil,
  tap,
  finalize,
  scan,
  reduce,
  withLatestFrom,
  pairwise,
  throttleTime
} from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: Date;
}

export interface StreamState<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class RxjsBaseService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // 1. SUBJECTS PATTERN EXAMPLES
  // ================================

  // Simple Subject para eventos
  private eventSubject = new Subject<string>();
  public event$ = this.eventSubject.asObservable();

  // BehaviorSubject para estado actual
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // ReplaySubject para mantener histórico
  private historySubject = new ReplaySubject<any>(5); // Últimos 5 eventos
  public history$ = this.historySubject.asObservable();

  // ================================
  // 2. STATE MANAGEMENT PATTERN
  // ================================

  // Estado reactivo usando signals + RxJS
  private stateSignal = signal<StreamState<any>>({
    loading: false,
    data: null,
    error: null,
    lastUpdated: null
  });

  // Computed basado en el estado
  readonly isLoading = computed(() => this.stateSignal().loading);
  readonly hasError = computed(() => !!this.stateSignal().error);
  readonly hasData = computed(() => !!this.stateSignal().data);

  // Stream del estado completo
  readonly state$ = new BehaviorSubject(this.stateSignal());

  // ================================
  // 3. HTTP + RXJS PATTERNS
  // ================================

  /**
   * GET con retry automático y cache
   */
  getData<T>(endpoint: string): Observable<T> {
    this.setLoading(true);
    
    return this.http.get<ApiResponse<T>>(`${environment.apiUrl}/${endpoint}`)
      .pipe(
        // Retry automático con delay incremental
        retryWhen(errors =>
          errors.pipe(
            scan((retryCount, error) => {
              if (retryCount >= 3) {
                throw error;
              }
              return retryCount + 1;
            }, 0),
            delay(1000)
          )
        ),
        
        // Extraer solo los datos
        map(response => response.data),
        
        // Cache la respuesta
        shareReplay(1),
        
        // Manejo de errores
        catchError(error => {
          this.handleError('getData', error);
          return throwError(() => error);
        }),
        
        // Cleanup
        finalize(() => this.setLoading(false)),
        
        // Auto-destroy con el componente
        takeUntilDestroyed(this.destroyRef)
      );
  }

  /**
   * POST con optimistic updates
   */
  postData<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    this.updateState({ data, lastUpdated: new Date() }); // Optimistic update
    
    return this.http.post<ApiResponse<T>>(`${environment.apiUrl}/${endpoint}`, data)
      .pipe(
        map(response => response.data),
        tap(result => {
          // Update con resultado real
          this.updateState({ 
            data: result, 
            error: null, 
            lastUpdated: new Date() 
          });
          this.historySubject.next({ action: 'POST', endpoint, result });
        }),
        catchError(error => {
          // Revertir optimistic update
          this.updateState({ 
            data: null, 
            error: error.message 
          });
          return throwError(() => error);
        }),
        finalize(() => this.setLoading(false)),
        takeUntilDestroyed(this.destroyRef)
      );
  }

  // ================================
  // 4. SEARCH WITH DEBOUNCE PATTERN
  // ================================

  private searchSubject = new Subject<string>();
  
  readonly searchResults$ = this.searchSubject.pipe(
    // Eliminar espacios y convertir a lowercase
    map(term => term.trim().toLowerCase()),
    
    // Solo buscar si hay al menos 2 caracteres
    filter(term => term.length >= 2),
    
    // Evitar búsquedas duplicadas consecutivas
    distinctUntilChanged(),
    
    // Debounce para evitar muchas peticiones
    debounceTime(300),
    
    // Cancelar búsqueda anterior si hay una nueva
    switchMap(term => 
      this.getData<any[]>(`search?q=${term}`).pipe(
        startWith([]), // Valor inicial
        catchError(() => of([])) // Array vacío en caso de error
      )
    ),
    
    // Cache los resultados
    shareReplay(1)
  );

  search(term: string): void {
    this.searchSubject.next(term);
  }

  // ================================
  // 5. REAL-TIME UPDATES PATTERN
  // ================================

  /**
   * Polling para updates en tiempo real
   */
  startRealTimeUpdates(endpoint: string, intervalMs: number = 5000): Observable<any> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.getData(endpoint)),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(curr)
      ),
      tap(data => {
        this.updateState({ data, lastUpdated: new Date() });
        this.eventSubject.next('real-time-update');
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  // ================================
  // 6. FORM VALIDATION PATTERN
  // ================================

  /**
   * Validación async para formularios
   */
  validateAsync(value: string, validationEndpoint: string): Observable<boolean> {
    if (!value) return of(false);
    
    return timer(500).pipe( // Debounce integrado
      switchMap(() => 
        this.http.get<{valid: boolean}>(`${environment.apiUrl}/${validationEndpoint}?value=${value}`)
      ),
      map(response => response.valid),
      catchError(() => of(false))
    );
  }

  // ================================
  // 7. COMBINE MULTIPLE STREAMS
  // ================================

  /**
   * Combinar múltiples streams de datos
   */
  getCombinedData(): Observable<{users: any[], campaigns: any[], stats: any}> {
    const users$ = this.getData<any[]>('users');
    const campaigns$ = this.getData<any[]>('campaigns');
    const stats$ = this.getData<any>('stats');

    return combineLatest([users$, campaigns$, stats$]).pipe(
      map(([users, campaigns, stats]) => ({
        users,
        campaigns, 
        stats
      })),
      shareReplay(1)
    );
  }

  // ================================
  // 8. ERROR HANDLING PATTERNS
  // ================================

  private handleError(operation: string, error: any): void {
    console.error(`${operation} failed:`, error);
    
    this.updateState({ 
      error: error.message || 'An error occurred',
      loading: false 
    });
    
    // Emitir evento de error
    this.eventSubject.next(`error:${operation}`);
  }

  // ================================
  // 9. UTILITY METHODS
  // ================================

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
    this.updateState({ loading });
  }

  private updateState(partial: Partial<StreamState<any>>): void {
    const currentState = this.stateSignal();
    const newState = { ...currentState, ...partial };
    this.stateSignal.set(newState);
    this.state$.next(newState);
  }

  /**
   * Limpiar todos los subscriptions y resetear estado
   */
  reset(): void {
    this.stateSignal.set({
      loading: false,
      data: null,
      error: null,
      lastUpdated: null
    });
    
    this.loadingSubject.next(false);
    this.eventSubject.next('reset');
  }

  /**
   * Obtener el estado actual sin subscription
   */
  getCurrentState(): StreamState<any> {
    return this.stateSignal();
  }
}
