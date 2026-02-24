import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private supabase: SupabaseService) {}

  private async wait(ms: number) {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private async getReadyClient() {
    const client = this.supabase.getClient();
    if (!client) return { client: null, error: 'Supabase client not initialized' };

    // Wait for auth/session bootstrap.
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data, error } = await client.auth.getSession();
      
      if (!error && data?.session?.user) {
        // If we have a session, ensure it's not stale by checking if it's expired
        const expiresAt = data.session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt && expiresAt < now + 60) {
          // Token is expired or about to expire, force refresh
          try {
            await client.auth.refreshSession();
          } catch {
            // ignore
          }
        }
        return { client, error: null };
      }

      await this.wait(250);
    }

    return { client: null, error: 'Supabase session not ready' };
  }

  private async withRetry<T extends { error?: any }>(operation: () => PromiseLike<T>, retries = 2, delayMs = 300): Promise<T> {
    let lastResult: T | undefined;
    let lastError: any;
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await Promise.resolve(operation());
        if (res && res.error) {
          lastResult = res;
          throw res.error;
        }
        return res;
      } catch (e) {
        lastError = e;
        if (i < retries) {
          // If it's an auth/RLS error, try to refresh the session
          try {
            const client = this.supabase.getClient();
            if (client) await client.auth.refreshSession();
          } catch (refreshErr) {
            // ignore
          }
          await this.wait(delayMs);
        }
      }
    }
    return lastResult !== undefined ? lastResult : { error: lastError } as any;
  }

  async getPendingUsers() {
    const { client, error } = await this.getReadyClient();
    if (!client) return { data: [], error };

    return this.withRetry(() =>
      client.from('profiles').select('id, email, display_name, created_at').eq('approved', false)
    );
  }

  async getAllUsers() {
    const { client, error } = await this.getReadyClient();
    if (!client) return { data: [], error };

    return this.withRetry(() =>
      client
        .from('profiles')
        .select('id, email, display_name, created_at, approved, is_admin')
        .order('created_at', { ascending: false })
    );
  }

  async approveUser(id: string) {
    const { client, error } = await this.getReadyClient();
    if (!client) return { data: null, error };

    return this.withRetry(() => client.from('profiles').update({ approved: true }).eq('id', id));
  }

  async revokeUser(id: string) {
    const { client, error } = await this.getReadyClient();
    if (!client) return { data: null, error };

    return this.withRetry(() => client.from('profiles').update({ approved: false }).eq('id', id));
  }

  async declineUser(id: string) {
    const { client, error } = await this.getReadyClient();
    if (!client) return { data: null, error };

    // Remove the profile record for declined registrations
    return this.withRetry(() => client.from('profiles').delete().eq('id', id));
  }
}
