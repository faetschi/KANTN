import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col pb-24">
      <main class="flex-1 overflow-y-auto">
        <router-outlet />
      </main>

      <!-- Bottom Navigation -->
      <nav class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        <a routerLink="/home" routerLinkActive="text-apple-blue" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center gap-1 text-apple-gray transition-colors">
          <i class="pi pi-home text-xl"></i>
          <span class="text-[10px] font-medium">Home</span>
        </a>
        <a routerLink="/plans" routerLinkActive="text-apple-blue" class="flex flex-col items-center gap-1 text-apple-gray transition-colors">
          <i class="pi pi-list text-xl"></i>
          <span class="text-[10px] font-medium">Plans</span>
        </a>
        <div class="relative -top-6">
          <button (click)="startQuickWorkout()" class="w-14 h-14 bg-apple-blue rounded-full flex items-center justify-center text-white shadow-lg shadow-apple-blue/40 active:scale-90 transition-transform">
            <i class="pi pi-plus text-2xl"></i>
          </button>
        </div>
        <a routerLink="/history" routerLinkActive="text-apple-blue" class="flex flex-col items-center gap-1 text-apple-gray transition-colors">
          <i class="pi pi-chart-bar text-xl"></i>
          <span class="text-[10px] font-medium">History</span>
        </a>
        <a routerLink="/profile" routerLinkActive="text-apple-blue" class="flex flex-col items-center gap-1 text-apple-gray transition-colors">
          <i class="pi pi-user text-xl"></i>
          <span class="text-[10px] font-medium">Profile</span>
        </a>
      </nav>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  startQuickWorkout() {
    // Logic for quick workout or navigation to plan selection
  }
}
