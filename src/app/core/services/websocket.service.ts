import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, fromEvent, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../enviroments/environment';

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
  };
}

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  
  // Connection status
  private connectionStatus = new BehaviorSubject<ConnectionStatus>({
    connected: false
  });

  // Scraping progress stream
  private scrapingProgress = new BehaviorSubject<ScrapingProgress | null>(null);
  
  constructor() {
    this.config = {
      url: environment.websocketUrl || 'http://localhost:3000',
      options: {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      }
    };
  }

  /**
   * Initialize WebSocket connection
   */
  connect(): Observable<ConnectionStatus> {
    if (this.socket?.connected) {
      return this.connectionStatus.asObservable();
    }

    try {
      this.socket = io(this.config.url, this.config.options);
      this.setupEventListeners();
      
      return this.connectionStatus.asObservable();
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.updateConnectionStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
      return this.connectionStatus.asObservable();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.updateConnectionStatus({ connected: false });
    }
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
    if (!this.socket) {
      console.warn('WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    // Join scraping session room
    this.socket.emit('join-scraping-session', { sessionId });

    // Return observable for scraping progress events
    return fromEvent<ScrapingProgress>(this.socket, 'scraping-progress');
  }

  /**
   * Unsubscribe from scraping progress
   */
  unsubscribeFromScrapingProgress(sessionId: string): void {
    if (this.socket) {
      this.socket.emit('leave-scraping-session', { sessionId });
    }
  }

  /**
   * Start scraping via WebSocket
   */
  startScraping(config: any): Observable<any> {
    if (!this.socket) {
      console.warn('WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    this.socket.emit('start-scraping', config);
    return fromEvent(this.socket, 'scraping-started');
  }

  /**
   * Stop scraping via WebSocket
   */
  stopScraping(sessionId: string): Observable<any> {
    if (!this.socket) {
      console.warn('WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    this.socket.emit('stop-scraping', { sessionId });
    return fromEvent(this.socket, 'scraping-stopped');
  }

  /**
   * Pause scraping via WebSocket
   */
  pauseScraping(sessionId: string): Observable<any> {
    if (!this.socket) {
      console.warn('WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    this.socket.emit('pause-scraping', { sessionId });
    return fromEvent(this.socket, 'scraping-paused');
  }

  /**
   * Resume scraping via WebSocket
   */
  resumeScraping(sessionId: string): Observable<any> {
    if (!this.socket) {
      console.warn('WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    this.socket.emit('resume-scraping', { sessionId });
    return fromEvent(this.socket, 'scraping-resumed');
  }

  /**
   * Send generic message via WebSocket
   */
  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected. Call connect() first.');
    }
  }

  /**
   * Listen for generic WebSocket events
   */
  on<T = any>(event: string): Observable<T> {
    if (!this.socket) {
      console.warn('WebSocket not connected. Call connect() first.');
      return EMPTY;
    }

    return fromEvent<T>(this.socket, event);
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.updateConnectionStatus({
        connected: true,
        lastConnected: new Date(),
        reconnectAttempts: 0
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.updateConnectionStatus({
        connected: false,
        error: `Disconnected: ${reason}`
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.updateConnectionStatus({
        connected: false,
        error: error.message
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.updateConnectionStatus({
        connected: true,
        lastConnected: new Date(),
        reconnectAttempts: attemptNumber
      });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      const currentStatus = this.connectionStatus.value;
      this.updateConnectionStatus({
        ...currentStatus,
        error: `Reconnection failed: ${error.message}`,
        reconnectAttempts: (currentStatus.reconnectAttempts || 0) + 1
      });
    });

    // Scraping-specific events
    this.socket.on('scraping-progress', (progress: ScrapingProgress) => {
      this.scrapingProgress.next(progress);
    });

    this.socket.on('scraping-completed', (result: any) => {
      console.log('Scraping completed:', result);
      this.scrapingProgress.next(null); // Reset progress
    });

    this.socket.on('scraping-error', (error: any) => {
      console.error('Scraping error:', error);
      // Emit error through progress stream
      const errorProgress: ScrapingProgress = {
        sessionId: error.sessionId || '',
        status: 'error',
        totalTweets: 0,
        processedTweets: 0,
        currentChunk: 0,
        totalChunks: 0,
        percentage: 0,
        isBackground: false,
        startTime: new Date(),
        error: error.message
      };
      this.scrapingProgress.next(errorProgress);
    });
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    const currentStatus = this.connectionStatus.value;
    this.connectionStatus.next({
      ...currentStatus,
      ...status
    });
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.disconnect();
    this.connectionStatus.complete();
    this.scrapingProgress.complete();
  }
}