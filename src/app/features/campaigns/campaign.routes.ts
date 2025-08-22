/**
 * Campaign Routes Configuration
 * Lazy loading with typed route structure
 */
import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guard/auth.guard';

export const campaignRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => 
          import('./campaign-list/campaign-list.component').then(c => c.CampaignListComponent),
        title: 'Campaigns'
      },
      {
        path: 'create',
        loadComponent: () => 
          import('./campaign-wizard/modern-campaign-wizard.component').then(c => c.ModernCampaignWizardComponent),
        title: 'Create Campaign'
      },
      {
        path: 'create-simple',
        loadComponent: () => 
          import('./campaign-form/campaign-form.component').then(c => c.CampaignFormComponent),
        title: 'Create Campaign - Simple'
      },
      {
        path: ':id',
        loadComponent: () => 
          import('./campaign-detail/campaign-detail.component').then(c => c.CampaignDetailComponent),
        title: 'Campaign Details'
      },
      {
        path: ':id/edit',
        loadComponent: () => 
          import('./campaign-form/campaign-form.component').then(c => c.CampaignFormComponent),
        title: 'Edit Campaign'
      },
      {
        path: ':id/analytics',
        loadComponent: () => 
          import('./campaign-analytics/campaign-analytics.component').then(c => c.CampaignAnalyticsComponent),
        title: 'Campaign Analytics'
      }
    ]
  }
];
