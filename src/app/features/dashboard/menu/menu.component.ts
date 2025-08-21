import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/auth/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    { route: '/dashboard/profile', label: 'Perfil', icon: 'account_circle', ariaLabel: 'Ir a perfil' },
    { route: '/dashboard/settings', label: 'Configuración', icon: 'settings', ariaLabel: 'Ir a configuración' },
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
