import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { concatMap, switchMap, tap } from 'rxjs/operators';

export interface ThrottledRequest<T> {
  id: string;
  request: Observable<T>;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequestThrottleService {
  private readonly requestQueue = new BehaviorSubject<ThrottledRequest<any>[]>([]);
  private readonly isProcessing = new BehaviorSubject<boolean>(false);
  private readonly minRequestInterval = 1000; // 1 segundo entre peticiones
  private lastRequestTime = 0;

  constructor() {
    // Procesar queue automáticamente
    this.requestQueue.pipe(
      concatMap(queue => {
        if (queue.length > 0 && !this.isProcessing.value) {
          return this.processQueue();
        }
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Añadir una petición a la cola con throttling
   */
  public enqueueRequest<T>(
    id: string,
    request: Observable<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Observable<T> {
    const throttledRequest: ThrottledRequest<T> = {
      id,
      request,
      priority,
      timestamp: Date.now()
    };

    // Añadir a la cola
    const currentQueue = this.requestQueue.value;
    const newQueue = [...currentQueue, throttledRequest].sort(this.sortByPriority);
    this.requestQueue.next(newQueue);

    // Devolver la petición original pero throttled
    return request.pipe(
      switchMap(result => timer(this.calculateDelay()).pipe(
        switchMap(() => of(result))
      ))
    );
  }

  /**
   * Verificar si podemos hacer una petición ahora
   */
  public canMakeRequest(): boolean {
    const now = Date.now();
    return (now - this.lastRequestTime) >= this.minRequestInterval;
  }

  /**
   * Obtener estadísticas de la cola
   */
  public getQueueStats(): { queueLength: number; isProcessing: boolean; lastRequestTime: number } {
    return {
      queueLength: this.requestQueue.value.length,
      isProcessing: this.isProcessing.value,
      lastRequestTime: this.lastRequestTime
    };
  }

  private processQueue(): Observable<any> {
    if (this.isProcessing.value) {
      return of(null);
    }

    this.isProcessing.next(true);
    const queue = this.requestQueue.value;

    if (queue.length === 0) {
      this.isProcessing.next(false);
      return of(null);
    }

    // Obtener siguiente petición de alta prioridad
    const nextRequest = queue[0];
    const remainingQueue = queue.slice(1);

    // Actualizar cola
    this.requestQueue.next(remainingQueue);

    // Calcular delay necesario
    const delay = this.calculateDelay();

    console.log(`🚦 Processing request ${nextRequest.id} with ${delay}ms delay. Queue remaining: ${remainingQueue.length}`);

    return of(null).pipe(
      switchMap(() => timer(delay)),
      tap(() => {
        this.lastRequestTime = Date.now();
        this.isProcessing.next(false);
      })
    );
  }

  private calculateDelay(): number {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      return this.minRequestInterval - timeSinceLastRequest;
    }

    return 0;
  }

  private sortByPriority(a: ThrottledRequest<any>, b: ThrottledRequest<any>): number {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

    if (priorityDiff === 0) {
      // Si misma prioridad, ordenar por timestamp (FIFO)
      return a.timestamp - b.timestamp;
    }

    return priorityDiff;
  }
}
