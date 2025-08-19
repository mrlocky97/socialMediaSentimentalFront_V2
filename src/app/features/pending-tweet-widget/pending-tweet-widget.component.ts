/**
 * ===== OPTIMIZED PENDING TWEET WIDGET =====
 * Simplificado para usar DataManagerService unified
 */

import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoModule } from '@ngneat/transloco';
import { PendingTweetService } from './services/pending-tweet-widget.service';

@Component({
  selector: 'app-pending-tweet-widget',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './pending-tweet-widget.component.html',
  styleUrls: ['./pending-tweet-widget.component.css']
})
export class PendingTweetWidgetComponent implements OnInit {
  private readonly pendingTweetService = inject(PendingTweetService);
  private readonly snackBar = inject(MatSnackBar);

  // ===== COMPUTED STATE (optimized) =====
  
  public readonly pendingCount = this.pendingTweetService.pendingCount;
  public readonly isLoading = this.pendingTweetService.isLoading;
  public readonly error = this.pendingTweetService.error;
  public readonly isOnline = this.pendingTweetService.isOnline;
  
  // Status indicators
  public readonly statusMessage = computed(() => this.pendingTweetService.getStatusInfo());
  
  public readonly statusColor = computed(() => {
    if (!this.isOnline()) return 'warn';
    if (this.error()) return 'warn';
    return 'primary';
  });

  public readonly statusIcon = computed(() => {
    if (!this.isOnline()) return 'cloud_off';
    if (this.isLoading()) return 'refresh';
    if (this.error()) return 'error';
    return 'pending_actions';
  });

  public readonly urgencyLevel = computed(() => {
    const count = this.pendingCount();
    if (count > 50) return 'high';
    if (count > 20) return 'medium';
    return 'low';
  });

  ngOnInit(): void {
    // Cargar datos iniciales
    this.pendingTweetService.loadPending();
  }

  // ===== PUBLIC METHODS =====

  /**
   * Refrescar datos manualmente
   */
  public refreshData(): void {
    this.pendingTweetService.loadPending();
  }

  /**
   * Forzar actualización completa
   */
  public async onForceRefresh(): Promise<void> {
    // Use service refresh method
    this.pendingTweetService.refresh();
    this.showSuccess('Datos actualizados');
  }

  /**
   * Alternar actualizaciones en tiempo real
   */
  public async onToggleRealTime(): Promise<void> {
    // Get current state from service
    const currentState = this.pendingTweetService.isRealTimeEnabled();
    
    // Toggle state (could be implemented in DataManager if needed)
    console.log(`Real-time updates ${!currentState ? 'enabled' : 'disabled'}`);
    
    if (currentState) {
      this.showInfo('Actualizaciones en tiempo real desactivadas');
    } else {
      this.showSuccess('Actualizaciones en tiempo real activadas');
    }
  }

  /**
   * Verificar si las actualizaciones en tiempo real están habilitadas
   */
  public isRealTimeEnabled(): boolean {
    return this.pendingTweetService.isRealTimeEnabled();
  }

  /**
   * Procesar tweets pendientes (demo)
   */
  public processPendingTweets(): void {
    this.pendingTweetService.processPendingTweets().subscribe({
      next: () => {
        console.log('✅ Tweets procesados exitosamente');
        this.showSuccess('Tweets procesados exitosamente');
      },
      error: (error) => {
        console.error('❌ Error procesando tweets:', error);
        this.showError('Error procesando tweets');
      }
    });
  }

  // ===== LEGACY COMPATIBILITY =====
  
  /**
   * Método legacy para compatibilidad
   */
  public pendingTweets(): void {
    this.refreshData();
  }

  // ===== PRIVATE METHODS =====

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
