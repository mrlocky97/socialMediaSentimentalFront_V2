import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SessionTimeoutService } from '../../../core/services/session-timeout.service';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-session-indicator',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  template: `
    <div class="session-indicator" *ngIf="isAuthenticated()">
      <button 
        mat-icon-button 
        [matTooltip]="getTooltipText()"
        [class.warning]="remainingMinutes() <= 10"
        [class.critical]="remainingMinutes() <= 5"
        (click)="extendSession()">
        <mat-icon>{{ getIconName() }}</mat-icon>
      </button>
      <span class="time-display" *ngIf="showTimeDisplay()">
        {{ remainingMinutes() }}m
      </span>
      <div class="extended-message" *ngIf="showExtendedMessage()" [@fadeInOut]>
        ✓ Sesión extendida
      </div>
    </div>
  `,
  styles: [`
    .session-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }
    
    .time-display {
      font-size: 12px;
      color: var(--text-secondary, #666);
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--background-secondary, #f5f5f5);
    }
    
    .extended-message {
      position: absolute;
      top: -35px;
      right: 0;
      background: var(--success-color, #4caf50);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 1000;
    }
    
    .extended-message::after {
      content: '';
      position: absolute;
      top: 100%;
      right: 10px;
      border: 4px solid transparent;
      border-top-color: var(--success-color, #4caf50);
    }
    
    button.warning {
      color: var(--warning-color, #ff9800);
    }
    
    button.critical {
      color: var(--error-color, #f44336);
      animation: pulse 1s infinite;
    }
    
    button.warning .time-display {
      background: var(--warning-light, #fff3e0);
      color: var(--warning-dark, #e65100);
    }
    
    button.critical .time-display {
      background: var(--error-light, #ffebee);
      color: var(--error-dark, #c62828);
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.6; }
      100% { opacity: 1; }
    }
  `]
})
export class SessionIndicatorComponent implements OnInit, OnDestroy {
  private sessionTimeout = inject(SessionTimeoutService);
  private authService = inject(AuthService);
  
  remainingMinutes = signal(0);
  isAuthenticated = this.authService.isAuthenticated;
  showTimeDisplay = signal(false); // Hacer reactivo
  showExtendedMessage = signal(false);
  
  private intervalId: any;
  private extendedMessageTimeoutId: any;

  ngOnInit(): void {
    // Actualizar cada 30 segundos para más precisión
    this.intervalId = setInterval(() => {
      this.updateRemainingTime();
    }, 30000); // 30 segundos
    
    // Actualización inicial
    this.updateRemainingTime();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.extendedMessageTimeoutId) {
      clearTimeout(this.extendedMessageTimeoutId);
    }
  }

  private updateRemainingTime(): void {
    if (this.isAuthenticated()) {
      const remaining = this.sessionTimeout.getRemainingTime();
      this.remainingMinutes.set(remaining);
      
      // Mostrar tiempo cuando quedan menos de 15 minutos
      this.showTimeDisplay.set(remaining <= 15);
    }
  }

  extendSession(): void {
    this.sessionTimeout.extendSession();
    this.updateRemainingTime();
    
    // Mostrar mensaje de confirmación
    this.showExtendedMessage.set(true);
    
    // Ocultar mensaje después de 3 segundos
    this.extendedMessageTimeoutId = setTimeout(() => {
      this.showExtendedMessage.set(false);
    }, 3000);
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

  getIconName(): string {
    const remaining = this.remainingMinutes();
    if (remaining <= 5) {
      return 'warning';
    } else if (remaining <= 10) {
      return 'schedule';
    } else {
      return 'access_time';
    }
  }
}
