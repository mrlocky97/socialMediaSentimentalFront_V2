import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal, ViewChild } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from "./menu/menu.component";
import { MATERIAL_IMPORTS } from '../../shared/material/material-imports';

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
    ...MATERIAL_IMPORTS
  ],
  templateUrl: './dashboard.container.component.html',
  styleUrl: './dashboard.container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush // Use OnPush change detection strategy for better performance
})
export class DashboardContainerComponent {
  isMobile = window.innerWidth < 768;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
}
