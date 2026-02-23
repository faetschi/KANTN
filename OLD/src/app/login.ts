import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ButtonModule, InputTextModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div class="w-full max-w-md space-y-8">
        <div class="text-center">
          <div class="w-20 h-20 bg-apple-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-apple-blue/30">
            <i class="pi pi-bolt text-white text-4xl"></i>
          </div>
          <h1 class="text-4xl font-bold tracking-tight text-slate-900">FitTrack Pro</h1>
          <p class="mt-2 text-apple-gray">Your personal fitness companion</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div class="space-y-4">
            <div class="flex flex-col gap-2">
              <label for="email" class="text-sm font-medium text-slate-700 ml-1">Email</label>
              <input 
                id="email"
                pInputText 
                formControlName="email" 
                placeholder="name@example.com" 
                class="w-full !rounded-xl !border-slate-200 !bg-slate-50 !p-4 focus:!ring-2 focus:!ring-apple-blue/20"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="password" class="text-sm font-medium text-slate-700 ml-1">Password</label>
              <input 
                id="password"
                pInputText 
                type="password" 
                formControlName="password" 
                placeholder="••••••••" 
                class="w-full !rounded-xl !border-slate-200 !bg-slate-50 !p-4 focus:!ring-2 focus:!ring-apple-blue/20"
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full ios-button-primary !py-4 text-lg shadow-lg shadow-apple-blue/20"
            [disabled]="loginForm.invalid"
          >
            Sign In
          </button>
        </form>

        <div class="text-center">
          <p class="text-sm text-apple-gray">
            Don't have an account? 
            <a href="#" class="text-apple-blue font-semibold">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.router.navigate(['/home']);
    }
  }
}
