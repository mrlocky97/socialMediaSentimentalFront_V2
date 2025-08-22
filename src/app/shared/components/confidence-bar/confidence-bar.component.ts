import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-confidence-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confidence-bar.component.html',
  styleUrls: ['./confidence-bar.component.css'],
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
