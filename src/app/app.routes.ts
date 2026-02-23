import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'plans',
        loadComponent: () => import('./features/plans/plans.component').then(m => m.PlansComponent)
      },
      {
        path: 'plans/create',
        loadComponent: () => import('./features/plans/plan-create.component').then(m => m.PlanCreateComponent)
      },
      {
        path: 'workout/:planId',
        loadComponent: () => import('./features/workout/workout.component').then(m => m.WorkoutComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  }
];
