import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-period-toggle',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-fit">
      @for (opt of options; track opt.value) {
        <button
          (click)="select(opt.value)"
          class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
          [ngClass]="value === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
})
export class PeriodToggleComponent {
  @Input() options: { label: string; value: string }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];
  @Input() value: string = 'month';
  @Output() valueChange = new EventEmitter<string>();

  select(val: string) {
    this.value = val;
    this.valueChange.emit(val);
  }
}
