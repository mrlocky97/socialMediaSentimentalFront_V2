import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule],
  template: `
    <div class="not-found-container">
      <mat-card class="not-found-card">
        <mat-card-content>
          <div class="not-found-content">
            <mat-icon class="not-found-icon">error_outline</mat-icon>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist or has been moved.</p>
            <div class="actions">
              <button mat-raised-button color="primary" routerLink="/dashboard">
                <mat-icon>home</mat-icon>
                Go to Dashboard
              </button>
              <button mat-button (click)="goBack()">
                <mat-icon>arrow_back</mat-icon>
                Go Back
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
      background-color: #f5f5f5;
    }

    .not-found-card {
      max-width: 500px;
      width: 100%;
    }

    .not-found-content {
      text-align: center;
      padding: 48px 24px;
    }

    .not-found-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #ff9800;
      margin-bottom: 24px;
    }

    h1 {
      margin: 0 0 16px 0;
      color: #424242;
      font-weight: 500;
    }

    p {
      margin: 0 0 32px 0;
      color: #666;
      font-size: 16px;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .actions button {
      min-width: 140px;
    }

    @media (max-width: 600px) {
      .actions {
        flex-direction: column;
      }
      
      .actions button {
        width: 100%;
      }
    }
  `]
})
export class NotFoundComponent {
  goBack(): void {
    window.history.back();
  }
}
