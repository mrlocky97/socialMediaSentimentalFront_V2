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
      {
        path: 'profile',
        loadComponent: () =>
          import('../profile/profile.component').then(c => c.ProfileComponent)
      },
      {
        // Mount the consolidated campaign routes under the dashboard path so the
        // dashboard layout (toolbar/sidenav) remains visible when navigating
        // to campaigns from within the dashboard.
        path: 'campaigns',
        loadChildren: () => import('../campaigns/campaign.routes').then(r => r.campaignRoutes)
      },
      // otras subrutas (por ejemplo: reports, settings, etc.)
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
