/**
 * Scraping Service
 * Handles the orchestration of scraping operations for campaigns
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, catchError, concatMap, delay, finalize, from, map, of, takeUntil, tap, timer } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { BackendApiService, BulkScrapeSummary, ScrapeItemSummary, ScrapeOpts } from './backend-api.service';
import { Campaign } from './data-manager.service';
import { toStringArray, chunk } from '../../shared/utils/string-array.util';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ScrapingProgress {
  hashtags: {
    completed: number;
    total: number;
    inProgress: boolean;
  };
  search: {
    completed: number;
    total: number;
    inProgress: boolean;
  };
  users: {
    completed: number;
    total: number;
    inProgress: boolean;
  };
  metrics: {
    totalScraped: number;
    saved: number;
    errors: number;
  };
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number; // 0-100
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
  
  // Scraping state management
  private scrapingProgress = new BehaviorSubject<ScrapingProgress>({
    hashtags: { completed: 0, total: 0, inProgress: false },
    search: { completed: 0, total: 0, inProgress: false },
    users: { completed: 0, total: 0, inProgress: false },
    metrics: { totalScraped: 0, saved: 0, errors: 0 },
    status: 'idle',
    progress: 0
  });
  
  // Cancellation token for ongoing operations
  private stopScraping$ = new Subject<void>();

  // Public observable for components to subscribe to
  public scrapingProgress$ = this.scrapingProgress.asObservable();

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
    
    // Process campaign data
    const hashtags = toStringArray(campaign.hashtags, { stripPrefix: '#' });
    const keywords = toStringArray(campaign.keywords);
    const mentions = toStringArray(campaign.mentions, { stripPrefix: '@' });

    // Create chunks for processing in batches
    const hashtagChunks = chunk(hashtags, 5);
    const keywordChunks = chunk(keywords, 5);
    const mentionChunks = chunk(mentions, 5);

    // Set initial progress state
    this.updateProgressState({
      hashtags: { completed: 0, total: hashtagChunks.length, inProgress: false },
      search: { completed: 0, total: keywordChunks.length, inProgress: false },
      users: { completed: 0, total: mentionChunks.length, inProgress: false },
      status: 'running',
      progress: 0
    });

    // Prepare scraping options
    const scrapeOpts: ScrapeOpts = {
      ...this.DEFAULT_SCRAPE_OPTIONS,
      campaignId: campaign.id,
      language: campaign.languages?.[0] ?? 'es' // Use first language or default to Spanish
    };

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
            total: this.scrapingProgress.value.hashtags.total
          }
        });
        
        return this.apiService.scrapeHashtags(hashtagChunk, scrapeOpts).pipe(
          tap(result => this.processScrapingResult(result)),
          catchError(err => {
            this.handleScrapingError('hashtags', err);
            return of({ success: false, data: { items: [], totalTweets: 0 }, message: err.message });
          }),
          finalize(() => {
            completedOperations++;
            this.updateProgressState({
              hashtags: { 
                completed: index + 1,
                inProgress: false,
                total: this.scrapingProgress.value.hashtags.total
              },
              progress: Math.round((completedOperations / totalOperations) * 100)
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
              total: this.scrapingProgress.value.search.total
            }
          });
          
          return this.apiService.scrapeSearch(keywordChunk, scrapeOpts).pipe(
            tap(result => this.processScrapingResult(result)),
            catchError(err => {
              this.handleScrapingError('search', err);
              return of({ success: false, data: { items: [], totalTweets: 0 }, message: err.message });
            }),
            finalize(() => {
              completedOperations++;
              this.updateProgressState({
                search: { 
                  completed: index + 1,
                  inProgress: false,
                  total: this.scrapingProgress.value.search.total
                },
                progress: Math.round((completedOperations / totalOperations) * 100)
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
              total: this.scrapingProgress.value.users.total
            }
          });
          
          return this.apiService.scrapeUsers(mentionChunk, scrapeOpts).pipe(
            tap(result => this.processScrapingResult(result)),
            catchError(err => {
              this.handleScrapingError('users', err);
              return of({ success: false, data: { items: [], totalTweets: 0 }, message: err.message });
            }),
            finalize(() => {
              completedOperations++;
              this.updateProgressState({
                users: { 
                  completed: index + 1,
                  inProgress: false,
                  total: this.scrapingProgress.value.users.total
                },
                progress: Math.round((completedOperations / totalOperations) * 100)
              });
            }),
            delay(2000)
          );
        })
      )),
      
      // Start polling for updates when all scraping is complete
      concatMap(() => {
        this.updateProgressState({ status: 'completed' });
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
        this.updateProgressState({ status: 'error' });
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
      metrics: { totalScraped: 0, saved: 0, errors: 0 },
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
        errors: currentMetrics.errors + errors
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
}
