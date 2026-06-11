import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-period-toggle',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="flex items-center gap-1 w-fit">
      @for (opt of options; track opt.value) {
        <button
          (click)="select(opt.value)"
          class="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
          [ngClass]="value === opt.value ? activeClass : inactiveClass"
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
  @Input() activeClass = 'bg-white text-gray-900 shadow-sm';
  @Input() inactiveClass = 'text-gray-500';
  @Output() valueChange = new EventEmitter<string>();

  select(val: string) {
    this.value = val;
    this.valueChange.emit(val);
  }
}
