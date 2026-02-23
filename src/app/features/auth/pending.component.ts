import { Component } from '@angular/core';

@Component({
  selector: 'app-pending',
  standalone: true,
  template: `
    <div class="flex items-center justify-center h-screen">
      <div class="text-center p-6">
        <h2 class="text-2xl font-semibold mb-4">Account pending approval</h2>
        <p>Please wait for an administrator to approve your account. Contact support if needed.</p>
      </div>
    </div>
  `
})
export class PendingComponent {}
