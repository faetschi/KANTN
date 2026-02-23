import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center h-screen bg-white p-6">
      <div class="w-full max-w-sm text-center">
        <div class="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-200">
          <span class="material-icons text-white text-4xl">fitness_center</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2 tracking-tight">FitTrack Pro</h1>
        <p class="text-gray-500 mb-10">Your personal fitness companion</p>

        <button (click)="login()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center">
          <span>Get Started</span>
          <span class="material-icons ml-2 text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  login() {
    // Start OAuth flow; the redirect will be handled by /oauth/consent
    this.authService.loginWithOAuth('google');
  }
}
