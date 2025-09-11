/**
 * Scraping Dashboard Component
 * Real-time dashboard showing scraping metrics and system stats
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, timer } from 'rxjs';
import { AdvancedScrapingService } from '../../../core/services/advanced-scraping.service';
import { ScrapingStats, JobMetrics } from '../../../core/interfaces/advanced-scraping.interface';

interface MetricCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

@Component({
  selector: 'app-scraping-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule
],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>
            <mat-icon>dashboard</mat-icon>
            Scraping Dashboard
          </h1>
          <p>Real-time monitoring of social media data collection</p>
        </div>
        
        <div class="header-actions">
          <div class="connection-status" [class]="connectionStatus() ? 'connected' : 'disconnected'">
            <div class="status-indicator"></div>
            <span>{{ connectionStatus() ? 'Connected' : 'Disconnected' }}</span>
          </div>
          
          <button 
            mat-icon-button 
            (click)="refreshData()"
            [disabled]="isRefreshing()"
            matTooltip="Refresh data"
          >
            <mat-icon [class.spinning]="isRefreshing()">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        @for (metric of metricsCards(); track metric.title) {
          <mat-card class="metric-card" [style.border-left-color]="metric.color">
            <mat-card-content>
              <div class="metric-content">
                <div class="metric-icon" [style.color]="metric.color">
                  <mat-icon>{{ metric.icon }}</mat-icon>
                </div>
                
                <div class="metric-data">
                  <h2>{{ metric.value }}</h2>
                  <h3>{{ metric.title }}</h3>
                  
                  @if (metric.subtitle) {
                    <p class="metric-subtitle">{{ metric.subtitle }}</p>
                  }
                  
                  @if (metric.trend) {
                    <div class="metric-trend" [class]="'trend-' + metric.trend">
                      <mat-icon>{{ getTrendIcon(metric.trend) }}</mat-icon>
                      <span>{{ getTrendLabel(metric.trend) }}</span>
                    </div>
                  }
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <!-- System Stats -->
      <div class="stats-section">
        <mat-card class="system-stats-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>settings</mat-icon>
              System Performance
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="stats-grid">
              <!-- System Load -->
              <div class="stat-item">
                <div class="stat-header">
                  <span class="stat-label">System Load</span>
                  <span class="stat-value">{{ formatPercentage(systemStats().systemLoad) }}</span>
                </div>
                <mat-progress-bar 
                  [value]="systemStats().systemLoad * 100"
                  [color]="getLoadColor(systemStats().systemLoad)"
                  mode="determinate">
                </mat-progress-bar>
              </div>
              
              <!-- Average Processing Time -->
              <div class="stat-item">
                <div class="stat-header">
                  <span class="stat-label">Avg Processing Time</span>
                  <span class="stat-value">{{ formatTime(systemStats().averageProcessingTime) }}</span>
                </div>
                <div class="stat-info">
                  <mat-icon>schedule</mat-icon>
                  <span>Per batch completion</span>
                </div>
              </div>
              
              <!-- Total Tweets Collected -->
              <div class="stat-item">
                <div class="stat-header">
                  <span class="stat-label">Total Tweets</span>
                  <span class="stat-value">{{ formatNumber(systemStats().totalTweetsCollected) }}</span>
                </div>
                <div class="stat-info">
                  <mat-icon>trending_up</mat-icon>
                  <span>All time collection</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Job Distribution -->
        <mat-card class="job-distribution-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>pie_chart</mat-icon>
              Job Distribution
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="distribution-chart">
              @for (item of jobDistribution(); track item.label) {
                <div class="distribution-item">
                  <div class="distribution-bar">
                    <div 
                      class="distribution-fill" 
                      [style.width.%]="item.percentage"
                      [style.background-color]="item.color">
                    </div>
                  </div>
                  <div class="distribution-info">
                    <span class="distribution-label">{{ item.label }}</span>
                    <span class="distribution-value">{{ item.count }} ({{ item.percentage.toFixed(1) }}%)</span>
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Active Jobs Overview -->
      <mat-card class="active-jobs-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>play_arrow</mat-icon>
            Active Jobs Overview
          </mat-card-title>
          <div class="header-badge">
            {{ jobMetrics().runningJobs }} running
          </div>
        </mat-card-header>
        
        <mat-card-content>
          @if (jobMetrics().runningJobs === 0) {
            <div class="no-active-jobs">
              <mat-icon>inbox</mat-icon>
              <h3>No Active Jobs</h3>
              <p>All jobs are completed or there are no jobs running.</p>
            </div>
          } @else {
            <div class="active-jobs-summary">
              <!-- Overall Progress -->
              <div class="overall-progress">
                <div class="progress-header">
                  <span>Overall Progress</span>
                  <span>{{ jobMetrics().averageProgress.toFixed(1) }}%</span>
                </div>
                <mat-progress-bar 
                  [value]="jobMetrics().averageProgress"
                  color="primary"
                  mode="determinate">
                </mat-progress-bar>
              </div>

              <!-- Quick Stats -->
              <div class="quick-stats">
                <div class="quick-stat">
                  <mat-icon>trending_up</mat-icon>
                  <div>
                    <strong>{{ formatNumber(jobMetrics().totalTweetsCollected) }}</strong>
                    <span>Tweets Collected</span>
                  </div>
                </div>
                
                <div class="quick-stat">
                  <mat-icon>timer</mat-icon>
                  <div>
                    <strong>{{ formatTime(jobMetrics().estimatedTimeRemaining) }}</strong>
                    <span>Est. Remaining</span>
                  </div>
                </div>
                
                <div class="quick-stat">
                  <mat-icon>speed</mat-icon>
                  <div>
                    <strong>{{ getCurrentThroughput() }}</strong>
                    <span>Current Rate</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Real-time Updates -->
      @if (connectionStatus()) {
        <mat-card class="realtime-card">
          <mat-card-content>
            <div class="realtime-indicator">
              <div class="pulse-animation">
                <div class="pulse-dot"></div>
              </div>
              <div class="realtime-content">
                <h3>Real-time Updates Active</h3>
                <p>Dashboard is receiving live updates from the scraping system</p>
              </div>
              <div class="realtime-status">
                <span class="last-update">Last update: {{ formatLastUpdate() }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header-content h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .header-content p {
      margin: 0;
      color: #666;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 500;
    }

    .connection-status.connected {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .connection-status.disconnected {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .metric-card {
      border-left: 4px solid transparent;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .metric-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .metric-icon {
      padding: 16px;
      border-radius: 50%;
      background: rgba(25, 118, 210, 0.1);
    }

    .metric-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .metric-data h2 {
      margin: 0 0 4px 0;
      font-size: 32px;
      font-weight: 600;
      color: #333;
    }

    .metric-data h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #666;
      font-weight: 500;
    }

    .metric-subtitle {
      margin: 0;
      font-size: 14px;
      color: #999;
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .metric-trend mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .trend-up {
      color: #4caf50;
    }

    .trend-down {
      color: #f44336;
    }

    .trend-stable {
      color: #ff9800;
    }

    .stats-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    .stats-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .stat-item {
      padding: 16px 0;
    }

    .stat-item:not(:last-child) {
      border-bottom: 1px solid #e0e0e0;
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .stat-label {
      font-weight: 500;
      color: #666;
    }

    .stat-value {
      font-weight: 600;
      color: #333;
    }

    .stat-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 14px;
      color: #999;
    }

    .stat-info mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .distribution-chart {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .distribution-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .distribution-bar {
      flex: 1;
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .distribution-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .distribution-info {
      min-width: 120px;
      text-align: right;
    }

    .distribution-label {
      display: block;
      font-size: 14px;
      color: #666;
    }

    .distribution-value {
      display: block;
      font-size: 12px;
      color: #999;
    }

    .active-jobs-card .mat-mdc-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-badge {
      background: #1976d2;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .no-active-jobs {
      text-align: center;
      padding: 32px;
      color: #666;
    }

    .no-active-jobs mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .overall-progress {
      margin-bottom: 24px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .quick-stats {
      display: flex;
      justify-content: space-around;
      gap: 16px;
    }

    .quick-stat {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      flex: 1;
    }

    .quick-stat mat-icon {
      color: #1976d2;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .quick-stat div {
      display: flex;
      flex-direction: column;
    }

    .quick-stat strong {
      font-size: 18px;
      color: #333;
    }

    .quick-stat span {
      font-size: 12px;
      color: #666;
    }

    .realtime-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .realtime-indicator {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .pulse-animation {
      position: relative;
    }

    .pulse-dot {
      width: 16px;
      height: 16px;
      background: #4caf50;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
      }
      
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
      }
      
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
      }
    }

    .realtime-content {
      flex: 1;
    }

    .realtime-content h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
    }

    .realtime-content p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .realtime-status {
      text-align: right;
    }

    .last-update {
      font-size: 12px;
      opacity: 0.8;
    }

    @media (max-width: 1024px) {
      .stats-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }
      
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: space-between;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      
      .quick-stats {
        flex-direction: column;
      }
      
      .realtime-indicator {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }
    }
  `]
})
export class ScrapingDashboardComponent implements OnInit, OnDestroy {
  private scrapingService = inject(AdvancedScrapingService);
  private destroy$ = new Subject<void>();

  // State signals
  systemStats = signal<ScrapingStats>({
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    totalTweetsCollected: 0,
    averageProcessingTime: 0,
    systemLoad: 0
  });

  jobMetrics = signal<JobMetrics>({
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageProgress: 0,
    totalTweetsCollected: 0,
    estimatedTimeRemaining: 0
  });

  connectionStatus = signal(false);
  isRefreshing = signal(false);
  lastUpdate = signal(new Date());

  // Computed properties
  metricsCards = computed((): MetricCard[] => {
    const stats = this.systemStats();
    const metrics = this.jobMetrics();

    return [
      {
        title: 'Total Jobs',
        value: stats.totalJobs,
        icon: 'work',
        color: '#1976d2',
        subtitle: `${stats.runningJobs} active`
      },
      {
        title: 'Running Jobs',
        value: stats.runningJobs,
        icon: 'play_arrow',
        color: '#4caf50',
        trend: stats.runningJobs > 0 ? 'up' : 'stable'
      },
      {
        title: 'Completed',
        value: stats.completedJobs,
        icon: 'check_circle',
        color: '#2e7d32',
        subtitle: `${((stats.completedJobs / Math.max(stats.totalJobs, 1)) * 100).toFixed(1)}% success rate`
      },
      {
        title: 'Failed Jobs',
        value: stats.failedJobs,
        icon: 'error',
        color: '#f44336',
        trend: stats.failedJobs > 0 ? 'down' : 'stable'
      },
      {
        title: 'Tweets Collected',
        value: this.formatNumber(metrics.totalTweetsCollected),
        icon: 'trending_up',
        color: '#ff9800',
        subtitle: 'All active jobs'
      },
      {
        title: 'System Load',
        value: this.formatPercentage(stats.systemLoad),
        icon: 'speed',
        color: this.getLoadColor(stats.systemLoad),
        trend: this.getLoadTrend(stats.systemLoad)
      }
    ];
  });

  jobDistribution = computed(() => {
    const stats = this.systemStats();
    const total = Math.max(stats.totalJobs, 1);

    return [
      {
        label: 'Running',
        count: stats.runningJobs,
        percentage: (stats.runningJobs / total) * 100,
        color: '#4caf50'
      },
      {
        label: 'Completed',
        count: stats.completedJobs,
        percentage: (stats.completedJobs / total) * 100,
        color: '#2196f3'
      },
      {
        label: 'Failed',
        count: stats.failedJobs,
        percentage: (stats.failedJobs / total) * 100,
        color: '#f44336'
      },
      {
        label: 'Pending',
        count: Math.max(0, stats.totalJobs - stats.runningJobs - stats.completedJobs - stats.failedJobs),
        percentage: Math.max(0, (stats.totalJobs - stats.runningJobs - stats.completedJobs - stats.failedJobs) / total) * 100,
        color: '#ff9800'
      }
    ];
  });

  ngOnInit(): void {
    this.subscribeToUpdates();
    this.startPeriodicRefresh();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToUpdates(): void {
    // Subscribe to system stats
    this.scrapingService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.systemStats.set(stats);
        this.lastUpdate.set(new Date());
      });

    // Subscribe to job metrics
    this.scrapingService.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.jobMetrics.set(metrics);
      });

    // Subscribe to connection status
    this.scrapingService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.connectionStatus.set(status);
      });
  }

  private startPeriodicRefresh(): void {
    // Refresh data every 30 seconds
    timer(0, 30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadSystemStats();
      });
  }

  private loadInitialData(): void {
    this.scrapingService.loadJobs().subscribe();
    this.loadSystemStats();
  }

  private loadSystemStats(): void {
    this.scrapingService.getSystemStats().subscribe();
  }

  refreshData(): void {
    this.isRefreshing.set(true);
    
    Promise.all([
      this.scrapingService.loadJobs().toPromise(),
      this.scrapingService.getSystemStats().toPromise()
    ]).then(() => {
      this.isRefreshing.set(false);
    }).catch(() => {
      this.isRefreshing.set(false);
    });
  }

  // Helper methods
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatPercentage(value: number): string {
    return (value * 100).toFixed(1) + '%';
  }

  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m`;
    } else {
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    }
  }

  formatLastUpdate(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.lastUpdate().getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) {
      return `${diffSecs}s ago`;
    } else {
      return `${Math.floor(diffSecs / 60)}m ago`;
    }
  }

  getLoadColor(load: number): string {
    if (load < 0.5) return '#4caf50';
    if (load < 0.8) return '#ff9800';
    return '#f44336';
  }

  getLoadTrend(load: number): 'up' | 'down' | 'stable' {
    if (load < 0.3) return 'down';
    if (load > 0.8) return 'up';
    return 'stable';
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'stable': return 'trending_flat';
    }
  }

  getTrendLabel(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return 'Trending up';
      case 'down': return 'Trending down';
      case 'stable': return 'Stable';
    }
  }

  getCurrentThroughput(): string {
    // This would ideally come from real-time data
    // For now, we'll calculate a rough estimate
    const metrics = this.jobMetrics();
    const runningJobs = metrics.runningJobs;
    
    if (runningJobs === 0) {
      return '0 tweets/sec';
    }

    // Rough estimation based on typical scraping rates
    const estimatedRate = runningJobs * 2.5; // ~2.5 tweets per second per job
    return `${estimatedRate.toFixed(1)} tweets/sec`;
  }
}
