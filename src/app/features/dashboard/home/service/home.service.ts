import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  // Método para formatear números
  formatNumber(value: number): string {
    if (value == null) return '0';
    return value.toLocaleString();
  }

  // Método para obtener la clase de sentimiento
  getSentimentIcon(avgSentiment: number): string {
    if (avgSentiment >= 0.66) {
      return 'sentiment_very_satisfied';
    } else if (avgSentiment >= 0.33) {
      return 'sentiment_neutral';
    } else {
      return 'sentiment_very_dissatisfied';
    }
  }

  // Método para obtener el color del sentimiento
  getSentimentColor(score: number): string {
    const s = Number.isFinite(score) ? score : 0;
    if (s > 0.3) return '#2e7d32'; // green
    if (s > -0.3) return '#f57c00'; // orange / amber
    return '#d32f2f'; // red
  }
}