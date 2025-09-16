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
  template: `
    <div class="scraping-monitor-container">
      <!-- Header -->
      <div class="monitor-header">
        <h1>
          <mat-icon>monitor</mat-icon>
          Scraping Monitor
        </h1>
        <p>Real-time monitoring of your data collection campaigns</p>
      </div>

      <!-- WebSocket Testing Section -->
      <mat-card class="websocket-test-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>wifi</mat-icon>
            WebSocket Async Scraping Test
          </mat-card-title>
          <div class="connection-status">
            @if (isWebSocketConnected()) {
              <mat-chip class="status-connected">
                <mat-icon>check_circle</mat-icon>
                Connected
              </mat-chip>
            } @else {
              <mat-chip class="status-disconnected">
                <mat-icon>error</mat-icon>
                Disconnected
              </mat-chip>
            }
          </div>
        </mat-card-header>

        <mat-card-content>
          <!-- Quick Test Form -->
          <form [formGroup]="testForm" (ngSubmit)="startAsyncScrapingTest()" class="test-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Campaign ID</mat-label>
                <input matInput formControlName="campaignId" placeholder="test-campaign-001">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hashtag</mat-label>
                <input matInput formControlName="hashtag" placeholder="javascript">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Max Tweets</mat-label>
                <mat-select formControlName="maxTweets">
                  <mat-option value="25">25 (Sync)</mat-option>
                  <mat-option value="75">75 (Async)</mat-option>
                  <mat-option value="150">150 (Async)</mat-option>
                  <mat-option value="300">300 (Async)</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="!isWebSocketConnected() || isTestRunning()"
              >
                @if (isTestRunning()) {
                  <mat-icon>hourglass_empty</mat-icon>
                  Testing...
                } @else {
                  <mat-icon>rocket_launch</mat-icon>
                  Start Async Test
                }
              </button>

              @if (!isWebSocketConnected()) {
                <button mat-button color="accent" (click)="connectWebSocket()">
                  <mat-icon>wifi</mat-icon>
                  Connect WebSocket
                </button>
              }
            </div>
          </form>

          <!-- Current Progress -->
          @if (currentProgress()) {
            <div class="progress-section">
              <h4>📊 Current Progress: {{currentProgress()?.campaignId}}</h4>
              <div class="progress-details">
                <div class="progress-bar-container">
                  <mat-progress-bar 
                    [value]="currentProgress()?.percentage || 0" 
                    color="primary"
                    mode="determinate">
                  </mat-progress-bar>
                  <span class="progress-text">{{currentProgress()?.percentage || 0}}%</span>
                </div>
                <div class="progress-info">
                  <p><strong>Status:</strong> {{currentProgress()?.status}}</p>
                  <p><strong>Message:</strong> {{currentProgress()?.message}}</p>
                  <p><strong>Tweets:</strong> {{currentProgress()?.scrapedTweets}}/{{currentProgress()?.totalTweets}}</p>
                  @if (currentProgress()?.estimatedTimeRemaining) {
                    <p><strong>ETA:</strong> {{formatTimeRemaining(currentProgress()?.estimatedTimeRemaining)}}</p>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Completed Jobs -->
          @if (completedJobs().length > 0) {
            <div class="completed-section">
              <h4>✅ Completed Jobs ({{completedJobs().length}})</h4>
              <div class="jobs-list">
                @for (job of completedJobs(); track job.sessionId) {
                  <div class="job-card">
                    <div class="job-header">
                      <strong>{{job.campaignId}}</strong>
                      <mat-chip class="job-status">{{job.tweetsCount}} tweets</mat-chip>
                    </div>
                    <div class="job-details">
                      <span>Completed: {{formatTime(job.completedAt)}}</span>
                      <span>Duration: {{calculateDuration(job)}}</span>
                    </div>
                    @if (job.summary.sentimentBreakdown) {
                      <div class="sentiment-breakdown">
                        <small>
                          😊 {{job.summary.sentimentBreakdown.positive}} 
                          😐 {{job.summary.sentimentBreakdown.neutral}} 
                          😞 {{job.summary.sentimentBreakdown.negative}}
                        </small>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Metrics Overview -->
      <div class="metrics-grid">
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-content">
              <mat-icon class="metric-icon total">campaign</mat-icon>
              <div class="metric-data">
                <span class="metric-value">{{ metrics().totalCampaigns }}</span>
                <span class="metric-label">Total Campaigns</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-content">
              <mat-icon class="metric-icon active">play_circle</mat-icon>
              <div class="metric-data">
                <span class="metric-value">{{ metrics().activeCampaigns }}</span>
                <span class="metric-label">Active Now</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-content">
              <mat-icon class="metric-icon tweets">trending_up</mat-icon>
              <div class="metric-data">
                <span class="metric-value">{{ formatNumber(metrics().totalTweets) }}</span>
                <span class="metric-label">Tweets Collected</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-content">
              <mat-icon class="metric-icon sentiment">sentiment_satisfied</mat-icon>
              <div class="metric-data">
                <span class="metric-value">{{ formatSentiment(metrics().averageSentiment) }}</span>
                <span class="metric-label">Avg Sentiment</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Active Campaigns -->
      <mat-card class="campaigns-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>list</mat-icon>
            Active Campaigns
          </mat-card-title>
          <div class="header-actions">
            <button mat-icon-button [disabled]="isRefreshing()" (click)="refreshData()">
              <mat-icon [class.spinning]="isRefreshing()">refresh</mat-icon>
            </button>
            <button mat-raised-button color="primary" (click)="startNewCampaign()">
              <mat-icon>add</mat-icon>
              New Campaign
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          @if (campaigns().length === 0) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <h3>No Active Campaigns</h3>
              <p>Start a new campaign to begin monitoring social media data</p>
              <button mat-raised-button color="primary" (click)="startNewCampaign()">
                Create Campaign
              </button>
            </div>
          } @else {
            <div class="campaigns-list">
              @for (campaign of campaigns(); track campaign.id) {
                <div class="campaign-item">
                  <div class="campaign-info">
                    <div class="campaign-header">
                      <h3>{{ campaign.name }}</h3>
                      <mat-chip [class]="'status-' + campaign.status">
                        {{ getStatusLabel(campaign.status) }}
                      </mat-chip>
                    </div>
                    
                    <div class="campaign-details">
                      <span class="detail-item">
                        <mat-icon>schedule</mat-icon>
                        Started: {{ formatTime(campaign.startTime) }}
                      </span>
                      
                      @if (campaign.estimatedCompletion) {
                        <span class="detail-item">
                          <mat-icon>timer</mat-icon>
                          ETA: {{ formatTime(campaign.estimatedCompletion) }}
                        </span>
                      }
                      
                      <span class="detail-item">
                        <mat-icon>trending_up</mat-icon>
                        {{ formatNumber(campaign.tweetsCollected) }} tweets
                      </span>
                      
                      <span class="detail-item">
                        <mat-icon>sentiment_satisfied</mat-icon>
                        {{ formatSentiment(campaign.sentimentScore) }}
                      </span>
                    </div>
                  </div>

                  <div class="campaign-progress">
                    <div class="progress-info">
                      <span class="progress-label">Progress</span>
                      <span class="progress-value">{{ campaign.progress }}%</span>
                    </div>
                    <mat-progress-bar 
                      [value]="campaign.progress" 
                      [color]="getProgressColor(campaign.status)"
                      mode="determinate">
                    </mat-progress-bar>
                  </div>

                  <div class="campaign-actions">
                    @if (campaign.status === 'running') {
                      <button mat-icon-button color="warn" (click)="pauseCampaign(campaign.id)" title="Pause">
                        <mat-icon>pause</mat-icon>
                      </button>
                    } @else if (campaign.status === 'paused') {
                      <button mat-icon-button color="primary" (click)="resumeCampaign(campaign.id)" title="Resume">
                        <mat-icon>play_arrow</mat-icon>
                      </button>
                    }
                    
                    <button mat-icon-button (click)="viewCampaignDetails(campaign.id)" title="View Details">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    
                    <button mat-icon-button color="warn" (click)="stopCampaign(campaign.id)" title="Stop">
                      <mat-icon>stop</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Real-time Updates -->
      @if (hasActiveCampaigns()) {
        <mat-card class="updates-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>update</mat-icon>
              Live Updates
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="live-indicator">
              <div class="pulse-dot"></div>
              <span>Monitoring {{ activeCampaignsCount() }} active campaigns</span>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .scraping-monitor-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .monitor-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .monitor-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #1976d2;
      margin-bottom: 8px;
    }

    /* WebSocket Test Card Styles */
    .websocket-test-card {
      margin-bottom: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .websocket-test-card .mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .connection-status .status-connected {
      background: #4caf50;
      color: white;
    }

    .connection-status .status-disconnected {
      background: #f44336;
      color: white;
    }

    .test-form {
      background: rgba(255, 255, 255, 0.1);
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .progress-section {
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .progress-bar-container {
      position: relative;
      margin-bottom: 16px;
    }

    .progress-text {
      position: absolute;
      right: 0;
      top: -24px;
      font-weight: bold;
      color: white;
    }

    .progress-details {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .progress-info p {
      margin: 4px 0;
      font-size: 14px;
    }

    .completed-section {
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      border-radius: 8px;
    }

    .jobs-list {
      display: grid;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
    }

    .job-card {
      background: rgba(255, 255, 255, 0.2);
      padding: 16px;
      border-radius: 6px;
      border-left: 4px solid #4caf50;
    }

    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .job-status {
      background: rgba(76, 175, 80, 0.8);
      color: white;
      font-size: 12px;
    }

    .job-details {
      display: flex;
      gap: 16px;
      font-size: 13px;
      margin-bottom: 8px;
    }

    .sentiment-breakdown {
      font-size: 12px;
      opacity: 0.9;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-card {
      transition: transform 0.2s ease-in-out;
    }

    .metric-card:hover {
      transform: translateY(-2px);
    }

    .metric-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .metric-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      padding: 12px;
    }

    .metric-icon.total {
      background: #e3f2fd;
      color: #1976d2;
    }

    .metric-icon.active {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .metric-icon.tweets {
      background: #fff3e0;
      color: #f57c00;
    }

    .metric-icon.sentiment {
      background: #fce4ec;
      color: #c2185b;
    }

    .metric-data {
      display: flex;
      flex-direction: column;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }

    .metric-label {
      font-size: 14px;
      color: #666;
    }

    .campaigns-card {
      margin-bottom: 24px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .campaigns-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .campaign-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }

    .campaign-info {
      flex: 1;
    }

    .campaign-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .campaign-header h3 {
      margin: 0;
      color: #333;
    }

    .campaign-details {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: #666;
    }

    .detail-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .campaign-progress {
      min-width: 200px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .campaign-actions {
      display: flex;
      gap: 4px;
    }

    .status-running {
      background: #c8e6c9;
      color: #2e7d32;
    }

    .status-paused {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-completed {
      background: #e1f5fe;
      color: #0277bd;
    }

    .status-error {
      background: #ffebee;
      color: #d32f2f;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #bbb;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      color: #666;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #999;
      margin-bottom: 24px;
    }

    .updates-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pulse-dot {
      width: 12px;
      height: 12px;
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

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .scraping-monitor-container {
        padding: 16px;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      
      .campaign-item {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      
      .campaign-details {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
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
