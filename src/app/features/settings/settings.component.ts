import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="settings-container">
      <div class="header">
        <h1>Settings</h1>
      </div>

      <div class="placeholder">
        <mat-card>
          <mat-card-content>
            <div class="placeholder-content">
              <mat-icon class="icon">settings</mat-icon>
              <h2>Application Settings</h2>
              <p>Settings and preferences will be available here.</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }

    .header h1 {
      margin: 0 0 24px 0;
      color: #1976d2;
    }

    .placeholder-content {
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
  `]
})
export class SettingsComponent {
  
}
