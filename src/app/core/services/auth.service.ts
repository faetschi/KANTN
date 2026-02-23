import { Injectable, signal, computed, inject } from '@angular/core';
import { User } from '../models/models';
import { MOCK_USER } from '../models/mock-data';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);

  currentUser = computed(() => this.currentUserSignal());

  constructor() {
    this.supabase = inject(SupabaseService);
    // Auto-login for demo using mock user when no Supabase configured
    if (!this.supabase.getClient()) {
      this.login();
    }
  }

  private supabase!: SupabaseService;

  login() {
    this.currentUserSignal.set(MOCK_USER);
  }

  async loginWithOAuth(provider: 'google' | 'github' = 'google') {
    const client = this.supabase.getClient();
    if (!client) return this.login();

    await client.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/oauth/consent` } });
  }

  logout() {
    this.currentUserSignal.set(null);
  }

  isLoggedIn() {
    return !!this.currentUserSignal();
  }
}
