import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-oauth-consent',
  standalone: true,
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

  constructor(private router: Router, private supabase: SupabaseService) {}

  async ngOnInit() {
    const client = this.supabase.getClient();
    if (!client) {
      this.error = 'Supabase client not configured.';
      return;
    }

    try {
      // Parse the redirect URL and store session. supabase-js v2 provides getSessionFromUrl
      // if using a different version adjust accordingly.
      // @ts-ignore
      const { data, error } = await client.auth.getSessionFromUrl({ storeSession: true });
      if (error) throw error;

      // Navigate to home after successful sign in
      this.router.navigateByUrl('/home');
    } catch (err: any) {
      this.error = err?.message || String(err);
    }
  }
}
