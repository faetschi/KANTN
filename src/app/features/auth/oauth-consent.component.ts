import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-oauth-consent',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center h-screen">
      <div class="text-center">
        <h2 class="text-2xl font-semibold mb-4">Completing sign in…</h2>
        <p *ngIf="error" class="text-red-600">{{ error }}</p>
      </div>
    </div>
  `
})
export class OAuthConsentComponent implements OnInit {
  error?: string;
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  constructor(private router: Router) {}

  async ngOnInit() {
    const client = this.supabase.getClient();

    // Dev fallback: if ENABLE_DEV_AUTH set or auth service has a dev session, complete dev login
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const devEnabled = typeof window !== 'undefined' && (window as any).__env?.ENABLE_DEV_AUTH === 'true';
    if (isLocal && (devEnabled || this.auth.isLoggedIn())) {
      // If AuthService already has a dev session, continue
      if (!this.auth.isLoggedIn()) {
        await this.auth.devLogin({ isAdmin: false });
      }
      this.router.navigateByUrl('/home');
      return;
    }

    if (!client) {
      this.error = 'Supabase client not configured.';
      return;
    }

    try {
      const currentUrl = typeof window !== 'undefined' ? new URL(window.location.href) : null;
      const errorDescription = currentUrl?.searchParams.get('error_description');
      if (errorDescription) throw new Error(errorDescription);

      const code = currentUrl?.searchParams.get('code');

      // Use PKCE code exchange when present. If no code, rely on existing session.
      if (code && typeof client.auth.exchangeCodeForSession === 'function') {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else {
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData?.session) {
          throw new Error('No auth session found after redirect');
        }
      }

      // Get user
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      const user = (userData as any)?.user;
      if (!user) {
        this.error = 'No user returned from Supabase.';
        return;
      }

      let mode: 'login' | 'register' = 'login';
      try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_mode') : null;
        if (stored === 'register' || stored === 'login') mode = stored;
        if (typeof localStorage !== 'undefined') localStorage.removeItem('auth_mode');
      } catch (error) {
        console.warn('Failed to read auth mode', error);
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await client.from('profiles').select('id, approved').eq('id', user.id).maybeSingle();
      if (profileError) throw profileError;

      if (mode === 'register') {
        if (profile?.id) {
          await client.auth.signOut();
          this.error = 'Account already registered. Please login instead.';
          return;
        }

        const { error: insertError } = await client
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          });
        if (insertError) throw insertError;

        await this.auth.refreshProfile();
        this.router.navigateByUrl('/pending');
        return;
      }

      // login mode
      if (!profile?.id) {
        await client.auth.signOut();
        this.error = 'No account found. Please register first.';
        return;
      }

      if (profile?.approved) {
        await this.auth.refreshProfile();
        this.router.navigateByUrl('/home');
      } else {
        this.error = 'Your account is pending approval. Please wait for admin approval.';
      }
    } catch (err: any) {
      this.error = err?.message || String(err);
    }
  }
}
