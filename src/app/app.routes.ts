import { Routes } from '@angular/router';
import { AuthGuard, AuthChildGuard } from './core/guards/auth.guard';
import { ApprovedGuard } from './core/guards/approved.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'oauth/consent',
    loadComponent: () => import('./features/auth/oauth-consent.component').then(m => m.OAuthConsentComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    // Require authentication for layout and all child routes (redirects to /login when not authenticated)
    canActivate: [AuthGuard],
    canActivateChild: [AuthChildGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
        canActivate: [ApprovedGuard]
      },
      {
        path: 'pending',
        loadComponent: () => import('./features/auth/pending.component').then(m => m.PendingComponent)
      },
      {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [AdminGuard]
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
        path: 'plans/exercises',
        loadComponent: () => import('./features/plans/custom-exercises.component').then(m => m.CustomExercisesComponent)
      },
      {
        path: 'plans/edit/:planId',
        loadComponent: () => import('./features/plans/plan-create.component').then(m => m.PlanCreateComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent)
      },
      {
        path: 'history/:sessionId',
        loadComponent: () => import('./features/history/history-detail.component').then(m => m.HistoryDetailComponent)
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
