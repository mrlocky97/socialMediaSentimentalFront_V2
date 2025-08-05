/* =====================================
   CAMPAIGN MANAGEMENT ROUTES
   Enterprise routing configuration
   ===================================== */

import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guard/auth.guard';

export const campaignRoutes: Routes = [
  {
    path: 'campaigns',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./campaign-list/campaign-list.component').then(m => m.CampaignListComponent),
        title: 'Campaign Management - SentimentalSocial'
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./campaign-wizard/campaign-wizard.component').then(m => m.CampaignWizardComponent),
        title: 'Create Campaign - SentimentalSocial'
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./campaign-detail/campaign-detail.component').then(m => m.CampaignDetailComponent),
        title: 'Campaign Details - SentimentalSocial'
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./campaign-edit/campaign-edit.component').then(m => m.CampaignEditComponent),
        title: 'Edit Campaign - SentimentalSocial'
      }
    ]
  }
];
