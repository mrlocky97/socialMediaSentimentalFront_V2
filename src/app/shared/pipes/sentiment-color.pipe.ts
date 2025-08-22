import { Pipe, PipeTransform } from '@angular/core';

export type SentimentType = 'positive' | 'negative' | 'neutral';

@Pipe({
  name: 'sentimentColor',
  standalone: true
})
export class SentimentColorPipe implements PipeTransform {

  transform(sentiment: SentimentType | string, variant: 'background' | 'text' | 'border' = 'text'): string {
    const colors = {
      positive: {
        background: '#e8f5e8',
        text: '#2e7d32',
        border: '#4caf50'
      },
      negative: {
        background: '#ffebee',
        text: '#d32f2f',
        border: '#f44336'
      },
      neutral: {
        background: '#fff3e0',
        text: '#f57c00',
        border: '#ff9800'
      }
    };

    const sentimentKey = sentiment as SentimentType;
    return colors[sentimentKey]?.[variant] || colors.neutral[variant];
  }
}
