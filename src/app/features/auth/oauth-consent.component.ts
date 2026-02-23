import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

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

  constructor(private router: Router) {}

  async ngOnInit() {
    const client = this.supabase.getClient();
    if (!client) {
      this.error = 'Supabase client not configured.';
      return;
    }

    try {
      // Parse the redirect URL and store session.
      // @ts-ignore
      const { data: sessionData, error: sessionError } = await client.auth.getSessionFromUrl({ storeSession: true });
      if (sessionError) throw sessionError;

      // Get user
      const { data: userData } = await client.auth.getUser();
      const user = (userData as any)?.user;
      if (!user) {
        this.error = 'No user returned from Supabase.';
        return;
      }

      // Upsert profile (approved defaults to false)
      await client.from('profiles').upsert({ id: user.id, email: user.email, display_name: user.user_metadata?.name || null }, { onConflict: 'id' });

      // Fetch approval status
      const { data: profile, error: profileError } = await client.from('profiles').select('approved').eq('id', user.id).maybeSingle();
      if (profileError) throw profileError;

      if (profile?.approved) {
        this.router.navigateByUrl('/home');
      } else {
        this.error = 'Your account is pending approval. Please wait for admin approval.';
      }
    } catch (err: any) {
      this.error = err?.message || String(err);
    }
  }
}
