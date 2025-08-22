import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface SentimentResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  emotions?: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
  };
}

@Component({
  selector: 'app-analyze-text',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './analyze-text.component.html',
  styleUrls: ['./analyze-text.component.css']
})
export class AnalyzeTextComponent {
  // Internal state signals
  private readonly _inputText = signal<string>('');
  private readonly _isAnalyzing = signal<boolean>(false);
  private readonly _result = signal<SentimentResult | null>(null);
  private readonly _error = signal<string | null>(null);

  // Public computed signals
  readonly inputTextValue = computed(() => this._inputText());
  readonly isAnalyzing = computed(() => this._isAnalyzing());
  readonly result = computed(() => this._result());
  readonly error = computed(() => this._error());

  // Two-way binding for template
  get inputText() { return this._inputText(); }
  set inputText(value: string) { this._inputText.set(value); }

  // Actions
  analyzeText(): void {
    const text = this._inputText().trim();
    if (!text) return;

    this._isAnalyzing.set(true);
    this._error.set(null);

    // TODO: Replace with actual sentiment service call
    // Simulating API call for now
    setTimeout(() => {
      try {
        const mockResult: SentimentResult = this.generateMockAnalysis(text);
        this._result.set(mockResult);
      } catch (error) {
        this._error.set('Failed to analyze text. Please try again.');
      } finally {
        this._isAnalyzing.set(false);
      }
    }, 2000);
  }

  clearText(): void {
    this._inputText.set('');
    this._result.set(null);
    this._error.set(null);
  }

  clearError(): void {
    this._error.set(null);
  }

  // Utility methods
  getSentimentIcon(sentiment: string): string {
    const icons = {
      'positive': 'sentiment_satisfied',
      'negative': 'sentiment_dissatisfied',
      'neutral': 'sentiment_neutral'
    };
    return icons[sentiment as keyof typeof icons] || 'help';
  }

  getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  // Mock analysis - replace with actual service
  private generateMockAnalysis(text: string): SentimentResult {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disgusting'];
    
    const words = text.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.some(pos => word.includes(pos))).length;
    const negativeCount = words.filter(word => negativeWords.some(neg => word.includes(neg))).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    let score: number;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = 0.6 + (positiveCount * 0.1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -(0.6 + (negativeCount * 0.1));
    } else {
      sentiment = 'neutral';
      score = 0;
    }
    
    return {
      text,
      sentiment,
      score: Math.max(-1, Math.min(1, score)),
      confidence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      emotions: {
        joy: Math.random() * 0.5,
        anger: Math.random() * 0.3,
        fear: Math.random() * 0.2,
        sadness: Math.random() * 0.3
      }
    };
  }
}
