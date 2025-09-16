/**
 * Scraping Service
 * Handles the orchestration of scraping operations for campaigns
 * Optimized for Angular 20 with better error handling and performance
 */

import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Observable,
  OperatorFunction,
  Subject,
  catchError,
  concatMap,
  delay,
  finalize,
  from,
  map,
  of,
  retryWhen,
  takeUntil,
  tap,
  throwError,
  timeout,
  timer
} from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { chunk, toStringArray } from '../../shared/utils/string-array.util';
import { AsyncScrapingRequest, AsyncScrapingResponse, ChunkProgress, ScrapingCompletedResult, ScrapingProgress, ScrapingProgressUpdate } from '../interfaces/scraping.interface';
import { BackendApiService, BulkScrapeSummary, ScrapeOpts } from './backend-api.service';
import { Campaign } from './data-manager.service';
import { WebSocketService } from './websocket.service';


@Injectable({
  providedIn: 'root',
})
export class ScrapingService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  // Default scrape options
  private readonly DEFAULT_SCRAPE_LIMIT = 30;
  private readonly DEFAULT_SCRAPE_OPTIONS: ScrapeOpts = {
    limit: this.DEFAULT_SCRAPE_LIMIT,
    includeReplies: false,
    analyzeSentiment: true,
  };

  // Timeout configuration based on tweet count
  private readonly TIMEOUT_CONFIG = {
    small: { maxTweets: 100, timeout: 300000 }, // 5 minutos
    medium: { maxTweets: 500, timeout: 600000 }, // 10 minutos
    large: { maxTweets: Infinity, timeout: 1200000 }, // 20 minutos
  };

  // Retry configuration for 429 errors
  private readonly RETRY_CONFIG = {
    maxRetries: 3,
    backoffDelays: [1000, 2000, 4000], // 1s, 2s, 4s
  };

  // Large request threshold
  private readonly LARGE_REQUEST_THRESHOLD = 200;

  // Scraping state management - using signals for better change detection
  private scrapingProgress = signal<ScrapingProgress>({
    hashtags: { completed: 0, total: 0, inProgress: false },
    search: { completed: 0, total: 0, inProgress: false },
    users: { completed: 0, total: 0, inProgress: false },
    metrics: { totalScraped: 0, saved: 0, errors: 0, retryAttempts: 0 },
    status: 'idle',
    progress: 0,
  });

  // Public observable for components to subscribe to
  public scrapingProgress$ = this.scrapingProgress.asReadonly();

  // Cancellation token for ongoing operations
  private stopScraping$ = new Subject<void>();

  // Start time for ETA calculation
  private startTime?: Date;

  constructor(private apiService: BackendApiService, private websocketService: WebSocketService) {}

  /**
   * Start scraping for a campaign
   * @param campaign - Campaign to scrape data for
   * @returns Observable that completes when scraping is done
   */
  public startScraping(campaign: Campaign): Observable<boolean> {
    // Reset state
    this.stopScraping$.next();
    this.resetProgress();
    this.startTime = new Date();

    // Process campaign data
    const hashtags = toStringArray(campaign.hashtags, { stripPrefix: '#' });
    const keywords = toStringArray(campaign.keywords);
    const mentions = toStringArray(campaign.mentions, { stripPrefix: '@' });

    // Calculate total tweets for timeout and chunking
    const totalTweets = campaign.maxTweets || this.DEFAULT_SCRAPE_LIMIT;
    const isLargeRequest = totalTweets > this.LARGE_REQUEST_THRESHOLD;

    // Show message for large requests
    if (isLargeRequest) {
      this.showLargeRequestMessage(totalTweets);
    }

    // Create chunks for processing in batches
    const hashtagChunks = chunk(hashtags, 5);
    const keywordChunks = chunk(keywords, 5);
    const mentionChunks = chunk(mentions, 5);

    // Set initial progress state
    this.updateProgressState({
      hashtags: {
        completed: 0,
        total: hashtagChunks.length,
        inProgress: false,
        chunkProgress: this.getChunkProgress(hashtagChunks.length),
      },
      search: {
        completed: 0,
        total: keywordChunks.length,
        inProgress: false,
        chunkProgress: this.getChunkProgress(keywordChunks.length),
      },
      users: {
        completed: 0,
        total: mentionChunks.length,
        inProgress: false,
        chunkProgress: this.getChunkProgress(mentionChunks.length),
      },
      status: 'running',
      progress: 0,
      isLargeRequest,
      currentMessage: isLargeRequest
        ? 'Procesando solicitud grande en chunks...'
        : 'Iniciando scraping...',
    });

    // Prepare scraping options with dynamic timeout
    const scrapeOpts: ScrapeOpts = {
      ...this.DEFAULT_SCRAPE_OPTIONS,
      campaignId: campaign.id,
      language: campaign.languages?.[0] ?? 'es', // Use first language or default to Spanish
      limit: totalTweets,
    };

    const timeoutMs = this.getDynamicTimeout(totalTweets);

    // Determine total operations for progress calculation
    const totalOperations = hashtagChunks.length + keywordChunks.length + mentionChunks.length;
    let completedOperations = 0;

    // Chain all operations in sequence with delay between each
    const scraping$ = this.processChunks(
      hashtagChunks,
      keywordChunks,
      mentionChunks,
      scrapeOpts,
      timeoutMs,
      totalOperations,
      completedOperations
    );

    // Return the observable for the component to subscribe to
    return scraping$.pipe(
      takeUntilDestroyed(this.destroyRef),
      map(() => true),
      catchError((error) => {
        console.error('Scraping error:', error);
        this.updateProgressState({
          status: 'error',
          currentMessage: `Error en scraping: ${error.message || 'Error desconocido'}`,
        });
        return of(false);
      }),
      // Make sure state is reset if the observable is completed
      finalize(() => {
        // If not already completed or errored, set to idle
        if (this.scrapingProgress().status === 'running') {
          this.updateProgressState({ status: 'idle' });
        }
      })
    );
  }

  /**
   * Process chunks of data for scraping
   */
  private processChunks(
    hashtagChunks: string[][],
    keywordChunks: string[][],
    mentionChunks: string[][],
    scrapeOpts: ScrapeOpts,
    timeoutMs: number,
    totalOperations: number,
    completedOperations: number
  ): Observable<boolean> {
    return from(hashtagChunks).pipe(
      this.processChunkType(
        'hashtags',
        'Procesando hashtags',
        this.apiService.scrapeHashtags.bind(this.apiService),
        scrapeOpts,
        timeoutMs,
        totalOperations,
        completedOperations
      ),
      concatMap(() =>
        from(keywordChunks).pipe(
          this.processChunkType(
            'search',
            'Procesando keywords',
            this.apiService.scrapeSearch.bind(this.apiService),
            scrapeOpts,
            timeoutMs,
            totalOperations,
            completedOperations
          )
        )
      ),
      concatMap(() =>
        from(mentionChunks).pipe(
          this.processChunkType(
            'users',
            'Procesando usuarios',
            this.apiService.scrapeUsers.bind(this.apiService),
            scrapeOpts,
            timeoutMs,
            totalOperations,
            completedOperations
          )
        )
      ),
      concatMap(() => {
        this.updateProgressState({
          status: 'completed',
          currentMessage: 'Scraping completado exitosamente',
          estimatedTimeRemaining: 0,
        });
        this.snackBar.open('Scraping completed successfully', 'Close', { duration: 3000 });

        // Start polling for tweets and campaign updates
        return this.startTweetPolling(scrapeOpts.campaignId!);
      }),
      // Allow for cancellation
      takeUntil(this.stopScraping$)
    );
  }

  /**
   * Process a specific type of chunk (hashtags, keywords, mentions)
   */
  private processChunkType(
    type: 'hashtags' | 'search' | 'users',
    messagePrefix: string,
    apiMethod: (chunk: string[], opts: ScrapeOpts) => Observable<any>,
    scrapeOpts: ScrapeOpts,
    timeoutMs: number,
    totalOperations: number,
    completedOperations: number
  ): OperatorFunction<string[], boolean> {
    return concatMap((chunk: string[], index: number) => {
      this.updateProgressState({
        [type]: {
          inProgress: true,
          completed: index,
          total: this.scrapingProgress()[type].total,
          chunkProgress: this.getChunkProgress(chunk.length, index + 1),
        },
        currentMessage: `${messagePrefix} - chunk ${index + 1} de ${chunk.length}`,
      });

      return this.makeRequestWithRetry(() => apiMethod(chunk, scrapeOpts), timeoutMs).pipe(
        tap((result: any) => this.processScrapingResult(result as BulkScrapeSummary)),
        catchError((err) => {
          this.handleScrapingError(type, err);
          return of({ success: false, data: { items: [], totalTweets: 0 }, message: err.message });
        }),
        finalize(() => {
          completedOperations++;
          const progress = Math.round((completedOperations / totalOperations) * 100);
          this.updateProgressState({
            [type]: {
              completed: index + 1,
              inProgress: false,
              total: this.scrapingProgress()[type].total,
            },
            progress,
            estimatedTimeRemaining: this.calculateETA(progress),
          });
        }),
        // Add delay between chunks to respect rate limits
        delay(2000),
        map(() => true)
      );
    });
  }

  /**
   * Poll for tweets and campaign updates after scraping is complete
   * @param campaignId - ID of the campaign to poll for
   * @returns Observable that completes after the polling period
   */
  private startTweetPolling(campaignId: string): Observable<boolean> {
    // Poll every 5s for 60s total (12 polls)
    const pollCount = 12;
    let currentPoll = 0;

    return timer(0, 5000).pipe(
      takeUntil(this.stopScraping$),
      concatMap(() => {
        currentPoll++;
        // Get tweets for this campaign
        return this.apiService.getCampaignTweets(campaignId, { limit: 100 }).pipe(
          tap((tweets) => {
            console.log(`Poll ${currentPoll}/${pollCount}: Found ${tweets.length} tweets`);
          }),
          catchError((err) => {
            console.error('Error polling tweets:', err);
            return of([]);
          })
        );
      }),
      // Stop after pollCount iterations
      takeUntil(timer(pollCount * 5000 + 1000)),
      // Return true when complete
      map(() => true),
      finalize(() => {
        console.log('Tweet polling complete');
      })
    );
  }

  /**
   * Cancel any ongoing scraping operations
   */
  public cancelScraping(): void {
    this.stopScraping$.next();
    this.resetProgress();
  }

  /**
   * Reset the progress state
   */
  private resetProgress(): void {
    this.scrapingProgress.set({
      hashtags: { completed: 0, total: 0, inProgress: false },
      search: { completed: 0, total: 0, inProgress: false },
      users: { completed: 0, total: 0, inProgress: false },
      metrics: { totalScraped: 0, saved: 0, errors: 0, retryAttempts: 0 },
      status: 'idle',
      progress: 0,
    });
  }

  /**
   * Update part of the progress state
   */
  private updateProgressState(update: Partial<ScrapingProgress>): void {
    const currentState = this.scrapingProgress();

    this.scrapingProgress.set({
      ...currentState,
      hashtags: {
        ...currentState.hashtags,
        ...(update.hashtags || {}),
      },
      search: {
        ...currentState.search,
        ...(update.search || {}),
      },
      users: {
        ...currentState.users,
        ...(update.users || {}),
      },
      metrics: {
        ...currentState.metrics,
        ...(update.metrics || {}),
      },
      status: update.status || currentState.status,
      progress: update.progress !== undefined ? update.progress : currentState.progress,
      currentMessage:
        update.currentMessage !== undefined ? update.currentMessage : currentState.currentMessage,
      estimatedTimeRemaining:
        update.estimatedTimeRemaining !== undefined
          ? update.estimatedTimeRemaining
          : currentState.estimatedTimeRemaining,
      isLargeRequest:
        update.isLargeRequest !== undefined ? update.isLargeRequest : currentState.isLargeRequest,
      backgroundMode:
        update.backgroundMode !== undefined ? update.backgroundMode : currentState.backgroundMode,
    });
  }

  /**
   * Process results from a scraping operation and update metrics
   */
  private processScrapingResult(result: BulkScrapeSummary): void {
    if (!result.success || !result.data || !result.data.items) {
      return;
    }

    // Update metrics
    const currentMetrics = this.scrapingProgress().metrics;
    let totalScraped = 0;
    let saved = 0;
    let errors = 0;

    result.data.items.forEach((item) => {
      totalScraped += item.totalScraped || 0;
      saved += item.saved || 0;
      errors += item.errors?.length || 0;
    });

    this.updateProgressState({
      metrics: {
        totalScraped: currentMetrics.totalScraped + totalScraped,
        saved: currentMetrics.saved + saved,
        errors: currentMetrics.errors + errors,
        retryAttempts: currentMetrics.retryAttempts,
      },
    });

    // Show success toast if we have results
    if (totalScraped > 0) {
      this.snackBar.open(`Scraped ${totalScraped} items, saved ${saved}`, 'Close', {
        duration: 2000,
      });
    }
  }

  /**
   * Handle errors during scraping
   */
  private handleScrapingError(type: 'hashtags' | 'search' | 'users', error: any): void {
    console.error(`Error scraping ${type}:`, error);

    // In case of mockData=true in environment, don't break the flow
    if (environment.features.mockData) {
      this.snackBar.open(`Error scraping ${type}, continuing with mock data`, 'Close', {
        duration: 3000,
      });
    } else {
      this.snackBar.open(`Error scraping ${type}: ${error.message || 'Unknown error'}`, 'Close', {
        duration: 5000,
      });
    }
  }

  /**
   * Get dynamic timeout based on tweet count
   * Formula: 5min mínimo + 3s por tweet
   */
  private getDynamicTimeout(maxTweets: number): number {
    const timeoutMs = Math.max(300000, maxTweets * 3000); // 5min mínimo + 3s por tweet
    return timeoutMs;
  }

  /**
   * Make HTTP request with retry logic for 429 errors
   */
  private makeRequestWithRetry<T>(
    requestFn: () => Observable<T>,
    timeoutMs: number
  ): Observable<T> {
    return requestFn().pipe(
      timeout(timeoutMs),
      retryWhen((errors) =>
        errors.pipe(
          concatMap((error: any, index) => {
            const retryAttempt = index + 1;

            // Only retry on 429 errors and within retry limit
            if (error.status === 429 && retryAttempt <= this.RETRY_CONFIG.maxRetries) {
              const delayMs = this.RETRY_CONFIG.backoffDelays[index] || 4000;

              // Update state to show retry
              this.updateProgressState({
                status: 'retrying',
                currentMessage: `Rate limit alcanzado. Reintentando en ${
                  delayMs / 1000
                }s... (${retryAttempt}/${this.RETRY_CONFIG.maxRetries})`,
                metrics: {
                  ...this.scrapingProgress().metrics,
                  retryAttempts: this.scrapingProgress().metrics.retryAttempts + 1,
                },
              });

              this.snackBar.open(
                `Reintentando... (${retryAttempt}/${this.RETRY_CONFIG.maxRetries})`,
                'Close',
                { duration: delayMs }
              );

              return timer(delayMs);
            }

            // Don't retry for other errors or if max retries exceeded
            return throwError(() => error);
          })
        )
      ),
      tap(() => {
        // Reset status if successful after retry
        if (this.scrapingProgress().status === 'retrying') {
          this.updateProgressState({
            status: 'running',
            currentMessage: 'Continuando scraping...',
          });
        }
      })
    );
  }

  /**
   * Calculate chunk progress information
   */
  private getChunkProgress(totalChunks: number, currentChunk: number = 0): ChunkProgress {
    return {
      current: currentChunk,
      total: totalChunks,
      isChunked: totalChunks > 1,
    };
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateETA(currentProgress: number): number {
    if (!this.startTime || currentProgress === 0) {
      return 0;
    }

    const elapsed = (new Date().getTime() - this.startTime.getTime()) / 1000; // segundos
    const progressFraction = currentProgress / 100;
    const totalEstimated = elapsed / progressFraction;
    const remaining = Math.max(0, totalEstimated - elapsed);

    return Math.round(remaining);
  }

  /**
   * Show message for large requests with background option
   */
  private showLargeRequestMessage(totalTweets: number): void {
    const message = `Procesando solicitud grande (${totalTweets} tweets). Esto puede tardar más tiempo pero será más confiable.`;

    const snackBarRef = this.snackBar.open(message, 'Continuar en Background', {
      duration: 10000,
      panelClass: ['large-request-snackbar'],
    });

    snackBarRef.onAction().subscribe(() => {
      this.updateProgressState({
        backgroundMode: true,
        currentMessage: 'Procesando en background...',
      });

      this.snackBar.open('Scraping continúa en background. Puedes navegar libremente.', 'OK', {
        duration: 5000,
      });
    });
  }

  /**
   * Enable background mode for large requests
   */
  public enableBackgroundMode(): void {
    this.updateProgressState({
      backgroundMode: true,
      currentMessage: 'Procesando en background...',
    });
  }

  /**
   * Disable background mode
   */
  public disableBackgroundMode(): void {
    this.updateProgressState({
      backgroundMode: false,
    });
  }

  /**
   * Get formatted ETA string
   */
  public getFormattedETA(): string {
    const eta = this.scrapingProgress().estimatedTimeRemaining;
    if (!eta || eta === 0) {
      return '';
    }

    if (eta < 60) {
      return `${eta}s restantes`;
    } else if (eta < 3600) {
      const minutes = Math.floor(eta / 60);
      const seconds = eta % 60;
      return `${minutes}m ${seconds}s restantes`;
    } else {
      const hours = Math.floor(eta / 3600);
      const minutes = Math.floor((eta % 3600) / 60);
      return `${hours}h ${minutes}m restantes`;
    }
  }

  // ================================
  // ASYNC WEBSOCKET SCRAPING METHODS
  // ================================

  /**
   * Start asynchronous scraping using WebSockets for real-time updates
   * @param request - Async scraping request configuration
   * @returns Observable with the initial response
   */
  public startAsyncScraping(request: AsyncScrapingRequest): Observable<AsyncScrapingResponse> {
    console.log('Starting async scraping:', request);

    // First ensure WebSocket is connected
    if (!this.websocketService.isConnected()) {
      return this.websocketService.connect().pipe(
        concatMap(() => this.initiateAsyncScraping(request)),
        catchError((error) => {
          console.error('WebSocket connection failed:', error);
          this.snackBar.open('Error connecting to real-time updates', 'Close', { duration: 5000 });
          return throwError(() => error);
        })
      );
    }

    return this.initiateAsyncScraping(request);
  }

  /**
   * Initiate the async scraping request
   */
  private initiateAsyncScraping(request: AsyncScrapingRequest): Observable<AsyncScrapingResponse> {
    // Build the request payload
    const payload = {
      campaignId: request.campaignId,
      type: request.hashtag ? 'hashtag' : request.keywords ? 'keyword' : 'mention',
      hashtag: request.hashtag,
      keywords: request.keywords,
      mentions: request.mentions,
      maxTweets: request.maxTweets,
      language: request.language || 'es',
      includeReplies: request.includeReplies || false,
      analyzeSentiment: request.analyzeSentiment || true,
      async: true, // Force async mode
    };

    // Send async scraping request via HTTP
    return this.apiService
      .scrapeHashtags([request.hashtag || ''], {
        ...payload,
        limit: request.maxTweets,
      } as ScrapeOpts)
      .pipe(
        map((response: any) => {
          const asyncResponse: AsyncScrapingResponse = {
            sessionId: response.sessionId || `session-${Date.now()}`,
            campaignId: request.campaignId,
            status: 'queued',
            estimatedDuration: this.estimateScrapingDuration(request.maxTweets),
            message: 'Scraping request queued for processing',
          };

          // Subscribe to WebSocket updates for this session
          this.subscribeToScrapingUpdates(asyncResponse.sessionId, request.campaignId);

          return asyncResponse;
        }),
        catchError((error) => {
          console.error('Error starting async scraping:', error);
          this.snackBar.open('Error starting async scraping', 'Close', { duration: 5000 });
          return throwError(() => error);
        })
      );
  }

  /**
   * Subscribe to WebSocket updates for a scraping session
   */
  private subscribeToScrapingUpdates(sessionId: string, campaignId: string): void {
    console.log(`Subscribing to updates for session: ${sessionId}`);

    // Join the scraping session room
    this.websocketService.emit('join-campaign', campaignId);

    // Listen for progress updates
    this.websocketService
      .on<ScrapingProgressUpdate>('scraping-progress')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((progress) => {
        if (progress.sessionId === sessionId) {
          console.log('Progress update:', progress);
          this.handleAsyncProgressUpdate(progress);
        }
      });

    // Listen for completion
    this.websocketService
      .on<ScrapingCompletedResult>('scraping-completed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result.sessionId === sessionId) {
          console.log('Scraping completed:', result);
          this.handleAsyncScrapingCompleted(result);
        }
      });

    // Listen for errors
    this.websocketService
      .on<any>('scraping-error')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => {
        if (error.sessionId === sessionId) {
          console.error('Scraping error:', error);
          this.handleAsyncScrapingError(error);
        }
      });
  }

  /**
   * Handle async scraping progress updates
   */
  private handleAsyncProgressUpdate(progress: ScrapingProgressUpdate): void {
    // Update local progress state
    this.updateProgressState({
      status: 'running',
      progress: progress.percentage,
      currentMessage: progress.message,
      estimatedTimeRemaining: progress.estimatedTimeRemaining,
      metrics: {
        ...this.scrapingProgress().metrics,
        totalScraped: progress.scrapedTweets,
      },
    });

    // Show progress notification
    if (progress.percentage % 25 === 0) {
      // Every 25%
      this.snackBar.open(
        `Scraping progress: ${progress.percentage}% (${progress.scrapedTweets}/${progress.totalTweets})`,
        'Close',
        { duration: 2000 }
      );
    }
  }

  /**
   * Handle async scraping completion
   */
  private handleAsyncScrapingCompleted(result: ScrapingCompletedResult): void {
    console.log('🎉 Async scraping completed:', result);

    // Update progress to completed
    this.updateProgressState({
      status: 'completed',
      progress: 100,
      currentMessage: `Scraping completed! Found ${result.tweetsCount} tweets`,
      estimatedTimeRemaining: 0,
      metrics: {
        ...this.scrapingProgress().metrics,
        totalScraped: result.summary.totalScraped,
        saved: result.summary.saved,
        errors: result.summary.errors,
      },
    });

    // Show completion notification
    this.snackBar
      .open(`Scraping completed! Found ${result.tweetsCount} tweets`, 'View Results', {
        duration: 10000,
        panelClass: ['success-snackbar'],
      })
      .onAction()
      .subscribe(() => {
        // Navigate to campaign details or refresh data
        this.refreshCampaignData(result.campaignId);
      });

    // Auto-refresh campaign data
    this.refreshCampaignData(result.campaignId);
  }

  /**
   * Handle async scraping errors
   */
  private handleAsyncScrapingError(error: any): void {
    console.error('Async scraping error:', error);

    this.updateProgressState({
      status: 'error',
      currentMessage: `Error: ${error.message || 'Unknown error occurred'}`,
      metrics: {
        ...this.scrapingProgress().metrics,
        errors: this.scrapingProgress().metrics.errors + 1,
      },
    });

    this.snackBar.open(`Scraping error: ${error.message || 'Unknown error'}`, 'Retry', {
      duration: 8000,
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * Refresh campaign data after scraping completion
   */
  private refreshCampaignData(campaignId: string): void {
    console.log('Refreshing campaign data for:', campaignId);

    // Get updated campaign data
    this.apiService
      .getCampaignTweets(campaignId, { limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tweets) => {
          console.log(`Campaign ${campaignId} now has ${tweets.length} tweets`);

          // Emit event for other components to refresh
          this.websocketService.emit('campaign-data-refreshed', {
            campaignId,
            tweetsCount: tweets.length,
            refreshedAt: new Date(),
          });
        },
        error: (error) => {
          console.error('Error refreshing campaign data:', error);
        },
      });
  }

  /**
   * Estimate scraping duration based on tweet count
   */
  private estimateScrapingDuration(maxTweets: number): number {
    // Base estimation: ~2 seconds per tweet for small batches, less for large batches
    if (maxTweets <= 50) {
      return maxTweets * 2; // 2 seconds per tweet
    } else if (maxTweets <= 200) {
      return 100 + (maxTweets - 50) * 1.5; // 1.5 seconds per tweet after first 50
    } else {
      return 325 + (maxTweets - 200) * 1; // 1 second per tweet after first 200
    }
  }

  /**
   * Get campaign tweets (helper method)
   */
  public getCampaignTweets(campaignId: string): Observable<any[]> {
    return this.apiService.getCampaignTweets(campaignId, { limit: 1000 });
  }

  /**
   * Check if request should use async mode
   */
  public shouldUseAsyncMode(maxTweets: number): boolean {
    return maxTweets > 50; // Use async for more than 50 tweets
  }

  /**
   * Join a campaign room for real-time updates
   */
  public joinCampaign(campaignId: string): void {
    if (this.websocketService.isConnected()) {
      this.websocketService.emit('join-campaign', campaignId);
      console.log(`Joined campaign room: ${campaignId}`);
    }
  }

  /**
   * Leave a campaign room
   */
  public leaveCampaign(campaignId: string): void {
    if (this.websocketService.isConnected()) {
      this.websocketService.emit('leave-campaign', campaignId);
      console.log(`Left campaign room: ${campaignId}`);
    }
  }
}
