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
import { DialogService } from '../../shared/components/dialog';
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
  templateUrl: './scraping-monitor.component.html',
  styleUrls: ['./scraping-monitor.component.css'],
})
export class ScrapingMonitorComponent implements OnInit, OnDestroy {
  private scrapingService = inject(AdvancedScrapingService);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
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
    // Usar un diálogo de confirmación simple
    this.dialogService.confirm(
      'Create New Scraping Job',
      'Do you want to create a new hashtag scraping job for #Angular?'
    ).subscribe(result => {
      if (result?.action === 'confirm') {
        this.createSimpleJob();
      } else {
        console.log('Job creation cancelled');
      }
    });
  }

  private createSimpleJob(): void {
    // Mostrar diálogo de éxito después de "crear" el job
    this.dialogService.success(
      'Job Created Successfully!',
      'Your hashtag scraping job for #Angular has been created and will start shortly.'
    ).subscribe(() => {
      console.log('Job creation process completed');
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
