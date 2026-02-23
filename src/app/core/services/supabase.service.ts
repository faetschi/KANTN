import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  client: SupabaseClient | null = null;

  constructor() {
    // Read keys from global window variables (set locally or injected at build time)
    const url = (window as any)['SUPABASE_URL'] || (window as any)['__env']?.SUPABASE_URL;
    const key = (window as any)['SUPABASE_ANON_KEY'] || (window as any)['__env']?.SUPABASE_ANON_KEY;

    if (url && key) {
      this.client = createClient(url, key);
    } else {
      console.warn('Supabase keys not found on window. SupabaseClient not initialized.');
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }
}
