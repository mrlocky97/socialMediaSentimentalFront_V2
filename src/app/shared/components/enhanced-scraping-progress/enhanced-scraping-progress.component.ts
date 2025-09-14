import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { ScrapingProgress, ScrapingService } from '../../../core/services/scraping.service';

@Component({
  selector: 'app-enhanced-scraping-progress',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="enhanced-progress-container" *ngIf="progress">
      <!-- Status Header -->
      <div class="progress-header">
        <div class="status-info">
          <mat-icon [class]="getStatusIconClass()">{{ getStatusIcon() }}</mat-icon>
          <span class="status-text">{{ getStatusText() }}</span>
          
          @if (progress.status === 'retrying') {
            <mat-chip color="warn" class="retry-chip">
              <mat-icon>refresh</mat-icon>
              Reintentando...
            </mat-chip>
          }
          
          @if (progress.isLargeRequest) {
            <mat-chip color="primary" class="large-request-chip">
              <mat-icon>data_usage</mat-icon>
              Solicitud Grande
            </mat-chip>
          }
          
          @if (progress.backgroundMode) {
            <mat-chip color="accent" class="background-chip">
              <mat-icon>cloud_queue</mat-icon>
              Background
            </mat-chip>
          }
        </div>
        
        <div class="progress-actions">
          @if (progress.status === 'running' && !progress.backgroundMode) {
            <button mat-icon-button 
                    (click)="enableBackgroundMode()"
                    matTooltip="Continuar en background">
              <mat-icon>cloud_queue</mat-icon>
            </button>
          }
          
          @if (progress.backgroundMode) {
            <button mat-icon-button 
                    (click)="disableBackgroundMode()"
                    matTooltip="Volver a primer plano">
              <mat-icon>visibility</mat-icon>
            </button>
          }
          
          @if (progress.status === 'running') {
            <button mat-icon-button 
                    color="warn"
                    (click)="cancelScraping()"
                    matTooltip="Cancelar scraping">
              <mat-icon>stop</mat-icon>
            </button>
          }
        </div>
      </div>
      
      <!-- Current Message -->
      @if (progress.currentMessage) {
        <div class="current-message">
          {{ progress.currentMessage }}
        </div>
      }
      
      <!-- Overall Progress -->
      <div class="overall-progress">
        <div class="progress-info">
          <span class="progress-label">Progreso Total</span>
          <span class="progress-percentage">{{ progress.progress }}%</span>
          @if (progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0) {
            <span class="eta">{{ getFormattedETA() }}</span>
          }
        </div>
        <mat-progress-bar 
          mode="determinate" 
          [value]="progress.progress"
          [class]="getProgressBarClass()">
        </mat-progress-bar>
      </div>
      
      <!-- Detailed Progress Sections -->
      <div class="detailed-progress">
        <!-- Hashtags Progress -->
        @if (progress.hashtags.total > 0) {
          <div class="section-progress">
            <div class="section-header">
              <mat-icon>tag</mat-icon>
              <span>Hashtags</span>
              <span class="section-status">{{ progress.hashtags.completed }}/{{ progress.hashtags.total }}</span>
              @if (progress.hashtags.inProgress) {
                <mat-icon class="spinning">refresh</mat-icon>
              }
            </div>
            
            @if (progress.hashtags.chunkProgress?.isChunked) {
              <div class="chunk-info">
                Chunk {{ progress.hashtags.chunkProgress?.current }} de {{ progress.hashtags.chunkProgress?.total }}
              </div>
            }
            
            <mat-progress-bar 
              mode="determinate" 
              [value]="getSectionProgress(progress.hashtags)"
              color="primary">
            </mat-progress-bar>
          </div>
        }
        
        <!-- Search/Keywords Progress -->
        @if (progress.search.total > 0) {
          <div class="section-progress">
            <div class="section-header">
              <mat-icon>search</mat-icon>
              <span>Keywords</span>
              <span class="section-status">{{ progress.search.completed }}/{{ progress.search.total }}</span>
              @if (progress.search.inProgress) {
                <mat-icon class="spinning">refresh</mat-icon>
              }
            </div>
            
            @if (progress.search.chunkProgress?.isChunked) {
              <div class="chunk-info">
                Chunk {{ progress.search.chunkProgress?.current }} de {{ progress.search.chunkProgress?.total }}
              </div>
            }
            
            <mat-progress-bar 
              mode="determinate" 
              [value]="getSectionProgress(progress.search)"
              color="accent">
            </mat-progress-bar>
          </div>
        }
        
        <!-- Users Progress -->
        @if (progress.users.total > 0) {
          <div class="section-progress">
            <div class="section-header">
              <mat-icon>person</mat-icon>
              <span>Usuarios</span>
              <span class="section-status">{{ progress.users.completed }}/{{ progress.users.total }}</span>
              @if (progress.users.inProgress) {
                <mat-icon class="spinning">refresh</mat-icon>
              }
            </div>
            
            @if (progress.users.chunkProgress?.isChunked) {
              <div class="chunk-info">
                Chunk {{ progress.users.chunkProgress?.current }} de {{ progress.users.chunkProgress?.total }}
              </div>
            }
            
            <mat-progress-bar 
              mode="determinate" 
              [value]="getSectionProgress(progress.users)"
              color="warn">
            </mat-progress-bar>
          </div>
        }
      </div>
      
      <!-- Metrics -->
      <div class="metrics-section">
        <div class="metric-item">
          <mat-icon>download</mat-icon>
          <span class="metric-label">Scraped</span>
          <span class="metric-value">{{ progress.metrics.totalScraped }}</span>
        </div>
        
        <div class="metric-item">
          <mat-icon>save</mat-icon>
          <span class="metric-label">Saved</span>
          <span class="metric-value">{{ progress.metrics.saved }}</span>
        </div>
        
        <div class="metric-item">
          <mat-icon>error_outline</mat-icon>
          <span class="metric-label">Errors</span>
          <span class="metric-value">{{ progress.metrics.errors }}</span>
        </div>
        
        @if (progress.metrics.retryAttempts > 0) {
          <div class="metric-item">
            <mat-icon>refresh</mat-icon>
            <span class="metric-label">Retries</span>
            <span class="metric-value">{{ progress.metrics.retryAttempts }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./enhanced-scraping-progress.component.css']
})
export class EnhancedScrapingProgressComponent implements OnInit, OnDestroy {
  @Input() showActions = true;
  
  progress: ScrapingProgress | null = null;
  private subscription?: Subscription;

  constructor(private scrapingService: ScrapingService) {}

  ngOnInit(): void {
    this.subscription = this.scrapingService.scrapingProgress$.subscribe(
      progress => this.progress = progress
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getStatusIcon(): string {
    if (!this.progress) return 'help';
    
    switch (this.progress.status) {
      case 'idle': return 'pause_circle';
      case 'running': return 'play_circle';
      case 'completed': return 'check_circle';
      case 'error': return 'error';
      case 'retrying': return 'refresh';
      default: return 'help';
    }
  }

  getStatusIconClass(): string {
    if (!this.progress) return '';
    
    switch (this.progress.status) {
      case 'running': return 'status-running';
      case 'completed': return 'status-completed';
      case 'error': return 'status-error';
      case 'retrying': return 'status-retrying';
      default: return '';
    }
  }

  getStatusText(): string {
    if (!this.progress) return 'Desconocido';
    
    switch (this.progress.status) {
      case 'idle': return 'Inactivo';
      case 'running': return 'Ejecutándose';
      case 'completed': return 'Completado';
      case 'error': return 'Error';
      case 'retrying': return 'Reintentando';
      default: return 'Desconocido';
    }
  }

  getProgressBarClass(): string {
    if (!this.progress) return '';
    
    switch (this.progress.status) {
      case 'error': return 'progress-error';
      case 'retrying': return 'progress-retrying';
      case 'completed': return 'progress-completed';
      default: return '';
    }
  }

  getSectionProgress(section: any): number {
    if (section.total === 0) return 0;
    return (section.completed / section.total) * 100;
  }

  getFormattedETA(): string {
    return this.scrapingService.getFormattedETA();
  }

  enableBackgroundMode(): void {
    this.scrapingService.enableBackgroundMode();
  }

  disableBackgroundMode(): void {
    this.scrapingService.disableBackgroundMode();
  }

  cancelScraping(): void {
    this.scrapingService.cancelScraping();
  }
}