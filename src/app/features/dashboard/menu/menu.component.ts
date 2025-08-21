import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

export interface NavItem {
  route: string;
  label: string;
  icon: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-menu',
  imports: [
    CommonModule, 
    MatListModule, 
    MatIconModule, 
    MatButtonModule, 
    RouterModule,
    MatDividerModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  @Output() navigate = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();

  // Información del usuario autenticado
  currentUser = this.authService.currentUser;
  userRole = this.authService.userRole;

  navItems: NavItem[] = [
    { route: '/dashboard/home', label: 'Inicio', icon: 'home', ariaLabel: 'Ir a inicio' },
    { route: '/campaigns', label: 'Campañas', icon: 'campaign', ariaLabel: 'Ir a gestión de campañas' },
    { route: '/analytics', label: 'Análisis', icon: 'analytics', ariaLabel: 'Ir a análisis y reportes' },
    { route: '/monitor', label: 'Monitor', icon: 'monitoring', ariaLabel: 'Ir a monitor de scraping' },
    { route: '/wizard', label: 'Asistente', icon: 'auto_fix_high', ariaLabel: 'Ir a asistente de campañas' },
    { route: '/profile', label: 'Mi Perfil', icon: 'account_circle', ariaLabel: 'Ir a mi perfil' },
  ];

  onNavigate() {
    this.navigate.emit();
  }

  /**
   * Cerrar sesión desde el menú lateral
   */
  onLogout() {
    // Mostrar confirmación
    this.snackBar.open('Cerrando sesión...', 'OK', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });

    // Emitir evento para que el dashboard container maneje el logout
    this.logoutRequested.emit();
    
    // También emitir navigate para cerrar el menú en móvil
    this.navigate.emit();
  }

  /**
   * Obtener el texto de rol del usuario para mostrar
   */
  getRoleDisplayText(): string {
    switch (this.userRole()) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Manager';
      case 'analyst': return 'Analista';
      case 'onlyView': return 'Solo lectura';
      case 'client': return 'Cliente';
      default: return 'Usuario';
    }
  }
}
