import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="logout-dialog">
      <div class="dialog-header">
        <mat-icon class="logout-icon">logout</mat-icon>
        <h2 mat-dialog-title>Cerrar Sesión</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p>¿Estás seguro de que deseas cerrar sesión?</p>
        <p class="warning-text">Se perderán todos los cambios no guardados.</p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button 
                (click)="onCancel()" 
                class="cancel-button">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button 
                color="warn" 
                (click)="onConfirm()" 
                class="confirm-button">
          <mat-icon>logout</mat-icon>
          Cerrar Sesión
        </button>
      </div>
    </div>
  `,
  styles: [`
    .logout-dialog {
      padding: var(--spacing-lg);
      min-width: 350px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .logout-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: var(--color-warning);
    }

    h2 {
      margin: 0;
      font-weight: var(--font-semibold);
      color: var(--color-gray-800);
    }

    .dialog-content {
      margin-bottom: var(--spacing-xl);
    }

    .dialog-content p {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--color-gray-700);
    }

    .warning-text {
      font-size: 0.875rem;
      color: var(--color-warning) !important;
      font-weight: var(--font-medium);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding: 0;
      margin: 0;
    }

    .cancel-button {
      color: var(--color-gray-600);
      border-color: var(--color-gray-300);
    }

    .cancel-button:hover {
      background: var(--color-gray-50);
    }

    .confirm-button {
      background: var(--color-error);
      color: white;
    }

    .confirm-button:hover {
      background: var(--color-error-dark);
    }

    button {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      transition: all var(--transition-normal);
    }

    button mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }
  `]
})
export class LogoutConfirmationDialogComponent {
  private dialogRef = inject(MatDialogRef<LogoutConfirmationDialogComponent>);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
