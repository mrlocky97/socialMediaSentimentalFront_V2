import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription } from 'rxjs';
import { ScrapingService } from '../../../core/services/scraping.service';
import { ConnectionStatus, ScrapingProgress, WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-websocket-scraping',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="websocket-card">
      <mat-card-header>
        <mat-card-title>WebSocket Scraping Monitor</mat-card-title>
        <mat-card-subtitle>Real-time scraping progress</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Connection Status -->
        <div class="connection-status">
          <mat-chip-set>
            <mat-chip [class]="connectionStatus.connected ? 'connected' : 'disconnected'">
              <mat-icon>{{connectionStatus.connected ? 'wifi' : 'wifi_off'}}</mat-icon>
              {{connectionStatus.connected ? 'Connected' : 'Disconnected'}}
            </mat-chip>
          </mat-chip-set>
          
          <div *ngIf="connectionStatus.error" class="error-message">
            <mat-icon>error</mat-icon>
            {{connectionStatus.error}}
          </div>
        </div>

        <!-- Scraping Progress -->
        <div *ngIf="scrapingProgress" class="progress-section">
          <div class="progress-header">
            <h3>Scraping Progress</h3>
            <mat-chip [class]="getStatusClass(scrapingProgress.status)">
              {{scrapingProgress.status | titlecase}}
            </mat-chip>
          </div>

          <div class="progress-details">
            <div class="progress-bar-container">
              <mat-progress-bar 
                mode="determinate" 
                [value]="scrapingProgress.percentage"
                [class]="getProgressBarClass(scrapingProgress.status)">
              </mat-progress-bar>
              <span class="progress-text">{{scrapingProgress.percentage}}%</span>
            </div>

            <div class="progress-info">
              <div class="info-item">
                <mat-icon>timeline</mat-icon>
                <span>{{scrapingProgress.processedTweets}} / {{scrapingProgress.totalTweets}} tweets</span>
              </div>
              
              <div class="info-item">
                <mat-icon>layers</mat-icon>
                <span>Chunk {{scrapingProgress.currentChunk}} / {{scrapingProgress.totalChunks}}</span>
              </div>

              <div *ngIf="scrapingProgress.estimatedTimeRemaining" class="info-item">
                <mat-icon>schedule</mat-icon>
                <span>{{formatTime(scrapingProgress.estimatedTimeRemaining)}} remaining</span>
              </div>

              <div *ngIf="scrapingProgress.isBackground" class="info-item">
                <mat-icon>cloud_queue</mat-icon>
                <span>Background mode</span>
              </div>
            </div>

            <div *ngIf="scrapingProgress.error" class="error-section">
              <mat-icon>error</mat-icon>
              <span>{{scrapingProgress.error}}</span>
            </div>
          </div>
        </div>

        <!-- No Progress -->
        <div *ngIf="!scrapingProgress" class="no-progress">
          <mat-icon>info</mat-icon>
          <p>No active scraping session</p>
        </div>
      </mat-card-content>

      <mat-card-actions>
        <button mat-raised-button 
                [color]="connectionStatus.connected ? 'warn' : 'primary'"
                (click)="toggleConnection()">
          {{connectionStatus.connected ? 'Disconnect' : 'Connect'}}
        </button>

        <button mat-raised-button 
                color="accent"
                [disabled]="!connectionStatus.connected"
                (click)="startTestScraping()">
          Start Test Scraping
        </button>

        <button mat-raised-button 
                [disabled]="!connectionStatus.connected || !scrapingProgress"
                (click)="stopScraping()">
          Stop Scraping
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .websocket-card {
      max-width: 600px;
      margin: 20px auto;
    }

    .connection-status {
      margin-bottom: 20px;
    }

    .connected {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .disconnected {
      background-color: #f44336 !important;
      color: white !important;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      margin-top: 10px;
      font-size: 14px;
    }

    .progress-section {
      margin: 20px 0;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .progress-header h3 {
      margin: 0;
    }

    .progress-bar-container {
      position: relative;
      margin-bottom: 15px;
    }

    .progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }

    .progress-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .error-section {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      margin-top: 15px;
      padding: 10px;
      background-color: #ffebee;
      border-radius: 4px;
    }

    .no-progress {
      text-align: center;
      color: #666;
      padding: 40px 20px;
    }

    .no-progress mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 10px;
    }

    /* Status-based styling */
    .status-starting { background-color: #2196F3 !important; color: white !important; }
    .status-processing { background-color: #FF9800 !important; color: white !important; }
    .status-paused { background-color: #9C27B0 !important; color: white !important; }
    .status-completed { background-color: #4CAF50 !important; color: white !important; }
    .status-error { background-color: #F44336 !important; color: white !important; }
    .status-cancelled { background-color: #607D8B !important; color: white !important; }

    .progress-starting { accent-color: #2196F3; }
    .progress-processing { accent-color: #FF9800; }
    .progress-paused { accent-color: #9C27B0; }
    .progress-completed { accent-color: #4CAF50; }
    .progress-error { accent-color: #F44336; }
    .progress-cancelled { accent-color: #607D8B; }

    mat-card-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
  `]
})
export class WebsocketScrapingComponent implements OnInit, OnDestroy {
  connectionStatus: ConnectionStatus = { connected: false };
  scrapingProgress: ScrapingProgress | null = null;
  
  private subscriptions: Subscription[] = [];
  private currentSessionId: string | null = null;

  constructor(
    private websocketService: WebSocketService,
    private scrapingService: ScrapingService
  ) {}

  ngOnInit(): void {
    // Subscribe to connection status
    this.subscriptions.push(
      this.websocketService.getConnectionStatus().subscribe(
        (status: ConnectionStatus) => this.connectionStatus = status
      )
    );

    // Subscribe to scraping progress
    this.subscriptions.push(
      this.websocketService.getScrapingProgress().subscribe(
        (progress: ScrapingProgress | null) => this.scrapingProgress = progress
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.currentSessionId) {
      this.websocketService.unsubscribeFromScrapingProgress(this.currentSessionId);
    }
  }

  toggleConnection(): void {
    if (this.connectionStatus.connected) {
      this.websocketService.disconnect();
    } else {
      this.websocketService.connect().subscribe();
    }
  }

  startTestScraping(): void {
    if (!this.connectionStatus.connected) return;

    // Generate a test session ID
    this.currentSessionId = 'test-session-' + Date.now();
    
    // Subscribe to progress for this session
    this.subscriptions.push(
      this.websocketService.subscribeToScrapingProgress(this.currentSessionId).subscribe(
        (progress: ScrapingProgress) => {
          console.log('Received progress:', progress);
          this.scrapingProgress = progress;
        }
      )
    );

    // Start test scraping
    const testConfig = {
      sessionId: this.currentSessionId,
      maxTweets: 100,
      keywords: ['test'],
      isBackground: false
    };

    this.websocketService.startScraping(testConfig).subscribe(
      (response: any) => console.log('Scraping started:', response)
    );
  }

  stopScraping(): void {
    if (this.currentSessionId) {
      this.websocketService.stopScraping(this.currentSessionId).subscribe(
        (response: any) => {
          console.log('Scraping stopped:', response);
          this.scrapingProgress = null;
        }
      );
    }
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getProgressBarClass(status: string): string {
    return `progress-${status}`;
  }

  formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}