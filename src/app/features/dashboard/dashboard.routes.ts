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
        path: 'campaigns',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../campaign-management/campaign-list/campaign-list.component').then(c => c.CampaignListComponent)
          },
          {
            path: 'wizard',
            loadComponent: () =>
              import('../campaign-wizard/campaign-wizard.component').then(c => c.CampaignWizardComponent)
          },
          {
            path: ':id',
            loadComponent: () =>
              import('../campaign-management/campaign-detail/campaign-detail.component').then(c => c.CampaignDetailComponent)
          }
        ]
      },
      // otras subrutas (por ejemplo: reports, settings, etc.)
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
