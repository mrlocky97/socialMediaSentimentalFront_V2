import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

export type SentimentType = 'positive' | 'negative' | 'neutral';

@Component({
  selector: 'app-sentiment-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  template: `
    <mat-chip 
      [class]="'sentiment-badge sentiment-' + sentiment"
      [disabled]="disabled">
      <mat-icon>{{ getIcon() }}</mat-icon>
      <span>{{ getLabel() }}</span>
      @if (showScore && score !== undefined) {
        <span class="score">({{ (score * 100) | number:'1.0-0' }}%)</span>
      }
    </mat-chip>
  `,
  styles: [`
    .sentiment-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }

    .sentiment-positive {
      background: #e8f5e8 !important;
      color: #2e7d32 !important;
    }

    .sentiment-negative {
      background: #ffebee !important;
      color: #d32f2f !important;
    }

    .sentiment-neutral {
      background: #fff3e0 !important;
      color: #f57c00 !important;
    }

    .score {
      font-size: 0.75rem;
      opacity: 0.8;
      margin-left: 4px;
    }

    mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }
  `]
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
