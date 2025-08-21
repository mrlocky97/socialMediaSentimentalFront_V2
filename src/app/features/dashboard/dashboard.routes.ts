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
        path: 'campaigns',
        children: [
          {
            path: '',
            // Use consolidated campaigns module
            loadComponent: () =>
              import('../campaigns/campaign-list/campaign-list.component').then(c => c.CampaignListComponent)
          },
          {
            path: 'wizard',
            loadComponent: () =>
              import('../campaign-wizard/campaign-wizard-simple.component').then(c => c.CampaignWizardComponent)
          },
          {
            path: ':id',
            loadComponent: () =>
              import('../campaigns/campaign-detail/campaign-detail.component').then(c => c.CampaignDetailComponent)
          }
        ]
      },
      // otras subrutas (por ejemplo: reports, settings, etc.)
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
