import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

export interface NavItem {
  route: string;
  label: string;
  icon: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-menu',
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  @Output() navigate = new EventEmitter<void>();

  navItems: NavItem[] = [
    { route: '/dashboard/home', label: 'Inicio', icon: 'home', ariaLabel: 'Ir a inicio' },
    { route: '/campaigns', label: 'Campañas', icon: 'campaign', ariaLabel: 'Ir a gestión de campañas' },
    { route: '/dashboard/profile', label: 'Perfil', icon: 'account_circle', ariaLabel: 'Ir a perfil' },
    { route: '/dashboard/settings', label: 'Configuración', icon: 'settings', ariaLabel: 'Ir a configuración' },
  ];

  onNavigate() {
    this.navigate.emit();
  }
}
