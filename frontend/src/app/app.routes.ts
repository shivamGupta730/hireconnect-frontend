import { Routes } from '@angular/router';
import { roleGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'candidate',
    data: { roles: [1] }, // UserRole.Candidate
    canActivate: [authGuard, roleGuard],
    loadComponent: () => import('./features/candidate/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'recruiter',
    data: { roles: [2] }, // UserRole.Recruiter
    canActivate: [authGuard, roleGuard],
    loadComponent: () => import('./features/recruiter/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { path: '**', redirectTo: '' }
];
