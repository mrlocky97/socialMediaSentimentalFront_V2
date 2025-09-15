/**
 * Scraping Service
 * Handles the orchestration of scraping operations for campaigns
 */

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, Subject, catchError, concatMap, delay, finalize, from, map, of, retryWhen, takeUntil, tap, throwError, timeout, timer } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { chunk, toStringArray } from '../../shared/utils/string-array.util';
import { BackendApiService, BulkScrapeSummary, ScrapeOpts } from './backend-api.service';
import { Campaign } from './data-manager.service';

export interface ChunkProgress {
  current: number;
  total: number;
  isChunked: boolean;
}

export interface ScrapingProgress {
  hashtags: {
    completed: number;
    total: number;
    inProgress: boolean;
    chunkProgress?: ChunkProgress;
  };
  search: {
    completed: number;
    total: number;
    inProgress: boolean;
    chunkProgress?: ChunkProgress;
  };
  users: {
    completed: number;
    total: number;
    inProgress: boolean;
    chunkProgress?: ChunkProgress;
  };
  metrics: {
    totalScraped: number;
    saved: number;
    errors: number;
    retryAttempts: number;
  };
  status: 'idle' | 'running' | 'completed' | 'error' | 'retrying';
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // en segundos
  currentMessage?: string;
  isLargeRequest?: boolean;
  backgroundMode?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScrapingService {
  // Default scrape options
  private readonly DEFAULT_SCRAPE_LIMIT = 30;
  private readonly DEFAULT_SCRAPE_OPTIONS: ScrapeOpts = {
    limit: this.DEFAULT_SCRAPE_LIMIT,
    includeReplies: false,
    analyzeSentiment: true
  };

  // Timeout configuration based on tweet count
  private readonly TIMEOUT_CONFIG = {
    small: { maxTweets: 100, timeout: 300000 },   // 30 segundos
    medium: { maxTweets: 500, timeout: 600000 },  // 60 segundos
    large: { maxTweets: Infinity, timeout: 1200000 } // 120 segundos
  };

  // Retry configuration for 429 errors
  private readonly RETRY_CONFIG = {
    maxRetries: 3,
    backoffDelays: [1000, 2000, 4000] // 1s, 2s, 4s
  };

  // Large request threshold
  private readonly LARGE_REQUEST_THRESHOLD = 200;
  
  // Scraping state management
  private scrapingProgress = new BehaviorSubject<ScrapingProgress>({
    hashtags: { completed: 0, total: 0, inProgress: false },
    search: { completed: 0, total: 0, inProgress: false },
    users: { completed: 0, total: 0, inProgress: false },
    metrics: { totalScraped: 0, saved: 0, errors: 0, retryAttempts: 0 },
    status: 'idle',
    progress: 0
  });
  
  // Cancellation token for ongoing operations
  private stopScraping$ = new Subject<void>();

  // Public observable for components to subscribe to
  public scrapingProgress$ = this.scrapingProgress.asObservable();

  // Start time for ETA calculation
  private startTime?: Date;

  constructor(
    private apiService: BackendApiService,
    private snackBar: MatSnackBar
  ) {}

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
        chunkProgress: this.getChunkProgress(hashtagChunks.length)
      },
      search: { 
        completed: 0, 
        total: keywordChunks.length, 
        inProgress: false,
        chunkProgress: this.getChunkProgress(keywordChunks.length)
      },
      users: { 
        completed: 0, 
        total: mentionChunks.length, 
        inProgress: false,
        chunkProgress: this.getChunkProgress(mentionChunks.length)
      },
      status: 'running',
      progress: 0,
      isLargeRequest,
      currentMessage: isLargeRequest ? 'Procesando solicitud grande en chunks...' : 'Iniciando scraping...'
    });

    // Prepare scraping options with dynamic timeout
    const scrapeOpts: ScrapeOpts = {
      ...this.DEFAULT_SCRAPE_OPTIONS,
      campaignId: campaign.id,
      language: campaign.languages?.[0] ?? 'es', // Use first language or default to Spanish
      limit: totalTweets
    };

    const timeout = this.getDynamicTimeout(totalTweets);

    // Determine total operations for progress calculation
    const totalOperations = hashtagChunks.length + keywordChunks.length + mentionChunks.length;
    let completedOperations = 0;

    // Chain all operations in sequence with delay between each
    // Start with hashtags
    const scraping$ = from(hashtagChunks).pipe(
      // Process each hashtag chunk
      concatMap((hashtagChunk, index) => {
        this.updateProgressState({
          hashtags: { 
            inProgress: true,
            completed: index,
            total: this.scrapingProgress.value.hashtags.total,
            chunkProgress: this.getChunkProgress(hashtagChunks.length, index + 1)
          },
          currentMessage: `Procesando hashtags - chunk ${index + 1} de ${hashtagChunks.length}`
        });
        
        return this.makeRequestWithRetry(
          () => this.apiService.scrapeHashtags(hashtagChunk, scrapeOpts),
          timeout
        ).pipe(
          tap((result: any) => this.processScrapingResult(result as BulkScrapeSummary)),
          catchError(err => {
            this.handleScrapingError('hashtags', err);
            return of({ success: false, data: { items: [], totalTweets: 0 }, message: err.message });
          }),
          finalize(() => {
            completedOperations++;
            const progress = Math.round((completedOperations / totalOperations) * 100);
            this.updateProgressState({
              hashtags: { 
                completed: index + 1,
                inProgress: false,
                total: this.scrapingProgress.value.hashtags.total
              },
              progress,
              estimatedTimeRemaining: this.calculateETA(progress)
            });
          }),
          // Add delay between chunks to respect rate limits
          delay(2000)
        );
      }),
      
      // Then process search/keywords
      concatMap(() => from(keywordChunks).pipe(
        concatMap((keywordChunk, index) => {
          this.updateProgressState({
            search: { 
              inProgress: true,
              completed: index,
              total: this.scrapingProgress.value.search.total,
              chunkProgress: this.getChunkProgress(keywordChunks.length, index + 1)
            },
            currentMessage: `Procesando keywords - chunk ${index + 1} de ${keywordChunks.length}`
          });
          
          return this.makeRequestWithRetry(
            () => this.apiService.scrapeSearch(keywordChunk, scrapeOpts),
            timeout
          ).pipe(
            tap((result: any) => this.processScrapingResult(result as BulkScrapeSummary)),
            catchError(err => {
              this.handleScrapingError('search', err);
              return of({ success: false, data: { items: [], totalTweets: 0 }, message: err.message });
            }),
            finalize(() => {
              completedOperations++;
              const progress = Math.round((completedOperations / totalOperations) * 100);
              this.updateProgressState({
                search: { 
                  completed: index + 1,
                  inProgress: false,
                  total: this.scrapingProgress.value.search.total
                },
                progress,
                estimatedTimeRemaining: this.calculateETA(progress)
              });
            }),
            delay(2000)
          );
        })
      )),
      
      // Finally process user mentions
      concatMap(() => from(mentionChunks).pipe(
        concatMap((mentionChunk, index) => {
          this.updateProgressState({
            users: { 
              inProgress: true,
              completed: index,
              total: this.scrapingProgress.value.users.total,
              chunkProgress: this.getChunkProgress(mentionChunks.length, index + 1)
            },
            currentMessage: `Procesando usuarios - chunk ${index + 1} de ${mentionChunks.length}`
          });
          
          return this.makeRequestWithRetry(
            () => this.apiService.scrapeUsers(mentionChunk, scrapeOpts),
            timeout
          ).pipe(
            tap((result: any) => this.processScrapingResult(result as BulkScrapeSummary)),
            catchError(err => {
              this.handleScrapingError('users', err);
              return of({ success: false, data: { items: [], totalTweets: 0 }, message: err.message });
            }),
            finalize(() => {
              completedOperations++;
              const progress = Math.round((completedOperations / totalOperations) * 100);
              this.updateProgressState({
                users: { 
                  completed: index + 1,
                  inProgress: false,
                  total: this.scrapingProgress.value.users.total
                },
                progress,
                estimatedTimeRemaining: this.calculateETA(progress)
              });
            }),
            delay(2000)
          );
        })
      )),
      
      // Start polling for updates when all scraping is complete
      concatMap(() => {
        this.updateProgressState({ 
          status: 'completed',
          currentMessage: 'Scraping completado exitosamente',
          estimatedTimeRemaining: 0
        });
        this.snackBar.open('Scraping completed successfully', 'Close', { duration: 3000 });
        
        // Start polling for tweets and campaign updates
        return this.startTweetPolling(campaign.id);
      }),
      
      // Allow for cancellation
      takeUntil(this.stopScraping$)
    );

    // Return the observable for the component to subscribe to
    return scraping$.pipe(
      map(() => true),
      catchError(error => {
        console.error('Scraping error:', error);
        this.updateProgressState({ 
          status: 'error',
          currentMessage: `Error en scraping: ${error.message || 'Error desconocido'}`
        });
        return of(false);
      }),
      // Make sure state is reset if the observable is completed
      finalize(() => {
        // If not already completed or errored, set to idle
        if (this.scrapingProgress.value.status === 'running') {
          this.updateProgressState({ status: 'idle' });
        }
      })
    );
  }

  /**
   * Poll for tweets and campaign updates after scraping is complete
   * @param campaignId - ID of the campaign to poll for
   * @returns Observable that completes after the polling period
   */
  private startTweetPolling(campaignId: string): Observable<any> {
    // Poll every 5s for 60s total (12 polls)
    const pollCount = 12;
    let currentPoll = 0;
    
    return timer(0, 5000).pipe(
      takeUntil(this.stopScraping$),
      concatMap(() => {
        currentPoll++;
        // Get tweets for this campaign
        return this.apiService.getCampaignTweets(campaignId, { limit: 100 }).pipe(
          tap(tweets => {
            console.log(`Poll ${currentPoll}/${pollCount}: Found ${tweets.length} tweets`);
          }),
          catchError(err => {
            console.error('Error polling tweets:', err);
            return of([]);
          })
        );
      }),
      // Stop after pollCount iterations
      takeUntil(timer(pollCount * 5000 + 1000)),
      // For implementation simplicity, we're just returning true at the end
      // In a real app, we might return the final tweets or some analytics
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
    this.scrapingProgress.next({
      hashtags: { completed: 0, total: 0, inProgress: false },
      search: { completed: 0, total: 0, inProgress: false },
      users: { completed: 0, total: 0, inProgress: false },
      metrics: { totalScraped: 0, saved: 0, errors: 0, retryAttempts: 0 },
      status: 'idle',
      progress: 0
    });
  }
  
  /**
   * Update part of the progress state
   */
  private updateProgressState(update: Partial<ScrapingProgress>): void {
    const currentState = this.scrapingProgress.value;
    
    this.scrapingProgress.next({
      ...currentState,
      hashtags: {
        ...currentState.hashtags,
        ...(update.hashtags || {})
      },
      search: {
        ...currentState.search,
        ...(update.search || {})
      },
      users: {
        ...currentState.users,
        ...(update.users || {})
      },
      metrics: {
        ...currentState.metrics,
        ...(update.metrics || {})
      },
      status: update.status || currentState.status,
      progress: update.progress !== undefined ? update.progress : currentState.progress
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
    const currentMetrics = this.scrapingProgress.value.metrics;
    let totalScraped = 0;
    let saved = 0;
    let errors = 0;
    
    result.data.items.forEach(item => {
      totalScraped += item.totalScraped || 0;
      saved += item.saved || 0;
      errors += (item.errors?.length || 0);
    });
    
    this.updateProgressState({
      metrics: {
        totalScraped: currentMetrics.totalScraped + totalScraped,
        saved: currentMetrics.saved + saved,
        errors: currentMetrics.errors + errors,
        retryAttempts: currentMetrics.retryAttempts
      }
    });
    
    // Show success toast if we have results
    if (totalScraped > 0) {
      this.snackBar.open(`Scraped ${totalScraped} items, saved ${saved}`, 'Close', { duration: 2000 });
    }
  }
  
  /**
   * Handle errors during scraping
   */
  private handleScrapingError(type: 'hashtags' | 'search' | 'users', error: any): void {
    console.error(`Error scraping ${type}:`, error);
    
    // In case of mockData=true in environment, don't break the flow
    if (environment.features.mockData) {
      this.snackBar.open(`Error scraping ${type}, continuing with mock data`, 'Close', { duration: 3000 });
    } else {
      this.snackBar.open(`Error scraping ${type}: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
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
      retryWhen(errors =>
        errors.pipe(
          concatMap((error: any, index) => {
            const retryAttempt = index + 1;
            
            // Only retry on 429 errors and within retry limit
            if (error.status === 429 && retryAttempt <= this.RETRY_CONFIG.maxRetries) {
              const delay = this.RETRY_CONFIG.backoffDelays[index] || 4000;
              
              // Update state to show retry
              this.updateProgressState({
                status: 'retrying',
                currentMessage: `Rate limit alcanzado. Reintentando en ${delay/1000}s... (${retryAttempt}/${this.RETRY_CONFIG.maxRetries})`,
                metrics: {
                  ...this.scrapingProgress.value.metrics,
                  retryAttempts: this.scrapingProgress.value.metrics.retryAttempts + 1
                }
              });

              this.snackBar.open(
                `Reintentando... (${retryAttempt}/${this.RETRY_CONFIG.maxRetries})`,
                'Close',
                { duration: delay }
              );

              return timer(delay);
            }
            
            // Don't retry for other errors or if max retries exceeded
            return throwError(() => error);
          })
        )
      ),
      tap(() => {
        // Reset status if successful after retry
        if (this.scrapingProgress.value.status === 'retrying') {
          this.updateProgressState({
            status: 'running',
            currentMessage: 'Continuando scraping...'
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
      isChunked: totalChunks > 1
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
    
    const snackBarRef = this.snackBar.open(
      message,
      'Continuar en Background',
      { 
        duration: 10000,
        panelClass: ['large-request-snackbar']
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.updateProgressState({
        backgroundMode: true,
        currentMessage: 'Procesando en background...'
      });
      
      this.snackBar.open(
        'Scraping continúa en background. Puedes navegar libremente.',
        'OK',
        { duration: 5000 }
      );
    });
  }

  /**
   * Enable background mode for large requests
   */
  public enableBackgroundMode(): void {
    this.updateProgressState({
      backgroundMode: true,
      currentMessage: 'Procesando en background...'
    });
  }

  /**
   * Disable background mode
   */
  public disableBackgroundMode(): void {
    this.updateProgressState({
      backgroundMode: false
    });
  }

  /**
   * Get formatted ETA string
   */
  public getFormattedETA(): string {
    const eta = this.scrapingProgress.value.estimatedTimeRemaining;
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
}
