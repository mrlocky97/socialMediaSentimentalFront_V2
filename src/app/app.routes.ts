import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Login - Sentimental Social',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Register - Sentimental Social',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then((r) => r.routes),
    title: 'Dashboard - Sentimental Social',
  },
  {
    path: 'campaigns',
    canActivate: [authGuard],
    // Consolidated campaigns routes (use features/campaigns)
    loadChildren: () => import('./features/campaigns/campaign.routes').then((r) => r.campaignRoutes),
    title: 'Campaigns - Sentimental Social',
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/analytics-exporter/analytics-exporter.component').then((c) => c.AnalyticsExporterComponent),
    title: 'Analytics - Sentimental Social',
  },
  {
    path: 'profile',
    redirectTo: '/dashboard/profile',
    pathMatch: 'full'
  },
  {
    path: 'monitor',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/scraping-monitor/scraping-monitor.component').then((c) => c.ScrapingMonitorComponent),
    title: 'Monitor - Sentimental Social',
  },
  {
    path: 'wizard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/campaign-wizard/campaign-wizardcomponent').then((c) => c.CampaignWizardComponent),
    title: 'Campaign Wizard - Sentimental Social',
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then((c) => c.NotFoundComponent),
    title: 'Page Not Found',
  },
];
