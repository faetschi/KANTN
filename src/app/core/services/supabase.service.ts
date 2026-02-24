import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  client: SupabaseClient | null = null;

  constructor() {
    // Read keys from window.__env (generated from .env at dev/build time)
    if (typeof window !== 'undefined') {
      const env = (window as any).__env || {};
      const normalize = (val: any) => {
        if (!val) return '';
        let v = String(val).trim();
        // strip trailing semicolon left from some env generators
        v = v.replace(/;$/, '').trim();
        // strip surrounding quotes if present
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1).trim();
        }
        // final trim of any stray quotes
        v = v.replace(/^['\"]|['\"]$/g, '').trim();
        return v;
      };

      const url = normalize(env.SUPABASE_URL || env.VITE_SUPABASE_URL || '');
      const key = normalize(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '');

      const isValidUrl = (candidate: string) => {
        try {
          const u = new URL(candidate);
          return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
          return false;
        }
      };

      if (url && key && isValidUrl(url)) {
        // Prevent accidental use of localhost-supabase in production builds
        if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          if (url.includes('localhost') || url.includes('127.0.0.1')) {
            console.warn('Supabase URL looks like localhost — ensure production build uses the real Supabase project URL.');
          }
        }

        this.client = createClient(url, key);
      } else if (url || key) {
        console.warn('Supabase keys present but invalid. Skipping client init. Check SUPABASE_URL and SUPABASE_ANON_KEY.');
      } else {
        console.warn('Supabase keys not found in window.__env. SupabaseClient not initialized.');
      }
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }
}
