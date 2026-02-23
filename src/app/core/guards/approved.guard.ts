import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class ApprovedGuard implements CanActivate {
  constructor(private supabase: SupabaseService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const client = this.supabase.getClient();
    if (!client) {
      this.router.navigate(['/login']);
      return false;
    }

    const { data: userData } = await client.auth.getUser();
    const user = (userData as any)?.user;
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const { data: profile } = await client.from('profiles').select('approved').eq('id', user.id).maybeSingle();
    if (profile?.approved) return true;

    this.router.navigate(['/pending']);
    return false;
  }
}
