import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <main class="flex-1 overflow-y-auto pb-20">
        <router-outlet></router-outlet>
      </main>

      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 safe-area-pb">
        <a routerLink="/home" routerLinkActive="text-blue-600" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
          <mat-icon class="mb-1">home</mat-icon>
          <span class="text-[10px] font-medium">Home</span>
        </a>
        <a routerLink="/plans" routerLinkActive="text-blue-600" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
          <mat-icon class="mb-1">fitness_center</mat-icon>
          <span class="text-[10px] font-medium">Plans</span>
        </a>
        <a routerLink="/profile" routerLinkActive="text-blue-600" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
          <mat-icon class="mb-1">person</mat-icon>
          <span class="text-[10px] font-medium">Profile</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .safe-area-pb {
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }
  `]
})
export class LayoutComponent {}
