import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Configuración de timeout (en minutos)
  private readonly TIMEOUT_MINUTES = 30;
  private readonly WARNING_MINUTES = 5; // Advertir 5 minutos antes
  
  private timeoutId: any;
  private warningTimeoutId: any;
  private lastActivity = signal<Date>(new Date());
  
  // Events que resetean el timer
  private readonly ACTIVITY_EVENTS = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  constructor() {
    this.initActivityListeners();
  }

  startSession(): void {
    console.log('🕒 Session timeout started');
    this.resetTimer();
  }

  stopSession(): void {
    console.log('🛑 Session timeout stopped');
    this.clearTimers();
    this.removeActivityListeners();
  }

  private initActivityListeners(): void {
    // Agregar listeners para detectar actividad del usuario
    this.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, this.onUserActivity.bind(this), true);
    });
  }

  private removeActivityListeners(): void {
    this.ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, this.onUserActivity.bind(this), true);
    });
  }

  private onUserActivity(): void {
    this.lastActivity.set(new Date());
    this.resetTimer();
  }

  private resetTimer(): void {
    this.clearTimers();
    
    // Timer para advertencia
    this.warningTimeoutId = setTimeout(() => {
      this.showWarning();
    }, (this.TIMEOUT_MINUTES - this.WARNING_MINUTES) * 60 * 1000);
    
    // Timer para logout automático
    this.timeoutId = setTimeout(() => {
      this.performAutoLogout();
    }, this.TIMEOUT_MINUTES * 60 * 1000);
  }

  private clearTimers(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
  }

  private showWarning(): void {
    const remainingTime = this.WARNING_MINUTES;
    const warningMessage = `Su sesión expirará en ${remainingTime} minutos por inactividad. ¿Desea continuar?`;
    
    if (confirm(warningMessage)) {
      // Usuario quiere continuar, resetear timer
      this.resetTimer();
    } else {
      // Usuario no responde o cancela, hacer logout
      this.performAutoLogout();
    }
  }

  private performAutoLogout(): void {
    console.log('⏰ Session timeout - performing auto logout');
    
    // Mostrar mensaje al usuario
    alert('Su sesión ha expirado por inactividad. Será redirigido al login.');
    
    // Realizar logout
    this.authService.logout();
    
    // Detener el servicio
    this.stopSession();
    
    // Navegar al login
    this.router.navigate(['/login'], { 
      queryParams: { reason: 'timeout' } 
    });
  }

  // Método para extender sesión manualmente
  extendSession(): void {
    console.log('🔄 Session extended manually');
    this.resetTimer();
  }

  // Getter para obtener tiempo restante (para mostrar en UI si se desea)
  getRemainingTime(): number {
    const now = new Date().getTime();
    const lastActivityTime = this.lastActivity().getTime();
    const timeoutTime = lastActivityTime + (this.TIMEOUT_MINUTES * 60 * 1000);
    const remaining = Math.max(0, timeoutTime - now);
    
    return Math.floor(remaining / 1000 / 60); // Retorna minutos restantes
  }

  ngOnDestroy(): void {
    this.stopSession();
  }
}
