import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/models';
import { MOCK_USER } from '../models/mock-data';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);

  currentUser = computed(() => this.currentUserSignal());

  constructor() {
    // Auto-login for demo
    this.login();
  }

  login() {
    this.currentUserSignal.set(MOCK_USER);
  }

  logout() {
    this.currentUserSignal.set(null);
  }

  isLoggedIn() {
    return !!this.currentUserSignal();
  }
}
