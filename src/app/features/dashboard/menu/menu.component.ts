import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
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
    MatDividerModule,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent {
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
      label: this.transloco.translate('menu.home'),
      icon: 'home',
      ariaLabel: this.transloco.translate('menu.aria.home'),
    },
    {
      route: '/campaigns',
      label: this.transloco.translate('menu.campaigns'),
      icon: 'campaign',
      ariaLabel: this.transloco.translate('menu.aria.campaigns'),
    },
    {
      route: '/analytics',
      label: this.transloco.translate('menu.analytics'),
      icon: 'analytics',
      ariaLabel: this.transloco.translate('menu.aria.analytics'),
    },
    {
      route: '/monitor',
      label: this.transloco.translate('menu.monitor'),
      icon: 'monitoring',
      ariaLabel: this.transloco.translate('menu.aria.monitor'),
    },
    {
      route: '/wizard',
      label: this.transloco.translate('menu.wizard'),
      icon: 'auto_fix_high',
      ariaLabel: this.transloco.translate('menu.aria.wizard'),
    },
    {
      route: '/dashboard/profile',
      label: this.transloco.translate('menu.profile'),
      icon: 'account_circle',
      ariaLabel: this.transloco.translate('menu.aria.profile'),
    },
  ];

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
