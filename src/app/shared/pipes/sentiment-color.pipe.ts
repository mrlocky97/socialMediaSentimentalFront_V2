/* =====================================
   SENTIMENT COLOR PIPE
   Maps sentiment labels to Material theme colors
   ===================================== */

import { Pipe, PipeTransform } from '@angular/core';
import { ThemePalette } from '@angular/material/core';

@Pipe({
  name: 'sentimentColor',
  standalone: true
})
export class SentimentColorPipe implements PipeTransform {
  
  /**
   * Transform sentiment label to appropriate Material color
   * @param sentimentLabel - The sentiment label ('positive', 'negative', 'neutral', etc.)
   * @param returnType - Whether to return 'color' (ThemePalette) or 'class' (CSS class name)
   */
  transform(
    sentimentLabel: string | undefined, 
    returnType: 'color' | 'class' = 'color'
  ): ThemePalette | string {
    
    if (!sentimentLabel) {
      return returnType === 'color' ? 'accent' : 'sentiment-unknown';
    }

    const normalizedLabel = sentimentLabel.toLowerCase().trim();
    
    if (returnType === 'color') {
      switch (normalizedLabel) {
        case 'positive':
          return 'primary'; // Green theme
        case 'negative':
          return 'warn'; // Red theme
        case 'neutral':
          return 'accent'; // Blue/gray theme
        default:
          return 'accent'; // Default for unknown
      }
    } else {
      // Return CSS class names
      switch (normalizedLabel) {
        case 'positive':
          return 'sentiment-positive';
        case 'negative':
          return 'sentiment-negative';
        case 'neutral':
          return 'sentiment-neutral';
        default:
          return 'sentiment-unknown';
      }
    }
  }
}
