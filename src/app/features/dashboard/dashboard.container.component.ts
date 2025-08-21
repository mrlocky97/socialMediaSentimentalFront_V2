import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MATERIAL_IMPORTS } from '../../shared/material/material-imports';
import { MenuComponent } from "./menu/menu.component";
import { AuthService } from '../../core/auth/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SessionTimeoutService } from '../../core/services/session-timeout.service';
import { MatDialog } from '@angular/material/dialog';
import { LogoutConfirmationDialogComponent } from './components/logout-confirmation-dialog.component';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'app-dashboard.container',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    MenuComponent,
    LanguageSelectorComponent,
    ...MATERIAL_IMPORTS
  ],
  templateUrl: './dashboard.container.component.html',
  styleUrl: './dashboard.container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush // Use OnPush change detection strategy for better performance
})
export class DashboardContainerComponent {
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private sessionTimeoutService = inject(SessionTimeoutService);
  private dialog = inject(MatDialog);

  isMobile = window.innerWidth < 768;

  // Computed para obtener información del usuario autenticado
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;

  constructor() {
    // Configurar el callback de logout para el servicio de timeout de sesión
    this.sessionTimeoutService.setLogoutCallback(() => {
      this.performLogout(); // Logout directo en caso de timeout
    });

    // Iniciar el monitoreo de timeout de sesión
    this.sessionTimeoutService.startSession();
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  /**
   * Mostrar dialog de confirmación y cerrar sesión del usuario
   */
  logout(): void {
    const dialogRef = this.dialog.open(LogoutConfirmationDialogComponent, {
      width: '400px',
      disableClose: true,
      panelClass: ['logout-dialog-panel']
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.performLogout();
      }
    });
  }

  /**
   * Ejecutar el logout sin confirmación (para timeout automático)
   */
  private performLogout(): void {
    // Mostrar mensaje de logout
    this.snackBar.open('Cerrando sesión...', 'OK', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });

    // Detener el monitoreo de sesión
    this.sessionTimeoutService.stopSession();

    // Ejecutar logout a través del AuthService
    this.authService.logout();
  }

  /**
   * Obtener las iniciales del usuario para mostrar en el avatar
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '??';
    
    const displayName = user.displayName || user.username || '';
    const names = displayName.split(' ');
    
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    
    return names[0] ? names[0].charAt(0).toUpperCase() : '??';
  }
}
