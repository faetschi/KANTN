import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface ShareableItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    @if (visible) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="close()">
      <section class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 space-y-4" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <button type="button" (click)="close()" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="grid grid-cols-1 gap-3">
          <select [(ngModel)]="selectedItemId" (ngModelChange)="selectedItemIdChange.emit($event)" class="bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500">
            <option [ngValue]="''">Select {{ itemLabel }}</option>
            @for (item of items; track item.id) {
              <option [ngValue]="item.id">{{ item.name }}</option>
            }
          </select>
          <input
            type="email"
            [(ngModel)]="email"
            placeholder="user@example.com"
            class="bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="onShare()"
              [disabled]="sharing || unsharing"
              class="flex-1 bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
            >
              {{ sharing ? 'Sharing\u2026' : 'Share' }}
            </button>
            <button
              type="button"
              (click)="onUnshare()"
              [disabled]="sharing || unsharing"
              class="flex-1 bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
            >
              {{ unsharing ? 'Revoking\u2026' : 'Unshare' }}
            </button>
          </div>
        </div>
        @if (message) {
          <span class="text-xs" [class.text-red-500]="messageType === 'error'" [class.text-gray-500]="messageType !== 'error'">{{ message }}</span>
        }
      </section>
    </div>
    }
  `,
})
export class ShareDialogComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) itemLabel = '';
  @Input({ required: true }) items: ShareableItem[] = [];

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() selectedItemId = '';
  @Output() selectedItemIdChange = new EventEmitter<string>();

  @Input() sharing = false;
  @Input() unsharing = false;
  @Input() message = '';

  email = '';
  messageType: 'info' | 'error' = 'info';

  @Output() share = new EventEmitter<{ itemId: string; email: string }>();
  @Output() unshare = new EventEmitter<{ itemId: string; email: string }>();

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onShare() {
    if (!this.selectedItemId) {
      this.message = `Please select a ${this.itemLabel} to share.`;
      this.messageType = 'error';
      return;
    }
    if (!this.email.trim()) {
      this.message = 'Please enter an email address.';
      this.messageType = 'error';
      return;
    }
    this.share.emit({ itemId: this.selectedItemId, email: this.email.trim() });
  }

  onUnshare() {
    if (!this.selectedItemId) {
      this.message = `Please select a ${this.itemLabel} to unshare.`;
      this.messageType = 'error';
      return;
    }
    if (!this.email.trim()) {
      this.message = 'Please enter an email address.';
      this.messageType = 'error';
      return;
    }
    this.unshare.emit({ itemId: this.selectedItemId, email: this.email.trim() });
  }
}
