import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AsyncScrapingRequest, ScrapingCompletedResult, ScrapingProgressUpdate } from '../../core/interfaces/scraping.interface';
import { ScrapingService } from '../../core/services/scraping.service';
import { WebSocketService } from '../../core/services/websocket.service';

export interface AsyncScrapingSession {
  sessionId: string;
  campaignId: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  totalTweets: number;
  scrapedTweets: number;
  startTime: Date;
  endTime?: Date;
  message: string;
}

export interface CampaignStatus {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  tweetsCollected: number;
  sentimentScore: number;
  startTime: Date;
  estimatedCompletion?: Date;
  sessionId?: string; // Link to async session
}

export interface ScrapingMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalTweets: number;
  averageSentiment: number;
}

@Component({
  selector: 'app-scraping-monitor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule
  ],
  templateUrl: './scraping-monitor.component.html',
  styleUrls: ['./scraping-monitor.component.css']
})
export class ScrapingMonitorComponent implements OnInit, OnDestroy {
  // Injected services
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private websocketService = inject(WebSocketService);
  private scrapingService = inject(ScrapingService);
  private destroy$ = new Subject<void>();

  // Reactive state for campaigns
  campaigns = signal<CampaignStatus[]>([]);
  metrics = signal<ScrapingMetrics>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalTweets: 0,
    averageSentiment: 0
  });
  isRefreshing = signal(false);

  // WebSocket-specific state
  isWebSocketConnected = signal(false);
  isTestRunning = signal(false);
  currentProgress = signal<ScrapingProgressUpdate | null>(null);
  completedJobs = signal<ScrapingCompletedResult[]>([]);

  // Test form
  testForm: FormGroup;

  // Computed properties
  hasActiveCampaigns = computed(() => this.campaigns().some(c => c.status === 'running'));
  activeCampaignsCount = computed(() => this.campaigns().filter(c => c.status === 'running').length);

  private updateInterval?: number;

  constructor() {
    // Initialize test form
    this.testForm = this.fb.group({
      campaignId: [`test-campaign-${Date.now()}`, Validators.required],
      hashtag: ['javascript', Validators.required],
      maxTweets: [75, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.startRealTimeUpdates();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  // ================================
  // 🚀 WEBSOCKET METHODS
  // ================================

  async connectWebSocket(): Promise<void> {
    try {
      console.log('🔌 Connecting to WebSocket...');
      
      await this.websocketService.connect().pipe(
        takeUntil(this.destroy$)
      ).toPromise();
      
      this.isWebSocketConnected.set(true);
      this.setupWebSocketListeners();
      
      this.snackBar.open('✅ WebSocket connected successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.isWebSocketConnected.set(false);
      
      this.snackBar.open('❌ WebSocket connection failed', 'Retry', {
        duration: 5000,
        panelClass: ['error-snackbar']
      }).onAction().subscribe(() => {
        this.connectWebSocket();
      });
    }
  }

  private setupWebSocketListeners(): void {
    // Listen for scraping progress
    this.websocketService.on<ScrapingProgressUpdate>('scraping-progress')
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        console.log('📈 Progress update received:', progress);
        this.currentProgress.set(progress);
        this.updateCampaignFromProgress(progress);
      });

    // Listen for scraping completion
    this.websocketService.on<ScrapingCompletedResult>('scraping-completed')
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        console.log('✅ Scraping completed:', result);
        this.handleScrapingCompleted(result);
      });

    // Listen for connection status
    this.websocketService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isWebSocketConnected.set(status.connected);
        if (!status.connected && status.error) {
          console.error('WebSocket error:', status.error);
        }
      });
  }

  async startAsyncScrapingTest(): Promise<void> {
    if (!this.testForm.valid || !this.isWebSocketConnected()) {
      return;
    }

    const formValue = this.testForm.value;
    this.isTestRunning.set(true);

    const request: AsyncScrapingRequest = {
      campaignId: formValue.campaignId,
      hashtag: formValue.hashtag,
      maxTweets: formValue.maxTweets,
      language: 'es',
      includeReplies: false,
      analyzeSentiment: true
    };

    try {
      console.log('🚀 Starting async scraping test:', request);
      
      const response = await this.scrapingService.startAsyncScraping(request).toPromise();
      
      console.log('✅ Async scraping started:', response);
      
      this.snackBar.open(
        `🚀 Async scraping started! Session: ${response?.sessionId}`,
        'Close',
        { duration: 5000 }
      );

      // Join the campaign room for real-time updates
      this.scrapingService.joinCampaign(request.campaignId);
      
    } catch (error) {
      console.error('❌ Error starting async scraping:', error);
      this.isTestRunning.set(false);
      
      this.snackBar.open(
        '❌ Error starting async scraping',
        'Close',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    }
  }

  private updateCampaignFromProgress(progress: ScrapingProgressUpdate): void {
    this.campaigns.update(campaigns =>
      campaigns.map(campaign => {
        if (campaign.id === progress.campaignId) {
          return {
            ...campaign,
            status: progress.status === 'processing' ? 'running' : 
                   progress.status === 'completed' ? 'completed' : 
                   progress.status === 'error' ? 'error' : campaign.status,
            progress: progress.percentage,
            tweetsCollected: progress.scrapedTweets
          };
        }
        return campaign;
      })
    );
    this.updateMetrics();
  }

  private handleScrapingCompleted(result: ScrapingCompletedResult): void {
    this.isTestRunning.set(false);
    this.currentProgress.set(null);
    
    // Add to completed jobs
    this.completedJobs.update(jobs => [result, ...jobs]);
    
    // Update campaign status
    this.campaigns.update(campaigns =>
      campaigns.map(campaign => {
        if (campaign.id === result.campaignId) {
          return {
            ...campaign,
            status: 'completed',
            progress: 100,
            tweetsCollected: result.tweetsCount
          };
        }
        return campaign;
      })
    );
    
    this.updateMetrics();
    
    this.snackBar.open(
      `🎉 Scraping completed! Found ${result.tweetsCount} tweets`,
      'View Results',
      { 
        duration: 10000,
        panelClass: ['success-snackbar']
      }
    ).onAction().subscribe(() => {
      this.viewCampaignDetails(result.campaignId);
    });
  }

  // Helper methods for template
  formatTimeRemaining(seconds?: number): string {
    if (!seconds) return '';
    
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  calculateDuration(job: ScrapingCompletedResult): string {
    // For now, we'll simulate duration since we don't have startTime in the result
    // In a real implementation, you'd track start time
    const duration = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
    return this.formatTimeRemaining(duration);
  }

  private loadInitialData(): void {
    // Simulate loading campaign data
    const mockCampaigns: CampaignStatus[] = [
      {
        id: '1',
        name: 'AI Trends Campaign',
        status: 'running',
        progress: 65,
        tweetsCollected: 2543,
        sentimentScore: 0.7,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        estimatedCompletion: new Date(Date.now() + 1 * 60 * 60 * 1000)
      },
      {
        id: '2',
        name: 'Brand Monitoring',
        status: 'paused',
        progress: 30,
        tweetsCollected: 892,
        sentimentScore: 0.5,
        startTime: new Date(Date.now() - 5 * 60 * 60 * 1000)
      }
    ];

    this.campaigns.set(mockCampaigns);
    this.updateMetrics();
  }

  private startRealTimeUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateCampaignProgress();
    }, 3000);
  }

  private updateCampaignProgress(): void {
    this.campaigns.update(campaigns => 
      campaigns.map(campaign => {
        if (campaign.status === 'running' && campaign.progress < 100) {
          return {
            ...campaign,
            progress: Math.min(campaign.progress + Math.random() * 5, 100),
            tweetsCollected: campaign.tweetsCollected + Math.floor(Math.random() * 10)
          };
        }
        return campaign;
      })
    );
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const campaigns = this.campaigns();
    this.metrics.set({
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'running').length,
      totalTweets: campaigns.reduce((sum, c) => sum + c.tweetsCollected, 0),
      averageSentiment: campaigns.length > 0 
        ? campaigns.reduce((sum, c) => sum + c.sentimentScore, 0) / campaigns.length 
        : 0
    });
  }

  // Public methods
  refreshData(): void {
    this.isRefreshing.set(true);
    setTimeout(() => {
      this.loadInitialData();
      this.isRefreshing.set(false);
    }, 1000);
  }

  startNewCampaign(): void {
    console.log('Starting new campaign...');
  }

  pauseCampaign(campaignId: string): void {
    this.campaigns.update(campaigns =>
      campaigns.map(c => c.id === campaignId ? { ...c, status: 'paused' as const } : c)
    );
    this.updateMetrics();
  }

  resumeCampaign(campaignId: string): void {
    this.campaigns.update(campaigns =>
      campaigns.map(c => c.id === campaignId ? { ...c, status: 'running' as const } : c)
    );
    this.updateMetrics();
  }

  stopCampaign(campaignId: string): void {
    this.campaigns.update(campaigns =>
      campaigns.map(c => c.id === campaignId ? { ...c, status: 'completed' as const, progress: 100 } : c)
    );
    this.updateMetrics();
  }

  viewCampaignDetails(campaignId: string): void {
    // Navigate to campaign details inside dashboard so toolbar/sidenav remain visible
    this.router.navigate(['/dashboard/campaigns', campaignId]).catch(() => {
      // fallback to full navigation if client-side navigation fails
      window.location.href = `/dashboard/campaigns/${campaignId}`;
    });
  }

  // Helper methods
  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  formatSentiment(score: number): string {
    return (score * 100).toFixed(1) + '%';
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'running': 'Running',
      'paused': 'Paused',
      'completed': 'Completed',
      'error': 'Error'
    };
    return labels[status] || status;
  }

  getProgressColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'running': return 'primary';
      case 'paused': return 'accent';
      case 'error': return 'warn';
      default: return 'primary';
    }
  }
}
