import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardContainerComponent } from './features/dashboard/dashboard.container.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'dashboard',
        component: DashboardContainerComponent
    }
];