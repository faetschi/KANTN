import { Injectable, signal, computed, inject } from '@angular/core';
import { User } from '../models/models';
import { MOCK_USER } from '../models/mock-data';
import { SupabaseService } from './supabase.service';
import { Session } from '@supabase/supabase-js';

type DevWindow = Window & { __env?: { ENABLE_DEV_AUTH?: string }; __DEV_FAKE_AUTH?: boolean };
type CryptoWithUUID = Crypto & { randomUUID?: () => string };
type AuthUser = User & { is_admin?: boolean };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<AuthUser | null>(null);
  private profileLoadInFlight: Promise<void> | null = null;
  private sessionReadInFlight: Promise<Session | null> | null = null;

  currentUser = computed(() => this.currentUserSignal());

  constructor() {
    this.supabase = inject(SupabaseService);
    const devEnabled = typeof window !== 'undefined' && (window as DevWindow).__env?.ENABLE_DEV_AUTH === 'true';

    // Auto-login for demo only when explicitly enabled
    if (!this.supabase.getClient()) {
      if (devEnabled) this.login();
      return;
    }

    this.initializeSession();

    // Restore dev session from localStorage if present and dev auth enabled
    if (devEnabled) {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('dev_auth_user') : null;
        if (stored) {
          this.currentUserSignal.set(JSON.parse(stored) as AuthUser);
        }
      } catch (error) {
        console.warn('Failed to restore dev auth user from storage', error);
      }
    }
  }

  private supabase!: SupabaseService;

  private async initializeSession() {
    const client = this.supabase.getClient();
    if (!client) return;

    try {
      const session = await this.getSessionSafely();
      await this.loadProfileFromSession(session);
    } catch (error) {
      console.warn('Failed to load profile from session', error);
    }

    client.auth.onAuthStateChange((_event, session) => {
      void this.handleAuthStateChange(session);
    });
  }

  private async handleAuthStateChange(session: Session | null) {
    if (!session?.user) {
      this.currentUserSignal.set(null);
      return;
    }

    try {
      await this.loadProfileFromSession(session);
    } catch (error) {
      console.warn('Failed to refresh profile after auth change', error);
    }
  }

  private async getSessionSafely(): Promise<Session | null> {
    if (this.sessionReadInFlight) return this.sessionReadInFlight;

    this.sessionReadInFlight = this.getSessionSafelyInternal();
    try {
      return await this.sessionReadInFlight;
    } finally {
      this.sessionReadInFlight = null;
    }
  }

  private async getSessionSafelyInternal(): Promise<Session | null> {
    const client = this.supabase.getClient();
    if (!client) return null;

    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      return sessionData?.session ?? null;
    } catch (error: any) {
      const message = String(error?.message || error || '');
      const isLockTimeout = message.includes('Navigator LockManager lock') && message.includes('timed out');
      if (!isLockTimeout) throw error;

      await new Promise<void>((resolve) => setTimeout(resolve, 150));
      const { data: sessionData, error: retryError } = await client.auth.getSession();
      if (retryError) throw retryError;
      return sessionData?.session ?? null;
    }
  }

  async getSessionUser() {
    const session = await this.getSessionSafely();
    return session?.user ?? null;
  }

  private async loadProfileFromSession(session?: Session | null) {
    if (this.profileLoadInFlight) {
      await this.profileLoadInFlight;
      return;
    }

    this.profileLoadInFlight = this.loadProfileFromSessionInternal(session);
    try {
      await this.profileLoadInFlight;
    } finally {
      this.profileLoadInFlight = null;
    }
  }

  private async loadProfileFromSessionInternal(session?: Session | null) {
    const client = this.supabase.getClient();
    if (!client) return;

    const resolvedSession = session ?? await this.getSessionSafely();
    const user = resolvedSession?.user ?? null;
    if (!user) {
      this.currentUserSignal.set(null);
      return;
    }

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, email, display_name, avatar_url, fun_fact, height, weight, age, is_admin')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const mapped: AuthUser = {
      id: user.id,
      name: profile?.display_name || user.user_metadata?.['name'] || user.email || 'User',
      email: user.email || profile?.email || '',
      height: profile?.height ?? 0,
      weight: profile?.weight ?? 0,
      age: profile?.age ?? 0,
      avatarUrl: profile?.avatar_url || user.user_metadata?.['avatar_url'] || undefined,
      funFact: profile?.fun_fact || undefined,
      is_admin: !!profile?.is_admin,
    };

    this.currentUserSignal.set(mapped);
  }

  login() {
    this.currentUserSignal.set(MOCK_USER);
  }

  async loginWithOAuth(provider: 'google' | 'github' = 'google', mode: 'login' | 'register' = 'login') {
    const client = this.supabase.getClient();
    // Dev fallback: when running on localhost and provider may not be enabled, create a fake user
    const devWindow = typeof window !== 'undefined' ? (window as DevWindow) : undefined;
    const isLocal = devWindow ? (devWindow.location.hostname === 'localhost' || devWindow.location.hostname === '127.0.0.1') : false;
    const devEnabled = devWindow?.__env?.ENABLE_DEV_AUTH === 'true';
    if (isLocal && devEnabled) {
      await this.devLogin();
      return;
    }

    if (!client) return this.login();

    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem('auth_mode', mode);
    } catch (error) {
      console.warn('Failed to persist auth mode', error);
    }

    await client.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/oauth/consent` } });
  }

  logout() {
    this.currentUserSignal.set(null);
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem('dev_auth_user');
    } catch (error) {
      console.warn('Failed to clear dev auth user from storage', error);
    }

    const client = this.supabase.getClient();
    if (client) {
      client.auth.signOut().catch((error) => {
        console.warn('Failed to sign out of Supabase', error);
      });
    }
  }

  isLoggedIn() {
    return !!this.currentUserSignal();
  }

  async refreshProfile() {
    try {
      await this.loadProfileFromSession();
    } catch (error) {
      console.warn('Failed to refresh profile', error);
    }
  }

  async devLogin(opts?: { isAdmin?: boolean }) {
    const cryptoApi: CryptoWithUUID | undefined = typeof crypto !== 'undefined' ? (crypto as CryptoWithUUID) : undefined;
    const id = cryptoApi?.randomUUID ? cryptoApi.randomUUID() : `dev-${Date.now()}`;
    const fake: AuthUser = {
      id,
      name: 'Dev User',
      email: `dev+${Date.now()}@example.local`,
      height: 180,
      weight: 75,
      age: 30,
      is_admin: !!opts?.isAdmin,
    };
    this.currentUserSignal.set(fake);

    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem('dev_auth_user', JSON.stringify(fake));
    } catch (error) {
      console.warn('Failed to persist dev auth user to storage', error);
    }

    // If a Supabase session exists, upsert a profile so server-side checks continue to work.
    // Avoids 401s when using dev auth without an authenticated session.
    const client = this.supabase.getClient();
    if (client) {
      try {
        const session = await this.getSessionSafely();
        if (session) {
          await client
            .from('profiles')
            .upsert({ id: fake.id, email: fake.email, display_name: fake.name, approved: true, is_admin: !!opts?.isAdmin }, { onConflict: 'id' });
        }
      } catch (error) {
        console.warn('Failed to upsert dev auth profile', error);
      }
    }
  }
}
