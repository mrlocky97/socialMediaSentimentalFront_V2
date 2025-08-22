import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {

  transform(
    value: string, 
    limit: number = 100, 
    completeWords: boolean = true, 
    ellipsis: string = '...'
  ): string {
    if (!value || value.length <= limit) {
      return value;
    }

    if (completeWords) {
      // Find the last space within the limit
      const truncated = value.substring(0, limit);
      const lastSpace = truncated.lastIndexOf(' ');
      
      if (lastSpace > 0) {
        return value.substring(0, lastSpace) + ellipsis;
      }
    }

    return value.substring(0, limit) + ellipsis;
  }
}
