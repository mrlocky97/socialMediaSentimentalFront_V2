/**
 * Scraping Dashboard Component
 * Real-time dashboard showing scraping metrics and system stats
 */

import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, timer } from 'rxjs';
import { JobMetrics, ScrapingStats } from '../../../../core/interfaces/advanced-scraping.interface';
import { AdvancedScrapingService } from '../../../../core/services/advanced-scraping.service';

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
    MatDividerModule,
  ],
  templateUrl: './scraping-dashboard.component.html',
  styleUrls: ['./scraping-dashboard.component.css'],
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
    systemLoad: 0,
  });

  jobMetrics = signal<JobMetrics>({
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageProgress: 0,
    totalTweetsCollected: 0,
    estimatedTimeRemaining: 0,
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
        subtitle: `${stats.runningJobs} active`,
      },
      {
        title: 'Running Jobs',
        value: stats.runningJobs,
        icon: 'play_arrow',
        color: '#4caf50',
        trend: stats.runningJobs > 0 ? 'up' : 'stable',
      },
      {
        title: 'Completed',
        value: stats.completedJobs,
        icon: 'check_circle',
        color: '#2e7d32',
        subtitle: `${((stats.completedJobs / Math.max(stats.totalJobs, 1)) * 100).toFixed(
          1
        )}% success rate`,
      },
      {
        title: 'Failed Jobs',
        value: stats.failedJobs,
        icon: 'error',
        color: '#f44336',
        trend: stats.failedJobs > 0 ? 'down' : 'stable',
      },
      {
        title: 'Tweets Collected',
        value: this.formatNumber(metrics.totalTweetsCollected),
        icon: 'trending_up',
        color: '#ff9800',
        subtitle: 'All active jobs',
      },
      {
        title: 'System Load',
        value: this.formatPercentage(stats.systemLoad),
        icon: 'speed',
        color: this.getLoadColor(stats.systemLoad),
        trend: this.getLoadTrend(stats.systemLoad),
      },
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
        color: '#4caf50',
      },
      {
        label: 'Completed',
        count: stats.completedJobs,
        percentage: (stats.completedJobs / total) * 100,
        color: '#2196f3',
      },
      {
        label: 'Failed',
        count: stats.failedJobs,
        percentage: (stats.failedJobs / total) * 100,
        color: '#f44336',
      },
      {
        label: 'Pending',
        count: Math.max(
          0,
          stats.totalJobs - stats.runningJobs - stats.completedJobs - stats.failedJobs
        ),
        percentage:
          Math.max(
            0,
            (stats.totalJobs - stats.runningJobs - stats.completedJobs - stats.failedJobs) / total
          ) * 100,
        color: '#ff9800',
      },
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
    this.scrapingService.stats$.pipe(takeUntil(this.destroy$)).subscribe((stats) => {
      this.systemStats.set(stats);
      this.lastUpdate.set(new Date());
    });

    // Subscribe to job metrics
    this.scrapingService.metrics$.pipe(takeUntil(this.destroy$)).subscribe((metrics) => {
      this.jobMetrics.set(metrics);
    });

    // Subscribe to connection status
    this.scrapingService.connectionStatus$.pipe(takeUntil(this.destroy$)).subscribe((status) => {
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
      this.scrapingService.getSystemStats().toPromise(),
    ])
      .then(() => {
        this.isRefreshing.set(false);
      })
      .catch(() => {
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
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      case 'stable':
        return 'trending_flat';
    }
  }

  getTrendLabel(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'Trending up';
      case 'down':
        return 'Trending down';
      case 'stable':
        return 'Stable';
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
