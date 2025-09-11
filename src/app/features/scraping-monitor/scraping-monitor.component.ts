import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { AdvancedScrapingService } from '../../core/services/advanced-scraping.service';
import { CreateJobComponent } from './components/create-job/create-job.component';
import { JobListComponent } from './components/job-list/job-list.component';
import { ScrapingDashboardComponent } from './components/scraping-dashboard/scraping-dashboard.component';

@Component({
  selector: 'app-scraping-monitor',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    MatToolbarModule,
    MatBadgeModule,
    MatTooltipModule,
    CreateJobComponent,
    JobListComponent,
    ScrapingDashboardComponent,
  ],
  template: `
    <div class="scraping-monitor-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon>rocket_launch</mat-icon>
            Advanced Scraping Monitor
          </h1>
          <p>Real-time monitoring and management of high-volume social media data collection</p>
        </div>

        <div class="header-actions">
          <!-- Connection Status -->
          <div
            class="connection-indicator"
            [class]="connectionStatus() ? 'connected' : 'disconnected'"
          >
            <div class="status-dot"></div>
            <span>{{ connectionStatus() ? 'Connected' : 'Disconnected' }}</span>
          </div>

          <!-- Create Job Button -->
          <button
            mat-raised-button
            color="primary"
            (click)="openCreateJobDialog()"
            class="create-job-btn"
          >
            <mat-icon>add</mat-icon>
            Create Job
          </button>
        </div>
      </div>

      <!-- Content Container -->
      <div class="content-container">
        <!-- Navigation Tabs -->
        <mat-tab-group
          [selectedIndex]="selectedTabIndex()"
          (selectedIndexChange)="onTabChange($event)"
          animationDuration="300ms"
          class="main-tabs"
        >
          <!-- Dashboard Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>dashboard</mat-icon>
              Dashboard
            </ng-template>

            <div class="tab-content">
              <app-scraping-dashboard></app-scraping-dashboard>
            </div>
          </mat-tab>

          <!-- Active Jobs Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>list_alt</mat-icon>
              Jobs @if (activeJobsCount() > 0) {
              <span
                matBadge="{{ activeJobsCount() }}"
                matBadgePosition="after"
                matBadgeColor="accent"
                matBadgeSize="small"
                class="tab-badge"
              >
              </span>
              }
            </ng-template>

            <div class="tab-content">
              <app-job-list></app-job-list>
            </div>
          </mat-tab>

          <!-- Create Job Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>rocket_launch</mat-icon>
              Create Job
            </ng-template>

            <div class="tab-content">
              <app-create-job
                (jobCreated)="onJobCreated($event)"
                (cancelled)="onJobCreationCancelled()"
              >
              </app-create-job>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Quick Actions Toolbar -->
        <div class="quick-actions-toolbar">
          <div class="toolbar-content">
            <div class="quick-stats">
              <div class="stat-item">
                <mat-icon>work</mat-icon>
                <span>{{ totalJobs() }} Total Jobs</span>
              </div>

              <div class="stat-item">
                <mat-icon>play_arrow</mat-icon>
                <span>{{ activeJobsCount() }} Running</span>
              </div>

              <div class="stat-item">
                <mat-icon>trending_up</mat-icon>
                <span>{{ formatNumber(totalTweetsCollected()) }} Tweets</span>
              </div>
            </div>

            <div class="quick-actions">
              <button
                mat-icon-button
                (click)="refreshAllData()"
                [disabled]="isRefreshing()"
                matTooltip="Refresh all data"
              >
                <mat-icon [class.spinning]="isRefreshing()">refresh</mat-icon>
              </button>

              <button
                mat-icon-button
                (click)="toggleConnectionStatus()"
                [matTooltip]="
                  connectionStatus()
                    ? 'Disconnect from real-time updates'
                    : 'Connect to real-time updates'
                "
              >
                <mat-icon>{{ connectionStatus() ? 'wifi_off' : 'wifi' }}</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .scraping-monitor-page {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--color-gray-50);
        overflow: hidden;
      }

      .page-header {
        background: var(--color-white-alpha-95);
        backdrop-filter: blur(10px);
        padding: 2rem;
        border-bottom: 1px solid var(--color-gray-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 8px var(--color-black-alpha-50);
      }

      .header-content h1 {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0 0 0.5rem 0;
        color: var(--color-primary);
        font-size: 2rem;
        font-weight: 600;
        background: var(--color-primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .header-content h1 mat-icon {
        color: var(--color-primary);
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
      }

      .header-content p {
        margin: 0;
        color: var(--color-gray-600);
        font-size: 1rem;
        font-weight: 400;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .connection-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border-radius: 1.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        border: 1px solid;
        background: var(--color-white-alpha-90);
        backdrop-filter: blur(8px);
        transition: all 0.3s ease;
      }

      .connection-indicator.connected {
        color: var(--color-success);
        border-color: var(--color-success);
        box-shadow: 0 0 20px rgba(76, 175, 80, 0.15);
      }

      .connection-indicator.disconnected {
        color: var(--color-error);
        border-color: var(--color-error);
        box-shadow: 0 0 20px rgba(244, 67, 54, 0.15);
      }

      .status-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: currentColor;
      }

      .connection-indicator.connected .status-dot {
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

      .create-job-btn {
        font-size: 1rem;
        padding: 0.75rem 1.5rem;
        border-radius: 1.5rem;
        background: var(--color-primary-gradient);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
      }

      .create-job-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
      }

      .content-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 1rem;
        gap: 1rem;
      }

      .main-tabs {
        flex: 1;
        background: var(--color-white-alpha-95);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        box-shadow: 0 4px 20px var(--color-black-alpha-50);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .main-tabs ::ng-deep .mat-mdc-tab-group {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .main-tabs ::ng-deep .mat-mdc-tab-header {
        background: var(--color-white-alpha-90);
        border-bottom: 1px solid var(--color-gray-200);
      }

      .main-tabs ::ng-deep .mat-mdc-tab-label {
        color: var(--color-gray-600);
        transition: all 0.3s ease;
        padding: 1rem 1.5rem;
        min-width: auto;
      }

      .main-tabs ::ng-deep .mat-mdc-tab-label.mdc-tab--active {
        color: var(--color-primary);
      }

      .main-tabs ::ng-deep .mat-mdc-tab-label mat-icon {
        margin-right: 0.5rem;
      }

      .main-tabs ::ng-deep .mat-mdc-tab-body-wrapper {
        flex: 1;
        overflow: hidden;
      }

      .main-tabs ::ng-deep .mat-mdc-tab-body {
        height: 100%;
      }

      .main-tabs ::ng-deep .mat-mdc-tab-body-content {
        height: 100%;
        overflow: auto;
      }

      .tab-content {
        height: 100%;
        padding: 1.5rem;
        background: var(--color-gray-50);
      }

      .quick-actions-toolbar {
        background: var(--color-white-alpha-95);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        padding: 1rem 1.5rem;
        box-shadow: 0 4px 20px var(--color-black-alpha-50);
        border: 1px solid var(--color-gray-200);
      }

      .toolbar-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .quick-stats {
        display: flex;
        gap: 2rem;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--color-gray-700);
        font-weight: 500;
        font-size: 0.875rem;
      }

      .stat-item mat-icon {
        color: var(--color-primary);
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }

      .quick-actions {
        display: flex;
        gap: 0.5rem;
      }

      .quick-actions button {
        background: var(--color-white-alpha-80);
        border: 1px solid var(--color-gray-300);
        color: var(--color-gray-700);
        transition: all 0.3s ease;
      }

      .quick-actions button:hover {
        background: var(--color-primary);
        color: var(--color-white);
        border-color: var(--color-primary);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      .quick-actions button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .quick-actions button[disabled]:hover {
        background: var(--color-white-alpha-80);
        color: var(--color-gray-700);
        border-color: var(--color-gray-300);
        transform: none;
        box-shadow: none;
      }

      .spinning {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
        }

        .header-content h1 {
          font-size: 1.5rem;
        }

        .quick-stats {
          flex-direction: column;
          gap: 0.75rem;
        }

        .toolbar-content {
          flex-direction: column;
          gap: 1rem;
        }
      }

      /* Dark Mode Support */
      @media (prefers-color-scheme: dark) {
        .scraping-monitor-page {
          background: var(--color-gray-900);
        }

        .page-header {
          background: rgba(33, 33, 33, 0.95);
          border-bottom-color: var(--color-gray-700);
        }

        .main-tabs {
          background: rgba(33, 33, 33, 0.95);
        }

        .quick-actions-toolbar {
          background: rgba(33, 33, 33, 0.95);
          border-color: var(--color-gray-700);
        }

        .tab-content {
          background: var(--color-gray-800);
        }
      }
    `,
  ],
})
export class ScrapingMonitorComponent implements OnInit, OnDestroy {
  private scrapingService = inject(AdvancedScrapingService);
  private dialog = inject(MatDialog);
  private destroyer$ = new Subject<void>();

