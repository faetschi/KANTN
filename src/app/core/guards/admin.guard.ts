import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';

export const AdminGuard: CanActivateFn = async (_route, _state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const supabase = inject(SupabaseService);

  // Dev fallback: if AuthService has a logged-in dev user with is_admin flag
  const cu: any = auth.currentUser();
  if (cu && cu.is_admin) return true;

  const client = supabase.getClient();
  if (!client) {
    router.navigate(['/']);
    return false;
  }

  try {
    const user = await auth.getSessionUser();
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    const { data, error } = await client.from('profiles').select('is_admin').eq('id', user.id).single();
    if (error || !data?.is_admin) {
      router.navigate(['/']);
      return false;
    }
    return true;
  } catch (e) {
    router.navigate(['/']);
    return false;
  }
};
