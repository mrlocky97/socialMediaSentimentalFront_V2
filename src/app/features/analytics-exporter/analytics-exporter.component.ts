import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-analytics-exporter',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="analytics-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>analytics</mat-icon>
            Analytics Dashboard
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Analytics functionality coming soon...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class AnalyticsExporterComponent { }
