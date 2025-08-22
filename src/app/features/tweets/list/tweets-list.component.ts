import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
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
  templateUrl: './tweets-list.component.html',
  styleUrls: ['./tweets-list.component.css']
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
