import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-pending',
  standalone: true,
  template: `
    <div class="flex items-center justify-center h-screen">
      <div class="text-center p-6">
        <h2 class="text-2xl font-semibold mb-4">Account pending approval</h2>
        <p>Please wait for an administrator to approve your account. Contact support if needed.</p>
      </div>
    </div>
  `
})
export class PendingComponent implements OnInit, OnDestroy {
  private intervalId: any = null;

  constructor(private supabase: SupabaseService, private router: Router) {}

  ngOnInit(): void {
    // Poll every 3 seconds to check if the current user has been approved
    this.checkApproval();
    this.intervalId = setInterval(() => this.checkApproval(), 3000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private async checkApproval() {
    const client = this.supabase.getClient();
    if (!client) return;

    try {
      const { data: userData } = await client.auth.getUser();
      const user = (userData as any)?.user;
      if (!user) return;

      const { data: profile } = await client.from('profiles').select('approved').eq('id', user.id).maybeSingle();
      if (profile?.approved) {
        // stop polling and navigate to home
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
        this.router.navigate(['/']);
      }
    } catch (err) {
      // ignore transient errors; polling will continue
      console.warn('Pending check failed', err);
    }
  }
}
