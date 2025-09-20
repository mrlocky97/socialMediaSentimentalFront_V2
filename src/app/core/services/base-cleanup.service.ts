/**
 * BASE CLEANUP SERVICE
 * Servicio base reutilizable que proporciona cleanup automático
 * Extiende este servicio para servicios que necesiten gestión de suscripciones
 */

import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable()
export abstract class BaseCleanupService {
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly destroy$ = new Subject<void>();
  private readonly subscriptions = new Map<string, Subscription>();

  constructor() {
    // Cleanup automático cuando el servicio se destruye
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Añade takeUntilDestroyed automáticamente a un observable
   * Usa esto para suscripciones en servicios
   */
  protected autoCleanup<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(takeUntilDestroyed(this.destroyRef));
  }

  /**
   * Añade takeUntil(destroy$) automáticamente a un observable
   * Alternativa para casos donde takeUntilDestroyed no funciona
   */
  protected manualCleanup<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(takeUntil(this.destroy$));
  }

  /**
   * Gestiona una suscripción con un ID único
   * La suscripción se cleanup automáticamente
   */
  protected addSubscription(id: string, subscription: Subscription): void {
    // Cleanup suscripción anterior con el mismo ID
    this.removeSubscription(id);
    
    // Añadir nueva suscripción
    this.subscriptions.set(id, subscription);
  }

  /**
   * Remueve una suscripción específica
   */
  protected removeSubscription(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(id);
    }
  }

  /**
   * Cleanup manual de todas las suscripciones
   */
  protected cleanup(): void {
    // Cleanup del Subject
    this.destroy$.next();
    this.destroy$.complete();

    // Cleanup de suscripciones manuales
    this.subscriptions.forEach((subscription, id) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    // Log para debugging
    if (this.subscriptions.size > 0) {
      console.warn(`${this.constructor.name}: ${this.subscriptions.size} subscriptions cleaned up`);
    }
  }

  /**
   * Obtiene el estado de las suscripciones (para debugging)
   */
  protected getSubscriptionStatus(): {
    total: number;
    active: number;
    ids: string[];
  } {
    const activeSubscriptions = Array.from(this.subscriptions.entries())
      .filter(([_, sub]) => !sub.closed);

    return {
      total: this.subscriptions.size,
      active: activeSubscriptions.length,
      ids: Array.from(this.subscriptions.keys())
    };
  }
}

/**
 * MIXIN para componentes que necesiten cleanup
 * Úsalo cuando no puedas extender BaseCleanupService
 */
export function withCleanup() {
  return function<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      protected readonly destroyRef = inject(DestroyRef);
      protected readonly destroy$ = new Subject<void>();
      private readonly subscriptions = new Map<string, Subscription>();

      constructor(...args: any[]) {
        super(...args);
        
        this.destroyRef.onDestroy(() => {
          this.cleanup();
        });
      }

      protected autoCleanup<T>(observable: Observable<T>): Observable<T> {
        return observable.pipe(takeUntilDestroyed(this.destroyRef));
      }

      protected manualCleanup<T>(observable: Observable<T>): Observable<T> {
        return observable.pipe(takeUntil(this.destroy$));
      }

      protected addSubscription(id: string, subscription: Subscription): void {
        const existing = this.subscriptions.get(id);
        if (existing) {
          existing.unsubscribe();
        }
        this.subscriptions.set(id, subscription);
      }

      protected removeSubscription(id: string): void {
        const subscription = this.subscriptions.get(id);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(id);
        }
      }

      private cleanup(): void {
        this.destroy$.next();
        this.destroy$.complete();

        this.subscriptions.forEach((subscription) => {
          subscription.unsubscribe();
        });
        this.subscriptions.clear();
      }
    };
  };
}

/**
 * UTILITY FUNCTIONS para cleanup
 */

/**
 * Crea un observable con cleanup automático usando DestroyRef
 */
export function createAutoCleanupObservable<T>(
  observable: Observable<T>,
  destroyRef: DestroyRef
): Observable<T> {
  return observable.pipe(takeUntilDestroyed(destroyRef));
}

/**
 * Crea un timer con cleanup automático
 */
export function createAutoCleanupTimer(
  callback: () => void,
  delay: number,
  destroyRef: DestroyRef
): void {
  const timeoutId = setTimeout(callback, delay);
  
  destroyRef.onDestroy(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Crea un interval con cleanup automático
 */
export function createAutoCleanupInterval(
  callback: () => void,
  interval: number,
  destroyRef: DestroyRef
): void {
  const intervalId = setInterval(callback, interval);
  
  destroyRef.onDestroy(() => {
    clearInterval(intervalId);
  });
}