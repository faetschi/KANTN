import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login').then(m => m.Login)
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.Layout),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./home').then(m => m.Home)
      },
      {
        path: 'plans',
        loadComponent: () => import('./plans').then(m => m.Plans)
      },
      {
        path: 'plans/new',
        loadComponent: () => import('./plan-editor').then(m => m.PlanEditor)
      },
      {
        path: 'plans/edit/:id',
        loadComponent: () => import('./plan-editor').then(m => m.PlanEditor)
      },
      {
        path: 'history',
        loadComponent: () => import('./history').then(m => m.History)
      }
    ]
  },
  {
    path: 'workout/:id',
    loadComponent: () => import('./active-workout').then(m => m.ActiveWorkout)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
