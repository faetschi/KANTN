import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-fab-button',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <button
      (click)="fabClick.emit()"
      class="{{ positionClass }} {{ color }} w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform"
    >
      <mat-icon>{{ icon }}</mat-icon>
    </button>
  `,
})
export class FabButtonComponent {
  @Input() icon = 'add';
  @Input() color = 'bg-blue-600 hover:bg-blue-700 text-white';
  @Input() positionClass = 'fixed bottom-24 right-6';
  @Output() fabClick = new EventEmitter<void>();
}
