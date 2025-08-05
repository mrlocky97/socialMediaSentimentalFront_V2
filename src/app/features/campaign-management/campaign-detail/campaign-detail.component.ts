/* =====================================
   CAMPAIGN DETAIL COMPONENT (PLACEHOLDER)
   Will be implemented in next iteration
   ===================================== */

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="placeholder-container">
      <mat-card class="placeholder-card">
        <mat-card-content>
          <div class="placeholder-content">
            <mat-icon class="placeholder-icon">visibility</mat-icon>
            <h2>Detalles de Campaña</h2>
            <p>Este componente será implementado en la siguiente iteración.</p>
            <button mat-raised-button color="primary" [routerLink]="['/campaigns']">
              <mat-icon>arrow_back</mat-icon>
              Volver a Campañas
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: var(--spacing-xl);
    }

    .placeholder-card {
      max-width: 400px;
      text-align: center;
    }

    .placeholder-content {
      padding: var(--spacing-2xl);
    }

    .placeholder-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--color-primary);
      margin-bottom: var(--spacing-lg);
    }

    h2 {
      color: var(--color-gray-800);
      margin-bottom: var(--spacing-md);
    }

    p {
      color: var(--color-gray-600);
      margin-bottom: var(--spacing-xl);
    }
  `]
})
export class CampaignDetailComponent { }
