import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="analytics-container">
      <div class="header">
        <h1>Analytics Dashboard</h1>
        <p>Comprehensive analytics and insights for all your campaigns</p>
      </div>

      <div class="coming-soon">
        <mat-card>
          <mat-card-content>
            <div class="coming-soon-content">
              <mat-icon class="icon">analytics</mat-icon>
              <h2>Analytics Dashboard Coming Soon</h2>
              <p>We're working on comprehensive analytics features including:</p>
              <ul>
                <li>Real-time sentiment tracking</li>
                <li>Engagement analytics</li>
                <li>Trend analysis</li>
                <li>Custom reports</li>
                <li>Data visualization</li>
              </ul>
              <button mat-raised-button color="primary" disabled>
                <mat-icon>notifications</mat-icon>
                Notify Me When Ready
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .header {
      text-align: center;
      margin-bottom: 48px;
    }

    .header h1 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 2.5rem;
      font-weight: 300;
    }

    .header p {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
    }

    .coming-soon {
      display: flex;
      justify-content: center;
    }

    .coming-soon mat-card {
      max-width: 600px;
      width: 100%;
    }

    .coming-soon-content {
      text-align: center;
      padding: 48px 24px;
    }

    .icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #1976d2;
      margin-bottom: 24px;
    }

    .coming-soon-content h2 {
      margin: 0 0 24px 0;
      color: #424242;
      font-weight: 500;
    }

    .coming-soon-content p {
      margin: 0 0 24px 0;
      color: #666;
      font-size: 16px;
    }

    .coming-soon-content ul {
      text-align: left;
      margin: 0 0 32px 0;
      padding: 0;
      list-style: none;
      max-width: 300px;
      margin-left: auto;
      margin-right: auto;
    }

    .coming-soon-content li {
      padding: 8px 0;
      color: #666;
      position: relative;
      padding-left: 24px;
    }

    .coming-soon-content li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #4caf50;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 2rem;
      }
      
      .coming-soon-content {
        padding: 32px 16px;
      }
    }
  `]
})
export class AnalyticsComponent {
  
}
