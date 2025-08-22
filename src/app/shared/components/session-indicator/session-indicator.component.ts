import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SessionTimeoutService } from '../../../core/services/session-timeout.service';

@Component({
  selector: 'app-session-indicator',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' })),
      ]),
    ]),
  ],
  templateUrl: './session-indicator.component.html',
  styleUrls: ['./session-indicator.component.css'],
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
