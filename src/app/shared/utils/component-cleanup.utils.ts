/**
 * COMPONENT CLEANUP HELPERS
 * Utilidades para ayudar a los componentes existentes a implementar cleanup
 * sin duplicar código ni romper las implementaciones existentes
 */

import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * HELPER para componentes que usan dialogs de Material
 * Aplica cleanup automático a dialogs existentes
 */
export function setupDialogCleanup<T = any>(
  dialogRef: MatDialogRef<T>,
  destroyRef: DestroyRef
): Observable<T> {
  return dialogRef.afterClosed().pipe(takeUntilDestroyed(destroyRef));
}

/**
 * HELPER para mejorar componentes existentes que ya usan takeUntil
 * Verifica que el destroy$ se complete correctamente
 */
export function ensureDestroySubject(destroy$: Subject<void>, destroyRef: DestroyRef): void {
  destroyRef.onDestroy(() => {
    if (!destroy$.closed) {
      destroy$.next();
      destroy$.complete();
    }
  });
}

/**
 * HELPER para añadir cleanup a timers existentes
 */
export function createManagedTimer(
  callback: () => void,
  delay: number,
  destroyRef: DestroyRef
): void {
  const timerId = setTimeout(callback, delay);
  destroyRef.onDestroy(() => clearTimeout(timerId));
}

/**
 * HELPER para añadir cleanup a intervals existentes
 */
export function createManagedInterval(
  callback: () => void,
  interval: number,
  destroyRef: DestroyRef
): void {
  const intervalId = setInterval(callback, interval);
  destroyRef.onDestroy(() => clearInterval(intervalId));
}

/**
 * HELPER para gestionar múltiples suscripciones de un componente
 */
export class ComponentSubscriptionManager {
  private subscriptions = new Map<string, Subscription>();
  private destroy$ = new Subject<void>();

  constructor(private destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => this.cleanup());
  }

  /**
   * Añade una suscripción con ID único
   */
  add(id: string, subscription: Subscription): void {
    this.remove(id); // Limpia anterior si existe
    this.subscriptions.set(id, subscription);
  }

  /**
   * Remueve una suscripción específica
   */
  remove(id: string): void {
    const sub = this.subscriptions.get(id);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(id);
    }
  }

  /**
   * Obtiene un observable con cleanup automático
   */
  managed<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(takeUntilDestroyed(this.destroyRef));
  }

  /**
   * Obtiene el destroy$ para casos especiales
   */
  getDestroy$(): Observable<void> {
    return this.destroy$.asObservable();
  }

  /**
   * Cleanup de todas las suscripciones
   */
  private cleanup(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    
    if (!this.destroy$.closed) {
      this.destroy$.next();
      this.destroy$.complete();
    }
  }

  /**
   * Debug: obtiene estado de suscripciones
   */
  getStatus(): { total: number; active: number; ids: string[] } {
    const active = Array.from(this.subscriptions.values()).filter(s => !s.closed);
    return {
      total: this.subscriptions.size,
      active: active.length,
      ids: Array.from(this.subscriptions.keys())
    };
  }
}

/**
 * FACTORY para crear ComponentSubscriptionManager
 */
export function createSubscriptionManager(destroyRef: DestroyRef): ComponentSubscriptionManager {
  return new ComponentSubscriptionManager(destroyRef);
}

/**
 * HELPER para migrar componentes OnDestroy existentes a DestroyRef
 */
export function migrateToDestroyRef(component: { ngOnDestroy?(): void }): DestroyRef {
  const destroyRef = inject(DestroyRef);
  
  // Si el componente ya tiene ngOnDestroy, preservarlo
  if (component.ngOnDestroy) {
    const originalDestroy = component.ngOnDestroy.bind(component);
    destroyRef.onDestroy(originalDestroy);
  }
  
  return destroyRef;
}