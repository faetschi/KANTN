import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributionDay } from '../../core/models/activity-models';
import { intensityColor, getMonthLabels } from '../../core/domain/activity-utils';

@Component({
  selector: 'app-contribution-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contribution-grid">
      <div class="flex text-[10px] text-gray-400 font-semibold mb-1 gap-0" style="padding-left: 0;">
        @for (ml of monthLabels; track ml.index) {
          <span class="text-center" [style.minWidth.px]="compact ? 6 : 14">{{ ml.label }}</span>
        }
      </div>
      <div class="overflow-x-auto no-scrollbar">
        <div class="grid gap-[2px]" [style.gridTemplateColumns]="'repeat(' + numWeeks + ', 1fr)'" [style.minWidth.px]="compact ? numWeeks * 8 : numWeeks * 16">
          @for (day of data; track day.date.toISOString()) {
            <div
              class="rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
              [style.aspectRatio]="'1/1'"
              [style.backgroundColor]="intensityColor(day.intensity, colorScheme)"
              [title]="day.date.toLocaleDateString() + ': ' + day.count + ' sessions'"
              (click)="onCellClick(day)"
            ></div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ContributionGridComponent {
  @Input() data: ContributionDay[] = [];
  @Input() colorScheme: string = 'blue';
  @Input() compact: boolean = false;
  @Output() cellClick = new EventEmitter<{ date: Date; count: number }>();

  intensityColor = intensityColor;

  get monthLabels() {
    if (this.data.length === 0) return [];
    const year = this.data[0].date.getFullYear();
    return getMonthLabels(year);
  }

  get numWeeks(): number {
    return Math.ceil(this.data.length / 7);
  }

  onCellClick(day: ContributionDay) {
    if (day.count > 0) {
      this.cellClick.emit({ date: day.date, count: day.count });
    }
  }
}
