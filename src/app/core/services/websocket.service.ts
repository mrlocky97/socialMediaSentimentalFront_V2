import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, fromEvent, Observable, Subject, Subscription, timer } from 'rxjs';
import { catchError, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../enviroments/environment';
import { AuthService } from '../auth/services/auth.service';

// Import ScrapingProgress from scraping service
export interface ScrapingProgress {
  sessionId: string;
  status: 'starting' | 'processing' | 'paused' | 'completed' | 'error' | 'cancelled';
  totalTweets: number;
  processedTweets: number;
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  isBackground: boolean;
  startTime: Date;
  endTime?: Date;
  estimatedTimeRemaining?: number;
  error?: string;
  metadata?: {
    tweetsPerChunk?: number;
    processingRate?: number;
    lastProcessedTime?: Date;
  };
}

export interface WebSocketConfig {
  url: string;
  options?: {
    transports?: string[];
    timeout?: number;
    forceNew?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    auth?: {
      token?: string;
    };
  };
}

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts?: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private subscriptions = new Map<string, Subscription>();
  private reconnectTimer: Subscription | null = null;
  private lastTokenUsed: string | null = null;

  // Connection status
  private connectionStatus = new BehaviorSubject<ConnectionStatus>({
    connected: false,
  });

  // Scraping progress stream
  private scrapingProgress = new BehaviorSubject<ScrapingProgress | null>(null);

  constructor() {
    this.config = {
      url: environment.websocketUrl || 'http://localhost:3001',
      options: {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          token: this.authService.token() || '',
        },
      },
    };
  }

  /**
   * Initialize WebSocket connection
   */
  connect(): Observable<ConnectionStatus> {
    if (this.socket?.connected) {
      // Check if token has changed
      const currentToken = this.authService.token();
      if (currentToken !== this.lastTokenUsed) {
        console.log('🔄 Token changed, refreshing connection...');
        return this.refresh();
      }
      return this.connectionStatus.asObservable();
    }

    try {
      // Actualizar token en la configuración antes de conectar
      const currentToken = this.authService.token();
      if (!currentToken) {
        console.error('❌ No auth token available for WebSocket connection');
        this.updateConnectionStatus({
          connected: false,
          error: 'No authentication token available',
        });
        return this.connectionStatus.asObservable();
      }

      this.lastTokenUsed = currentToken;
      if (this.config.options?.auth) {
        this.config.options.auth.token = currentToken;
      }

      this.socket = io(this.config.url, this.config.options);
      this.setupEventListeners();

      return this.connectionStatus.asObservable();
    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
      this.updateConnectionStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      return this.connectionStatus.asObservable();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');

      // Clean up all subscriptions
      this.cleanupSubscriptions();

      // Stop reconnect timer
      if (this.reconnectTimer) {
        this.reconnectTimer.unsubscribe();
        this.reconnectTimer = null;
      }

      this.socket.disconnect();
      this.socket = null;
      this.updateConnectionStatus({ connected: false });
      this.scrapingProgress.next(null);
    }
  }

  /**
   * Refresh WebSocket connection with updated token
   */
  refresh(): Observable<ConnectionStatus> {
    console.log('🔄 Refreshing WebSocket connection...');

    // Disconnect first
    this.disconnect();

    // Small delay to ensure clean disconnection
    return timer(500).pipe(
      tap(() => this.connect()),
      switchMap(() => this.connectionStatus.asObservable())
    );
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status observable
   */
  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Get scraping progress observable
   */
  getScrapingProgress(): Observable<ScrapingProgress | null> {
    return this.scrapingProgress.asObservable();
  }

  /**
   * Subscribe to scraping progress for specific session
   */
  subscribeToScrapingProgress(sessionId: string): Observable<ScrapingProgress> {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    if (!sessionId) {
      console.error('❌ Session ID is required for scraping progress subscription');
      return EMPTY;
    }

    // Clean up existing subscription for this session
    this.unsubscribeFromScrapingProgress(sessionId);

    // Join scraping session room
    this.socket.emit('join-scraping-session', { sessionId });
    console.log(`🏢 Joined scraping session: ${sessionId}`);

    // Create observable for scraping progress events
    const progressObservable = fromEvent<ScrapingProgress>(this.socket, 'scraping-progress').pipe(
      filter((progress) => progress.sessionId === sessionId),
      tap((progress) => console.log(`📊 Progress for ${sessionId}:`, progress.percentage + '%')),
      takeUntil(this.destroy$),
      catchError((error) => {
        console.error('❌ Error in scraping progress stream:', error);
        return EMPTY;
      })
    );

    // Store subscription for cleanup
    const subscription = progressObservable.subscribe();
    this.subscriptions.set(`scraping-${sessionId}`, subscription);

    return progressObservable;
  }

  /**
   * Unsubscribe from scraping progress
   */
  unsubscribeFromScrapingProgress(sessionId: string): void {
    if (!sessionId) return;

    // Clean up subscription
    const subscriptionKey = `scraping-${sessionId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }

    // Leave room if socket is connected
    if (this.socket?.connected) {
      this.socket.emit('leave-scraping-session', { sessionId });
      console.log(`🚪 Left scraping session: ${sessionId}`);
    }
  }

  /**
   * Join campaign room (for your current backend implementation)
   */
  joinCampaign(campaignId: string): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket not connected. Cannot join campaign.');
      return;
    }

    if (!campaignId) {
      console.error('❌ Campaign ID is required');
      return;
    }

    console.log(`🏢 Joining campaign: ${campaignId}`);
    this.socket.emit('join-campaign', campaignId);
  }

  /**
   * Leave campaign room
   */
  leaveCampaign(campaignId: string): void {
    if (!this.socket?.connected || !campaignId) return;

    console.log(`🚪 Leaving campaign: ${campaignId}`);
    this.socket.emit('leave-campaign', campaignId);
  }

  /**
   * Start scraping via WebSocket
   */
  startScraping(config: any): Observable<any> {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    this.socket.emit('start-scraping', config);
    return fromEvent(this.socket, 'scraping-started').pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        console.error('❌ Error starting scraping:', error);
        return EMPTY;
      })
    );
  }

  /**
   * Stop scraping via WebSocket
   */
  stopScraping(sessionId: string): Observable<any> {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    if (!sessionId) {
      console.error('❌ Session ID is required to stop scraping');
      return EMPTY;
    }

    this.socket.emit('stop-scraping', { sessionId });
    return fromEvent(this.socket, 'scraping-stopped').pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        console.error('❌ Error stopping scraping:', error);
        return EMPTY;
      })
    );
  }

  /**
   * Pause scraping via WebSocket
   */
  pauseScraping(sessionId: string): Observable<any> {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    if (!sessionId) {
      console.error('❌ Session ID is required to pause scraping');
      return EMPTY;
    }

    this.socket.emit('pause-scraping', { sessionId });
    return fromEvent(this.socket, 'scraping-paused').pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        console.error('❌ Error pausing scraping:', error);
        return EMPTY;
      })
    );
  }

  /**
   * Resume scraping via WebSocket
   */
  resumeScraping(sessionId: string): Observable<any> {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    if (!sessionId) {
      console.error('❌ Session ID is required to resume scraping');
      return EMPTY;
    }

    this.socket.emit('resume-scraping', { sessionId });
    return fromEvent(this.socket, 'scraping-resumed').pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        console.error('❌ Error resuming scraping:', error);
        return EMPTY;
      })
    );
  }

  /**
   * Send generic message via WebSocket
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn(`⚠️ WebSocket not connected. Cannot emit event: ${event}`);
      return;
    }

    if (!event) {
      console.error('❌ Event name is required');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Listen for generic WebSocket events
   */
  on<T = any>(event: string): Observable<T> {
    if (!this.socket?.connected) {
      console.warn(`⚠️ WebSocket not connected. Cannot listen to event: ${event}`);
      return EMPTY;
    }

    if (!event) {
      console.error('❌ Event name is required');
      return EMPTY;
    }

    return fromEvent<T>(this.socket, event).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        console.error(`❌ Error in event stream for ${event}:`, error);
        return EMPTY;
      })
    );
  }

  /**
   * Send ping to test connection
   */
  ping(): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket not connected. Cannot send ping.');
      return;
    }

    console.log('🏓 Sending ping...');
    this.socket.emit('ping');
  }

  /**
   * Request user info
   */
  getUserInfo(): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket not connected. Cannot get user info.');
      return;
    }

    this.socket.emit('get-user-info');
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.updateConnectionStatus({
        connected: true,
        lastConnected: new Date(),
        reconnectAttempts: 0,
        error: undefined,
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.updateConnectionStatus({
        connected: false,
        error: `Disconnected: ${reason}`,
      });

      // Clear progress on disconnect
      this.scrapingProgress.next(null);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.updateConnectionStatus({
        connected: false,
        error: error.message || 'Connection error',
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
      this.updateConnectionStatus({
        connected: true,
        lastConnected: new Date(),
        reconnectAttempts: attemptNumber,
        error: undefined,
      });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ WebSocket reconnection error:', error);
      const currentStatus = this.connectionStatus.value;
      this.updateConnectionStatus({
        ...currentStatus,
        error: `Reconnection failed: ${error.message || 'Unknown error'}`,
        reconnectAttempts: (currentStatus.reconnectAttempts || 0) + 1,
      });
    });

    // Server confirmation events
    this.socket.on('connected', (data) => {
      console.log('📡 Server confirmation:', data);
    });

    this.socket.on('joined-campaign', (data) => {
      console.log('🏢 Joined campaign:', data);
    });

    this.socket.on('left-campaign', (data) => {
      console.log('🚪 Left campaign:', data);
    });

    // Scraping-specific events
    this.socket.on('scraping-progress', (progress: ScrapingProgress) => {
      console.log('📊 Scraping progress:', progress.percentage + '%');
      this.scrapingProgress.next(progress);
    });

    this.socket.on('scraping-completed', (result: any) => {
      console.log('✅ Scraping completed:', result);

      // Create final progress state
      const finalProgress: ScrapingProgress = {
        sessionId: result.sessionId || result.campaignId || '',
        status: 'completed',
        totalTweets: result.totalTweets || 0,
        processedTweets: result.totalTweets || 0,
        currentChunk: result.totalChunks || 1,
        totalChunks: result.totalChunks || 1,
        percentage: 100,
        isBackground: false,
        startTime: new Date(result.startTime || Date.now()),
        endTime: new Date(),
      };

      this.scrapingProgress.next(finalProgress);

      // Reset after a delay to allow UI to show completion
      timer(3000).subscribe(() => {
        this.scrapingProgress.next(null);
      });
    });

    this.socket.on('scraping-error', (error: any) => {
      console.error('❌ Scraping error:', error);

      // Emit error through progress stream
      const errorProgress: ScrapingProgress = {
        sessionId: error.sessionId || error.campaignId || '',
        status: 'error',
        totalTweets: error.totalTweets || 0,
        processedTweets: error.processedTweets || 0,
        currentChunk: 0,
        totalChunks: 0,
        percentage: 0,
        isBackground: false,
        startTime: new Date(error.startTime || Date.now()),
        endTime: new Date(),
        error: error.message || 'Unknown error occurred',
      };

      this.scrapingProgress.next(errorProgress);
    });

    // User info response
    this.socket.on('user-info', (data) => {
      console.log('👤 User info:', data);
    });

    // Ping/Pong
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    // Generic error handler
    this.socket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
    });
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    const currentStatus = this.connectionStatus.value;
    this.connectionStatus.next({
      ...currentStatus,
      ...status,
    });
  }

  /**
   * Clean up all subscriptions
   */
  private cleanupSubscriptions(): void {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
      console.log(`🧹 Cleaned up subscription: ${key}`);
    });
    this.subscriptions.clear();
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 WebSocketService destroying...');

    // Signal all observables to complete
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up subscriptions
    this.cleanupSubscriptions();

    // Disconnect socket
    this.disconnect();

    // Complete subjects
    this.connectionStatus.complete();
    this.scrapingProgress.complete();
  }
}
