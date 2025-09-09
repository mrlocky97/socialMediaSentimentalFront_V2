/**
 * Campaign Routes Configuration - Consolidated
 * Unified routing with all campaign-related paths
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
        title: 'Campaign Management - SentimentalSocial'
      },
      {
        path: 'campaign-detail/:id',
        loadComponent: () => 
          import('./campaign-detail/campaign-detail.component').then(c => c.CampaignDetailComponent),
        title: 'Campaign Details - SentimentalSocial'
      },
    ]
  }
];
