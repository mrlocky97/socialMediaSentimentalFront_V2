import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confidence-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confidence-container">
      @if (showLabel) {
        <span class="confidence-label">{{ label }}</span>
      }
      <div class="confidence-bar" [style.width]="width">
        <div 
          class="confidence-fill" 
          [style.width.%]="confidence * 100"
          [class]="getConfidenceClass()">
        </div>
      </div>
      @if (showValue) {
        <span class="confidence-value">{{ (confidence * 100) | number:'1.0-0' }}%</span>
      }
    </div>
  `,
  styles: [`
    .confidence-container {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .confidence-label {
      font-size: 0.875rem;
      color: #666;
      white-space: nowrap;
    }

    .confidence-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      flex: 1;
      min-width: 60px;
    }

    .confidence-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease, background-color 0.3s ease;
    }

    .confidence-high {
      background: linear-gradient(90deg, #66bb6a, #4caf50);
    }

    .confidence-medium {
      background: linear-gradient(90deg, #ffb74d, #ff9800);
    }

    .confidence-low {
      background: linear-gradient(90deg, #ef5350, #f44336);
    }

    .confidence-value {
      font-size: 0.875rem;
      color: #333;
      font-weight: 500;
      white-space: nowrap;
    }
  `]
})
export class ConfidenceBarComponent {
  @Input({ required: true }) confidence!: number; // 0-1 range
  @Input() label: string = 'Confidence:';
  @Input() showLabel: boolean = true;
  @Input() showValue: boolean = true;
  @Input() width: string = '100%';

  getConfidenceClass(): string {
    if (this.confidence >= 0.8) return 'confidence-high';
    if (this.confidence >= 0.5) return 'confidence-medium';
    return 'confidence-low';
  }
}
