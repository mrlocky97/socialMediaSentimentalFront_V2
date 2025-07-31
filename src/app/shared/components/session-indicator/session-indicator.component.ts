import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SessionTimeoutService } from '../../../core/services/session-timeout.service';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-session-indicator',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="session-indicator" *ngIf="isAuthenticated()">
      <button 
        mat-icon-button 
        [matTooltip]="getTooltipText()"
        [class.warning]="remainingMinutes() <= 10"
        [class.critical]="remainingMinutes() <= 5"
        (click)="extendSession()">
        <mat-icon>access_time</mat-icon>
      </button>
      <span class="time-display" *ngIf="showTimeDisplay">
        {{ remainingMinutes() }}m
      </span>
    </div>
  `,
  styles: [`
    .session-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .time-display {
      font-size: 12px;
      color: var(--text-secondary, #666);
    }
    
    button.warning {
      color: var(--warning-color, #ff9800);
    }
    
    button.critical {
      color: var(--error-color, #f44336);
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `]
})
export class SessionIndicatorComponent implements OnInit, OnDestroy {
  private sessionTimeout = inject(SessionTimeoutService);
  private authService = inject(AuthService);
  
  remainingMinutes = signal(0);
  isAuthenticated = this.authService.isAuthenticated;
  showTimeDisplay = false; // Se puede configurar como input si se desea
  
  private intervalId: any;

  ngOnInit(): void {
    // Actualizar cada minuto
    this.intervalId = setInterval(() => {
      this.updateRemainingTime();
    }, 60000); // 1 minuto
    
    // Actualización inicial
    this.updateRemainingTime();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateRemainingTime(): void {
    if (this.isAuthenticated()) {
      const remaining = this.sessionTimeout.getRemainingTime();
      this.remainingMinutes.set(remaining);
    }
  }

  extendSession(): void {
    this.sessionTimeout.extendSession();
    this.updateRemainingTime();
  }

  getTooltipText(): string {
    const remaining = this.remainingMinutes();
    if (remaining <= 5) {
      return `⚠️ Su sesión expira en ${remaining} minutos. Haga clic para extender.`;
    } else if (remaining <= 10) {
      return `Sesión: ${remaining} minutos restantes. Haga clic para extender.`;
    } else {
      return `Sesión: ${remaining} minutos restantes`;
    }
  }
}
