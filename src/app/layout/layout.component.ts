import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../core/services/supabase.service';
import { AuthService } from '../core/services/auth.service';
import { NotificationOutletComponent } from '../shared/components/notification-outlet.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, NotificationOutletComponent],
  template: `
    <div class="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <main class="flex-1 overflow-y-auto pb-20">
        <router-outlet></router-outlet>
      </main>

      <app-notification-outlet />

      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <nav class="px-6 pt-3 pb-3 flex justify-between items-center">
          <a routerLink="/home" routerLinkActive="text-blue-600" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1">home</mat-icon>
            <span class="text-[10px] font-medium">Home</span>
          </a>
          <a routerLink="/plans" routerLinkActive="text-blue-600" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1">fitness_center</mat-icon>
            <span class="text-[10px] font-medium">Plans</span>
          </a>
          <a routerLink="/history" routerLinkActive="text-blue-600" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1">history</mat-icon>
            <span class="text-[10px] font-medium">History</span>
          </a>
          <a routerLink="/profile" routerLinkActive="text-blue-600" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1">person</mat-icon>
            <span class="text-[10px] font-medium">Profile</span>
          </a>
          <a *ngIf="isAdmin" routerLink="/admin" routerLinkActive="text-blue-600" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1">admin_panel_settings</mat-icon>
            <span class="text-[10px] font-medium">Admin</span>
          </a>
        </nav>
      </div>
    </div>
  `,
})
export class LayoutComponent implements OnInit {
  isAdmin = false;
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  async ngOnInit() {
    // Dev fallback: check AuthService first
    try {
      const cu: any = this.auth.currentUser();
      if (cu && cu.is_admin) {
        this.isAdmin = true;
        return;
      }
    } catch {}

    const client = this.supabase.getClient();
    if (!client) return;

    try {
      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData?.session?.user ?? null;
      if (!user) return;

      const { data, error } = await client.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
      if (!error && data?.is_admin) this.isAdmin = true;
    } catch (e) {
      // ignore
    }
  }
}
