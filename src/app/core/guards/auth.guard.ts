import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';

const checkAuth = async (_state: any): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const supabase = inject(SupabaseService);

  const url = (_state as any)?.url || '';
  const client = supabase.getClient();
  const devEnabled = typeof window !== 'undefined' && (window as any).__env?.ENABLE_DEV_AUTH === 'true';

  // Allow unauthenticated access only to the login page and the oauth consent redirect
  const allowedWhenUnauthenticated = url === '/login' || url.startsWith('/oauth/consent');

  // If no Supabase client, fall back to dev auth only or allowed public routes
  if (!client) {
    if (devEnabled && auth.isLoggedIn()) return true;
    if (allowedWhenUnauthenticated) return true;
    return router.createUrlTree(['/login']);
  }

  try {
    const { data } = await client.auth.getSession();
    const user = data?.session?.user ?? null;
    if (!user) {
      // Allow dev auth only when explicitly enabled
      if (devEnabled && auth.isLoggedIn()) return true;
      if (allowedWhenUnauthenticated) return true;
      return router.createUrlTree(['/login']);
    }
    return true;
  } catch (e) {
    if (devEnabled && auth.isLoggedIn()) return true;
    if (allowedWhenUnauthenticated) return true;
    return router.createUrlTree(['/login']);
  }
};

export const AuthGuard: CanActivateFn = async (_route, state) => checkAuth(state);
export const AuthChildGuard: CanActivateChildFn = async (_childRoute, state) => checkAuth(state);
