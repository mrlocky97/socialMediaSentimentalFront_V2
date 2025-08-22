import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
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
  templateUrl: './tweet-card.component.html',
  styleUrls: ['./tweet-card.component.css'],
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
