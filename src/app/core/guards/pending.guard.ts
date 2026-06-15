import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

const checkPending = async (childRoute: any): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const supabase = inject(SupabaseService);

  // Allow access to the pending page regardless of approval status
  if (childRoute?.routeConfig?.path === 'pending') return true;

  // Dev fallback: without a Supabase client, approval checks aren't possible — allow all
  const client = supabase.getClient();
  const devEnabled = typeof window !== 'undefined' && (window as any).__env?.ENABLE_DEV_AUTH === 'true';
  if (!client) {
    if (devEnabled && auth.isLoggedIn()) return true;
    return router.createUrlTree(['/login']);
  }

  // Fast path: check the in-memory signal first
  if (auth.isApproved()) return true;

  try {
    const { data: userData } = await client.auth.getUser();
    const user = (userData as any)?.user;
    if (!user) return router.createUrlTree(['/login']);

    const { data: profile } = await client
      .from('profiles')
      .select('approved')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.approved) {
      // Update the in-memory signal so subsequent checks are fast
      await auth.refreshProfile();
      return true;
    }

    return router.createUrlTree(['/pending']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};

export const PendingGuard: CanActivateChildFn = async (childRoute, _state) =>
  checkPending(childRoute);
