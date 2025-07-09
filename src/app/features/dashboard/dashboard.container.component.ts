import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal, ViewChild } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { MaterialModule } from '../../shared/material/material.module';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from "./menu/menu.component";

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'app-dashboard.container',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterOutlet, MenuComponent],
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
