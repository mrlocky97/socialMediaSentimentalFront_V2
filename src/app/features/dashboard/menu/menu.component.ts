import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { AuthService } from '../../../core/auth/services/auth.service';

export interface NavItem {
  route: string;
  labelKey: string;  // Cambiar a clave de traducción
  icon: string;
  ariaLabelKey: string;  // Cambiar a clave de traducción
}

@Component({
  selector: 'app-menu',
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
  MatDividerModule,
  TranslocoModule,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent implements OnInit {
  public transloco = inject(TranslocoService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  @Output() navigate = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();

  // Información del usuario autenticado
  currentUser = this.authService.currentUser;
  userRole = this.authService.userRole;

  navItems: NavItem[] = [
    {
      route: '/dashboard/home',
      labelKey: 'menu.home',
      icon: 'home',
      ariaLabelKey: 'menu.aria.home',
    },
    {
      // Point to dashboard-scoped campaigns so the dashboard layout (toolbar/sidenav) remains
      route: '/dashboard/campaigns',
      labelKey: 'menu.campaigns',
      icon: 'campaign',
      ariaLabelKey: 'menu.aria.campaigns',
    },
    {
      route: '/analytics',
      labelKey: 'menu.analytics',
      icon: 'analytics',
      ariaLabelKey: 'menu.aria.analytics',
    },
    {
      route: '/monitor',
      labelKey: 'menu.monitor',
      icon: 'monitoring',
      ariaLabelKey: 'menu.aria.monitor',
    },
    {
      route: '/wizard',
      labelKey: 'menu.wizard',
      icon: 'auto_fix_high',
      ariaLabelKey: 'menu.aria.wizard',
    },
    {
      route: '/dashboard/profile',
      labelKey: 'menu.profile',
      icon: 'account_circle',
      ariaLabelKey: 'menu.aria.profile',
    },
  ];

  ngOnInit(): void {
    // Las traducciones ya se manejan dinámicamente en el template
    // No necesitamos hacer nada aquí, pero podríamos suscribirnos a cambios de idioma si fuera necesario
  }

  onNavigate() {
    this.navigate.emit();
  }

  /**
   * Cerrar sesión desde el menú lateral
   */
  onLogout() {
    // Mostrar confirmación
    this.snackBar.open(this.transloco.translate('menu.messages.logging_out'), 'OK', {
      duration: 2000,
      panelClass: ['info-snackbar'],
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
      case 'admin':
        return this.transloco.translate('menu.roles.admin');
      case 'manager':
        return this.transloco.translate('menu.roles.manager');
      case 'analyst':
        return this.transloco.translate('menu.roles.analyst');
      case 'onlyView':
        return this.transloco.translate('menu.roles.onlyView');
      case 'client':
        return this.transloco.translate('menu.roles.client');
      default:
        return this.transloco.translate('menu.roles.user');
    }
  }
}
