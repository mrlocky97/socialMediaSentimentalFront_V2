import { Routes } from '@angular/router';
import { DashboardContainerComponent } from './dashboard.container.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardContainerComponent,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.component').then(c => c.HomeComponent)
      },
      // otras subrutas (por ejemplo: reports, settings, etc.)
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];