import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center h-screen bg-white p-6">
      <div class="w-full max-w-sm text-center">
        <svg viewBox="0 0 100 100" class="w-20 h-20 mx-auto mb-6 drop-shadow-lg">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#6366f1"/>
              <stop offset="100%" stop-color="#8b5cf6"/>
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="20" fill="url(#logoGrad)"/>
          <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">
            <rect x="6" y="28" width="12" height="44" rx="3" fill="#fff" stroke="none"/>
            <rect x="14" y="22" width="8" height="56" rx="3" fill="#fff" stroke="none"/>
            <rect x="82" y="28" width="12" height="44" rx="3" fill="#fff" stroke="none"/>
            <rect x="78" y="22" width="8" height="56" rx="3" fill="#fff" stroke="none"/>
            <line x1="20" y1="50" x2="80" y2="50"/>
          </g>
        </svg>
        <h1 class="text-3xl font-bold text-gray-900 mb-2 tracking-tight">KANTN</h1>
        <p class="text-gray-500 mb-10">Your personal fitness companion</p>

        <div class="space-y-3">
          <button (click)="login()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center">
            <span>Login</span>
            <span class="material-icons ml-2 text-sm">login</span>
          </button>

          <button (click)="register()" class="w-full border border-blue-600 text-blue-600 font-semibold py-4 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center">
            <span>Register</span>
            <span class="material-icons ml-2 text-sm">person_add</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  async ngOnInit() {
    // If already logged in, skip login screen
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    const user = await this.authService.getSessionUser();
    if (user) {
      await this.authService.refreshProfile();
      this.router.navigate(['/home']);
    }
  }

  login() {
    // Start OAuth flow; the redirect will be handled by /oauth/consent
    this.authService.loginWithOAuth('google', 'login');
  }

  register() {
    // For OAuth, registration flows are handled by the provider/Supabase.
    // We reuse the same OAuth entry point — first-time users will be created.
    this.authService.loginWithOAuth('google', 'register');
  }
}
