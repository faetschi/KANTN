import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
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
        <nav class="px-8 pt-3 pb-3 flex justify-around items-center">
          <a routerLink="/home" routerLinkActive="text-blue-600 active" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1 text-current">home</mat-icon>
            <span class="text-[10px] font-medium">Home</span>
          </a>
          <a routerLink="/plans" routerLinkActive="text-blue-600 active" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1 text-current">fitness_center</mat-icon>
            <span class="text-[10px] font-medium">Plans</span>
          </a>
          <a routerLink="/calendar" routerLinkActive="text-blue-600 active" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1 text-current">calendar_month</mat-icon>
            <span class="text-[10px] font-medium">Calendar</span>
          </a>
        </nav>
      </div>
    </div>
  `,
  styles: [
    `a mat-icon { color: inherit; }
     a.active mat-icon, a.text-blue-600 mat-icon { color: #2563eb; }    `
  ],
})
export class LayoutComponent {
}