  // State signals
  selectedTabIndex = signal(0);
  connectionStatus = signal(false);
  activeJobsCount = signal(0);
  totalJobs = signal(0);
  totalTweetsCollected = signal(0);
  isRefreshing = signal(false);

  ngOnInit(): void {
    this.subscribeToUpdates();
    this.loadInitialData();
  }

  private subscribeToUpdates(): void {
    // Subscribe to connection status
    this.scrapingService.connectionStatus$.subscribe((status) => {
      this.connectionStatus.set(status);
    });

    // Subscribe to metrics
    this.scrapingService.metrics$.subscribe((metrics) => {
      this.activeJobsCount.set(metrics.runningJobs);
      this.totalJobs.set(metrics.totalJobs);
      this.totalTweetsCollected.set(metrics.totalTweetsCollected);
    });
  }

  private loadInitialData(): void {
    // Only load system stats, jobs are already loaded by the service constructor
    this.scrapingService.getSystemStats().subscribe();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }

  openCreateJobDialog(): void {
    const dialogRef = this.dialog.open(CreateJobComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onJobCreated(result);
      }
    });
  }

  onJobCreated(job: any): void {
    // Switch to jobs tab to see the new job
    this.selectedTabIndex.set(1);
    // Refresh job list
    this.scrapingService.loadJobs().subscribe();
  }

  onJobCreationCancelled(): void {
    // Switch back to dashboard
    this.selectedTabIndex.set(0);
  }

  refreshAllData(): void {
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

  toggleConnectionStatus(): void {
    if (this.connectionStatus()) {
      // Disconnect logic would go here
      console.log('Disconnecting from real-time updates');
    } else {
      // Reconnect logic
      this.scrapingService.reconnectWebSocket();
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  ngOnDestroy(): void {
    this.destroyer$.next();
    this.destroyer$.complete();
  }
}
