import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { generateInitialsAvatar } from '../domain/avatar-utils';

export interface PublicProfile {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  funFact?: string;
  height: number;
  weight: number;
  age: number;
  lastSeen?: string;
}

interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  fun_fact: string | null;
  height: number | null;
  weight: number | null;
  age: number | null;
  last_seen: string | null;
  approved: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private supabase = inject(SupabaseService);

  async getProfileByUsername(username: string): Promise<PublicProfile | null> {
    const client = this.supabase.getClient();
    if (!client) return null;

    const normalized = username.trim().toLowerCase();
    if (!normalized) return null;

    const { data, error } = await client.rpc('get_public_profile_by_username', {
      p_username: normalized,
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) return null;

    const row = data[0] as ProfileRow;
    if (!row.username) return null;

    return {
      id: row.id,
      username: row.username,
      name: row.display_name || 'User',
      avatarUrl: row.avatar_url || generateInitialsAvatar(row.display_name || row.username),
      funFact: row.fun_fact || undefined,
      height: row.height ?? 0,
      weight: row.weight ?? 0,
      age: row.age ?? 0,
      lastSeen: row.last_seen || undefined,
    };
  }
}
