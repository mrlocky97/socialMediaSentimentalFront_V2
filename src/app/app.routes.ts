import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { authGuard } from './core/auth/guard/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent,
        title: 'Login - Sentimental Social'
    },
    {
        path: 'register',
        component: RegisterComponent,
        title: 'Register - Sentimental Social'
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadChildren: () =>
            import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
        title: 'Dashboard - Sentimental Social'
    },
    {
        path: 'campaigns',
        canActivate: [authGuard],
        loadChildren: () =>
            import('./features/campaigns/campaign.routes').then(r => r.campaignRoutes),
        title: 'Campaigns - Sentimental Social'
    },
    {
        path: 'analytics',
        canActivate: [authGuard],
        loadComponent: () => 
            import('./features/analytics/analytics.component').then(c => c.AnalyticsComponent),
        title: 'Analytics - Sentimental Social'
    },
    {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => 
            import('./features/profile/profile.component').then(c => c.ProfileComponent),
        title: 'Profile - Sentimental Social'
    },
    {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () => 
            import('./features/settings/settings.component').then(c => c.SettingsComponent),
        title: 'Settings - Sentimental Social'
    },
    { 
        path: '**', 
        loadComponent: () => 
            import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent),
        title: 'Page Not Found'
    }
];