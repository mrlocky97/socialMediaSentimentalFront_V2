import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { SentimentBadgeComponent } from '../sentiment-badge/sentiment-badge.component';

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
  isRetweet: boolean;
}

@Component({
  selector: 'app-tweet-card',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule,
    SentimentBadgeComponent
  ],
  template: `
    <mat-card class="tweet-card" [class.selected]="selected">
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

        <div class="header-actions">
          @if (tweet.sentiment && showSentiment) {
            <app-sentiment-badge 
              [sentiment]="tweet.sentiment.label"
              [score]="tweet.sentiment.score"
              [showScore]="showSentimentScore">
            </app-sentiment-badge>
          }

          @if (showActions) {
            <button mat-icon-button (click)="onActionClick('menu', $event)">
              <mat-icon>more_vert</mat-icon>
            </button>
          }
        </div>
      </mat-card-header>

      <mat-card-content (click)="onTweetClick()">
        @if (tweet.isRetweet) {
          <div class="retweet-indicator">
            <mat-icon>repeat</mat-icon>
            <span>Retweeted</span>
          </div>
        }

        <p class="tweet-text" [class.truncated]="truncateText && tweet.text.length > maxTextLength">
          {{ truncateText && tweet.text.length > maxTextLength 
             ? (tweet.text | slice:0:maxTextLength) + '...' 
             : tweet.text }}
        </p>

        @if (truncateText && tweet.text.length > maxTextLength && !showFullText) {
          <button mat-button color="primary" class="show-more-btn" (click)="toggleFullText($event)">
            Show more
          </button>
        }

        @if (tweet.hashtags.length > 0 && showHashtags) {
          <div class="hashtags">
            @for (hashtag of tweet.hashtags; track hashtag) {
              <mat-chip class="hashtag-chip" (click)="onHashtagClick(hashtag, $event)">
                #{{ hashtag }}
              </mat-chip>
            }
          </div>
        }

        @if (tweet.mentions.length > 0 && showMentions) {
          <div class="mentions">
            @for (mention of tweet.mentions; track mention) {
              <mat-chip class="mention-chip" (click)="onMentionClick(mention, $event)">
                {{ mention }}
              </mat-chip>
            }
          </div>
        }

        @if (tweet.mediaUrls && tweet.mediaUrls.length > 0 && showMedia) {
          <div class="media-container">
            @for (mediaUrl of tweet.mediaUrls; track mediaUrl) {
              <img [src]="mediaUrl" class="media-image" (click)="onMediaClick(mediaUrl, $event)">
            }
          </div>
        }
      </mat-card-content>

      @if (showMetrics) {
        <mat-card-actions>
          <div class="tweet-metrics">
            <button mat-icon-button (click)="onActionClick('like', $event)" [class.active]="isLiked">
              <mat-icon>{{ isLiked ? 'favorite' : 'favorite_border' }}</mat-icon>
              <span>{{ tweet.metrics.likes | number }}</span>
            </button>

            <button mat-icon-button (click)="onActionClick('retweet', $event)" [class.active]="isRetweeted">
              <mat-icon>repeat</mat-icon>
              <span>{{ tweet.metrics.retweets | number }}</span>
            </button>

            <button mat-icon-button (click)="onActionClick('reply', $event)">
              <mat-icon>chat_bubble_outline</mat-icon>
              <span>{{ tweet.metrics.replies | number }}</span>
            </button>

            @if (tweet.metrics.views) {
              <span class="metric-views">
                <mat-icon>visibility</mat-icon>
                <span>{{ tweet.metrics.views | number }}</span>
              </span>
            }
          </div>

          <div class="card-actions">
            <button mat-icon-button (click)="onActionClick('share', $event)">
              <mat-icon>share</mat-icon>
            </button>
            <button mat-icon-button (click)="onActionClick('bookmark', $event)" [class.active]="isBookmarked">
              <mat-icon>{{ isBookmarked ? 'bookmark' : 'bookmark_border' }}</mat-icon>
            </button>
          </div>
        </mat-card-actions>
      }
    </mat-card>
  `,
  styles: [`
    .tweet-card {
      margin-bottom: 16px;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .tweet-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.12);
      transform: translateY(-1px);
    }

    .tweet-card.selected {
      border: 2px solid #1976d2;
    }

    .tweet-avatar {
      width: 48px;
      height: 48px;
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .retweet-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #1976d2;
      font-size: 0.875rem;
      margin-bottom: 8px;
    }

    .retweet-indicator mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .tweet-text {
      margin: 12px 0;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .tweet-text.truncated {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .show-more-btn {
      padding: 0;
      min-width: auto;
      height: auto;
      font-size: 0.875rem;
    }

    .hashtags, .mentions {
      margin: 8px 0;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .hashtag-chip {
      background: #e3f2fd !important;
      color: #1976d2 !important;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .mention-chip {
      background: #f3e5f5 !important;
      color: #7b1fa2 !important;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .media-container {
      margin: 12px 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .media-image {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
      cursor: pointer;
      object-fit: cover;
    }

    .tweet-metrics {
      display: flex;
      gap: 8px;
      flex: 1;
    }

    .tweet-metrics button {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      transition: color 0.2s;
    }

    .tweet-metrics button:hover {
      color: #1976d2;
    }

    .tweet-metrics button.active {
      color: #1976d2;
    }

    .tweet-metrics button span {
      font-size: 0.875rem;
    }

    .metric-views {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      font-size: 0.875rem;
      margin-left: auto;
    }

    .metric-views mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .card-actions {
      display: flex;
      gap: 4px;
    }
  `]
})
export class TweetCardComponent {
  @Input({ required: true }) tweet!: Tweet;
  @Input() selected: boolean = false;
  @Input() showSentiment: boolean = true;
  @Input() showSentimentScore: boolean = false;
  @Input() showActions: boolean = true;
  @Input() showMetrics: boolean = true;
  @Input() showHashtags: boolean = true;
  @Input() showMentions: boolean = true;
  @Input() showMedia: boolean = true;
  @Input() truncateText: boolean = false;
  @Input() maxTextLength: number = 280;
  @Input() isLiked: boolean = false;
  @Input() isRetweeted: boolean = false;
  @Input() isBookmarked: boolean = false;

  @Output() tweetClick = new EventEmitter<Tweet>();
  @Output() actionClick = new EventEmitter<{action: string, tweet: Tweet, event: Event}>();
  @Output() hashtagClick = new EventEmitter<{hashtag: string, tweet: Tweet, event: Event}>();
  @Output() mentionClick = new EventEmitter<{mention: string, tweet: Tweet, event: Event}>();
  @Output() mediaClick = new EventEmitter<{mediaUrl: string, tweet: Tweet, event: Event}>();

  showFullText = false;

  onTweetClick(): void {
    this.tweetClick.emit(this.tweet);
  }

  onActionClick(action: string, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit({ action, tweet: this.tweet, event });
  }

  onHashtagClick(hashtag: string, event: Event): void {
    event.stopPropagation();
    this.hashtagClick.emit({ hashtag, tweet: this.tweet, event });
  }

  onMentionClick(mention: string, event: Event): void {
    event.stopPropagation();
    this.mentionClick.emit({ mention, tweet: this.tweet, event });
  }

  onMediaClick(mediaUrl: string, event: Event): void {
    event.stopPropagation();
    this.mediaClick.emit({ mediaUrl, tweet: this.tweet, event });
  }

  toggleFullText(event: Event): void {
    event.stopPropagation();
    this.showFullText = !this.showFullText;
  }
}
