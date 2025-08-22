import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

export type SentimentType = 'positive' | 'negative' | 'neutral';

@Component({
  selector: 'app-sentiment-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  templateUrl: './sentiment-badge.component.html',
  styleUrls: ['./sentiment-badge.component.css']
})
export class SentimentBadgeComponent {
  @Input({ required: true }) sentiment!: SentimentType;
  @Input() score?: number;
  @Input() showScore: boolean = false;
  @Input() disabled: boolean = false;

  getIcon(): string {
    const icons = {
      'positive': 'sentiment_satisfied',
      'negative': 'sentiment_dissatisfied',
      'neutral': 'sentiment_neutral'
    };
    return icons[this.sentiment];
  }

  getLabel(): string {
    const labels = {
      'positive': 'Positive',
      'negative': 'Negative',
      'neutral': 'Neutral'
    };
    return labels[this.sentiment];
  }
}
