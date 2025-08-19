/**
 * ===== OPTIMIZED PENDING TWEET SERVICE =====
 * Integrado con DataManagerService para evitar duplicación
 */

import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DataManagerService } from '../../../core/services/data-manager.service';

export interface PendingTweetData {
  count: number;
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class PendingTweetService {
  private readonly dataManager = inject(DataManagerService);

  // ===== ESTADO OPTIMIZADO =====
  
  // Computed desde DataManagerService (evita duplicación)
  public readonly pendingCount = computed(() => this.dataManager.pendingTweetsCount());
  public readonly isLoading = computed(() => this.dataManager.isLoading());
  public readonly error = computed(() => this.dataManager.error());
  public readonly isOnline = computed(() => this.dataManager.isOnline());
  public readonly lastUpdated = signal<Date>(new Date());

  // Computed final para el widget
  public readonly pendingTweetData = computed(() => ({
    count: this.pendingCount(),
    lastUpdated: this.lastUpdated(),
    isLoading: this.isLoading(),
    error: this.error()
  }));

  // ===== MÉTODOS PÚBLICOS OPTIMIZADOS =====

  /**
   * Cargar tweets pendientes (delegado al DataManager)
   */
  public loadPending(): void {
    this.lastUpdated.set(new Date());
    this.dataManager.refresh();
  }

  /**
   * Stream reactivo optimizado
   */
  public getPendingTweetsStream(): Observable<PendingTweetData> {
    return of(this.pendingTweetData());
  }

  /**
   * Proceso de tweets pendientes (simulado para demo)
   */
  public processPendingTweets(): Observable<boolean> {
    // Simular procesamiento
    this.dataManager.pendingTweetsCount.set(
      Math.max(0, this.pendingCount() - Math.floor(Math.random() * 10) - 5)
    );
    
    this.lastUpdated.set(new Date());
    return of(true);
  }

  /**
   * Obtener información del estado actual
   */
  public getStatusInfo(): string {
    if (!this.isOnline()) {
      return '📴 Modo offline - Datos simulados';
    }
    
    if (this.isLoading()) {
      return '⏳ Cargando...';
    }
    
    if (this.error()) {
      return '❌ Error al cargar datos';
    }
    
    return `✅ ${this.pendingCount()} tweets pendientes`;
  }

  /**
   * Refresh data from DataManager
   */
  public refresh(): void {
    this.dataManager.refresh();
  }

  /**
   * Check if real-time updates are enabled
   */
  public isRealTimeEnabled(): boolean {
    // Check from environment or DataManager settings
    return this.dataManager.isOnline(); // Simple implementation
  }
}
