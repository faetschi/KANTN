import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="relative">
      <input
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        [placeholder]="placeholder"
        class="w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-2 focus:ring-2 focus:ring-blue-500"
      />
      <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</mat-icon>
      <button
        *ngIf="value"
        type="button"
        (click)="clear()"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label="Clear search"
      >
        <mat-icon class="text-base">close</mat-icon>
      </button>
    </div>
  `,
})
export class SearchBarComponent {
  @Input() placeholder = 'Search';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  onValueChange(next: string) {
    this.valueChange.emit(next);
  }

  clear() {
    this.valueChange.emit('');
  }
}
