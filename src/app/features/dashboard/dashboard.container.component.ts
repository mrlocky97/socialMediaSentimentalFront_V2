import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, ViewChild } from '@angular/core';
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
   protected readonly fillerNav = Array.from({length: 5}, (_, i) => `Nav Item ${i + 1}`);

  protected readonly fillerContent = Array.from(
    {length: 10},
    () =>
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
       labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
       laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
       voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
       cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
  );

  protected readonly isMobile = signal(true);

  private readonly _mobileQuery: MediaQueryList;
  private readonly _mobileQueryListener: () => void;

  constructor() {
    const media = inject(MediaMatcher);

    this._mobileQuery = media.matchMedia('(max-width: 600px)');
    this.isMobile.set(this._mobileQuery.matches);
    this._mobileQueryListener = () => this.isMobile.set(this._mobileQuery.matches);
    this._mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  tiles: Tile[] = [
    {text: 'One', cols: 3, rows: 1, color: 'lightblue'},
    {text: 'Two', cols: 1, rows: 2, color: 'lightgreen'},
    {text: 'Three', cols: 1, rows: 1, color: 'lightpink'},
    {text: 'Four', cols: 2, rows: 1, color: '#DDBDF1'},
  ];

  ngOnDestroy(): void {
    this._mobileQuery.removeEventListener('change', this._mobileQueryListener);
  }
}
