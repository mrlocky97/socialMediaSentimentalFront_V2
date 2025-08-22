import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { TweetsStore } from '../../../core/state/tweets.store';

@Component({
  selector: 'app-tweets-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  template: `
    <div class="tweets-container">
      <!-- Filters Section -->
      <mat-card class="filters-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>filter_list</mat-icon>
            Tweet Filters
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="filters-grid">
            <mat-form-field appearance="outline">
              <mat-label>Search</mat-label>
              <input matInput 
                     [(ngModel)]="searchTerm" 
                     placeholder="Search tweets..."
                     (input)="onSearchChange()">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sentiment</mat-label>
              <mat-select [(ngModel)]="selectedSentiment" (selectionChange)="onFiltersChange()">
                <mat-option value="">All Sentiments</mat-option>
                <mat-option value="positive">Positive</mat-option>
                <mat-option value="neutral">Neutral</mat-option>
                <mat-option value="negative">Negative</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sort By</mat-label>
              <mat-select [(ngModel)]="sortBy" (selectionChange)="onFiltersChange()">
                <mat-option value="createdAt">Date</mat-option>
                <mat-option value="likes">Likes</mat-option>
                <mat-option value="retweets">Retweets</mat-option>
                <mat-option value="sentiment">Sentiment</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="filter-actions">
              <button mat-raised-button color="primary" (click)="onRefresh()">
                <mat-icon>refresh</mat-icon>
                Refresh
              </button>
              <button mat-button (click)="onClearFilters()">
                Clear Filters
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Stats Section -->
      <div class="stats-grid">
        <div class="stat-card positive">
          <div class="stat-value">{{ tweetMetrics().positive }}</div>
          <div class="stat-label">Positive</div>
        </div>
        <div class="stat-card neutral">
          <div class="stat-value">{{ tweetMetrics().neutral }}</div>
          <div class="stat-label">Neutral</div>
        </div>
        <div class="stat-card negative">
          <div class="stat-value">{{ tweetMetrics().negative }}</div>
          <div class="stat-label">Negative</div>
        </div>
        <div class="stat-card total">
          <div class="stat-value">{{ totalTweets() }}</div>
          <div class="stat-label">Total Tweets</div>
        </div>
      </div>

      <!-- Tweets List -->
      <div class="tweets-list">
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Loading tweets...</p>
          </div>
        } @else if (isEmpty()) {
          <div class="empty-container">
            <mat-icon>article</mat-icon>
            <h3>No tweets found</h3>
            <p>Try adjusting your filters or refresh the data.</p>
            <button mat-raised-button color="primary" (click)="onRefresh()">
              Refresh Tweets
            </button>
          </div>
        } @else {
          @for (tweet of tweets(); track tweet.id) {
            <mat-card class="tweet-card">
              <mat-card-header>
                <div mat-card-avatar class="tweet-avatar">
                  @if (tweet.author.profileImageUrl) {
                    <img [src]="tweet.author.profileImageUrl" [alt]="tweet.author.displayName">
                  } @else {
                    <mat-icon>person</mat-icon>
                  }
                </div>
                <mat-card-title>{{ tweet.author.displayName }}</mat-card-title>
                <mat-card-subtitle>
                  &#64;{{ tweet.author.username }} • {{ tweet.createdAt | date:'short' }}
                </mat-card-subtitle>
                
                @if (tweet.sentiment) {
                  <div class="sentiment-indicator" [class]="'sentiment-' + tweet.sentiment.label">
                    <mat-icon>{{ getSentimentIcon(tweet.sentiment.label) }}</mat-icon>
                    <span>{{ tweet.sentiment.label | titlecase }}</span>
                  </div>
                }
              </mat-card-header>

              <mat-card-content>
                <p class="tweet-text">{{ tweet.text }}</p>
                
                @if (tweet.hashtags.length > 0) {
                  <div class="hashtags">
                    @for (hashtag of tweet.hashtags; track hashtag) {
                      <mat-chip class="hashtag-chip">#{{ hashtag }}</mat-chip>
                    }
                  </div>
                }

                @if (tweet.mentions.length > 0) {
                  <div class="mentions">
                    @for (mention of tweet.mentions; track mention) {
                      <mat-chip class="mention-chip">{{ mention }}</mat-chip>
                    }
                  </div>
                }
              </mat-card-content>

              <mat-card-actions>
                <div class="tweet-metrics">
                  <span class="metric">
                    <mat-icon>favorite_border</mat-icon>
                    {{ tweet.metrics.likes | number }}
                  </span>
                  <span class="metric">
                    <mat-icon>repeat</mat-icon>
                    {{ tweet.metrics.retweets | number }}
                  </span>
                  <span class="metric">
                    <mat-icon>chat_bubble_outline</mat-icon>
                    {{ tweet.metrics.replies | number }}
                  </span>
                  @if (tweet.metrics.views) {
                    <span class="metric">
                      <mat-icon>visibility</mat-icon>
                      {{ tweet.metrics.views | number }}
                    </span>
                  }
                </div>

                <div class="tweet-actions">
                  <button mat-icon-button>
                    <mat-icon>share</mat-icon>
                  </button>
                  <button mat-icon-button>
                    <mat-icon>bookmark_border</mat-icon>
                  </button>
                </div>
              </mat-card-actions>
            </mat-card>
          }

          <!-- Pagination -->
          <mat-paginator 
            [length]="totalTweets()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageIndex]="currentPage() - 1"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .tweets-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: end;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      padding: 16px;
      text-align: center;
      border-radius: 8px;
      color: white;
    }

    .stat-card.positive { background: #4caf50; }
    .stat-card.neutral { background: #ff9800; }
    .stat-card.negative { background: #f44336; }
    .stat-card.total { background: #2196f3; }

    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .loading-container, .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 24px;
      text-align: center;
    }

    .empty-container mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .tweet-card {
      margin-bottom: 16px;
    }

    .tweet-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e0e0e0;
    }

    .tweet-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sentiment-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-left: auto;
    }

    .sentiment-positive {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .sentiment-negative {
      background: #ffebee;
      color: #d32f2f;
    }

    .sentiment-neutral {
      background: #fff3e0;
      color: #f57c00;
    }

    .tweet-text {
      margin: 16px 0;
      line-height: 1.5;
    }

    .hashtags, .mentions {
      margin: 8px 0;
    }

    .hashtag-chip {
      background: #e3f2fd;
      color: #1976d2;
      margin-right: 4px;
    }

    .mention-chip {
      background: #f3e5f5;
      color: #7b1fa2;
      margin-right: 4px;
    }

    .tweet-metrics {
      display: flex;
      gap: 16px;
      flex: 1;
    }

    .metric {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      font-size: 0.875rem;
    }

    .metric mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .tweet-actions {
      display: flex;
      gap: 4px;
    }
  `]
})
export class TweetsListComponent implements OnInit {
  private tweetsStore = inject(TweetsStore);

  // Computed signals from store
  readonly tweets = computed(() => this.tweetsStore.items());
  readonly isLoading = computed(() => this.tweetsStore.loading());
  readonly isEmpty = computed(() => this.tweetsStore.isEmpty());
  readonly totalTweets = computed(() => this.tweetsStore.total());
  readonly tweetMetrics = computed(() => this.tweetsStore.sentimentCounts());
  readonly currentPage = computed(() => this.tweetsStore.currentPage());

  // Filter state
  searchTerm = '';
  selectedSentiment = '';
  sortBy = 'createdAt';
  pageSize = 25;

  ngOnInit(): void {
    // Load initial data
    this.tweetsStore.loadTweets();
  }

  // Actions
  onSearchChange(): void {
    this.debounceSearch();
  }

  onFiltersChange(): void {
    this.applyFilters();
  }

  onClearFilters(): void {
    this.searchTerm = '';
    this.selectedSentiment = '';
    this.sortBy = 'createdAt';
    this.tweetsStore.clearFilters();
    this.tweetsStore.loadTweets();
  }

  onRefresh(): void {
    this.tweetsStore.refresh();
  }

  onPageChange(event: any): void {
    this.tweetsStore.goToPage(event.pageIndex + 1);
  }

  // Utility methods
  getSentimentIcon(sentiment: string): string {
    const icons = {
      'positive': 'sentiment_satisfied',
      'negative': 'sentiment_dissatisfied',
      'neutral': 'sentiment_neutral'
    };
    return icons[sentiment as keyof typeof icons] || 'help';
  }

  // Private methods
  private debounceSearch(): void {
    // Simple debounce implementation
    setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  private applyFilters(): void {
    const filters: any = {
      sortBy: this.sortBy as any,
      sortOrder: 'desc' as any
    };

    if (this.searchTerm) {
      filters.keywords = [this.searchTerm];
    }

    if (this.selectedSentiment) {
      filters.sentiment = this.selectedSentiment as any;
    }

    this.tweetsStore.updateFilters(filters);
    this.tweetsStore.loadTweets();
  }
}
