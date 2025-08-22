import { Injectable, computed, signal } from '@angular/core';

export interface Tweet {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
  };
  createdAt: Date;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  hashtags: string[];
  mentions: string[];
  urls: string[];
  mediaUrls?: string[];
  campaignId?: string;
  isRetweet: boolean;
  retweetedTweet?: Tweet;
}

export interface TweetFilters {
  campaignId?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  hashtags?: string[];
  keywords?: string[];
  author?: string;
  hasMedia?: boolean;
  minLikes?: number;
  minRetweets?: number;
  sortBy?: 'createdAt' | 'likes' | 'retweets' | 'sentiment';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface TweetsState {
  items: Tweet[];
  total: number;
  filters: TweetFilters;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class TweetsStore {
  // Private signals for internal state management
  private readonly _items = signal<Tweet[]>([]);
  private readonly _total = signal<number>(0);
  private readonly _filters = signal<TweetFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 20
  });
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastUpdated = signal<Date | null>(null);

  // Public computed signals - readonly access for components
  readonly items = computed(() => this._items());
  readonly total = computed(() => this._total());
  readonly filters = computed(() => this._filters());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly lastUpdated = computed(() => this._lastUpdated());

  // Computed derived state
  readonly isEmpty = computed(() => this._items().length === 0);
  readonly hasItems = computed(() => this._items().length > 0);
  readonly totalPages = computed(() => {
    const pageSize = this._filters().pageSize || 20;
    return Math.ceil(this._total() / pageSize);
  });
  readonly currentPage = computed(() => this._filters().page || 1);
  readonly hasNextPage = computed(() => this.currentPage() < this.totalPages());
  readonly hasPreviousPage = computed(() => this.currentPage() > 1);
  
  // Sentiment analysis
  readonly sentimentCounts = computed(() => {
    const items = this._items();
    return {
      positive: items.filter(t => t.sentiment?.label === 'positive').length,
      negative: items.filter(t => t.sentiment?.label === 'negative').length,
      neutral: items.filter(t => t.sentiment?.label === 'neutral').length,
      unknown: items.filter(t => !t.sentiment).length
    };
  });

  readonly averageSentiment = computed(() => {
    const items = this._items().filter(t => t.sentiment);
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, t) => acc + (t.sentiment?.score || 0), 0);
    return sum / items.length;
  });

  // Top hashtags/mentions
  readonly topHashtags = computed(() => {
    const hashtagCounts = new Map<string, number>();
    this._items().forEach(tweet => {
      tweet.hashtags.forEach(hashtag => {
        hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1);
      });
    });
    
    return Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hashtag, count]) => ({ hashtag, count }));
  });

  readonly topMentions = computed(() => {
    const mentionCounts = new Map<string, number>();
    this._items().forEach(tweet => {
      tweet.mentions.forEach(mention => {
        mentionCounts.set(mention, (mentionCounts.get(mention) || 0) + 1);
      });
    });
    
    return Array.from(mentionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([mention, count]) => ({ mention, count }));
  });

  // Complete state as computed
  readonly state = computed<TweetsState>(() => ({
    items: this._items(),
    total: this._total(),
    filters: this._filters(),
    loading: this._loading(),
    error: this._error(),
    lastUpdated: this._lastUpdated()
  }));

  // Actions - methods that update the store state
  loadTweets(filters?: Partial<TweetFilters>) {
    this._loading.set(true);
    this._error.set(null);
    
    if (filters) {
      this._filters.update(current => ({ ...current, ...filters }));
    }

    // TODO: Replace with actual API call
    // For now, simulate API call
    setTimeout(() => {
      // Mock data - replace with actual service call
      const mockTweets: Tweet[] = this.generateMockTweets();
      
      this._items.set(mockTweets);
      this._total.set(mockTweets.length);
      this._loading.set(false);
      this._lastUpdated.set(new Date());
    }, 1000);
  }

  addTweets(tweets: Tweet[]) {
    this._items.update(current => [...current, ...tweets]);
    this._total.update(current => current + tweets.length);
    this._lastUpdated.set(new Date());
  }

  updateTweet(tweetId: string, updates: Partial<Tweet>) {
    this._items.update(current =>
      current.map(tweet =>
        tweet.id === tweetId ? { ...tweet, ...updates } : tweet
      )
    );
    this._lastUpdated.set(new Date());
  }

  removeTweet(tweetId: string) {
    this._items.update(current => current.filter(tweet => tweet.id !== tweetId));
    this._total.update(current => current - 1);
    this._lastUpdated.set(new Date());
  }

  updateFilters(filters: Partial<TweetFilters>) {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  clearFilters() {
    this._filters.set({
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      pageSize: 20
    });
  }

  setLoading(loading: boolean) {
    this._loading.set(loading);
  }

  setError(error: string | null) {
    this._error.set(error);
  }

  clearError() {
    this._error.set(null);
  }

  refresh() {
    this.loadTweets();
  }

  nextPage() {
    const currentPage = this.currentPage();
    if (this.hasNextPage()) {
      this.updateFilters({ page: currentPage + 1 });
      this.loadTweets();
    }
  }

  previousPage() {
    const currentPage = this.currentPage();
    if (this.hasPreviousPage()) {
      this.updateFilters({ page: currentPage - 1 });
      this.loadTweets();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.updateFilters({ page });
      this.loadTweets();
    }
  }

  // Private helper method - replace with actual data
  private generateMockTweets(): Tweet[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `tweet-${i + 1}`,
      text: `This is a sample tweet ${i + 1} about our campaign #sample #marketing`,
      author: {
        id: `user-${i + 1}`,
        username: `user${i + 1}`,
        displayName: `User ${i + 1}`,
        profileImageUrl: `https://picsum.photos/48/48?random=${i}`
      },
      createdAt: new Date(Date.now() - i * 1000 * 60 * 60), // Hours ago
      metrics: {
        likes: Math.floor(Math.random() * 100),
        retweets: Math.floor(Math.random() * 50),
        replies: Math.floor(Math.random() * 25),
        views: Math.floor(Math.random() * 1000)
      },
      sentiment: {
        score: Math.random() * 2 - 1, // -1 to 1
        label: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
        confidence: Math.random()
      },
      hashtags: ['sample', 'marketing'],
      mentions: ['@company'],
      urls: [],
      isRetweet: false
    }));
  }
}
