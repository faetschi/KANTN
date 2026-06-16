import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributionDay } from '../../core/models/activity-models';
import { intensityColor } from '../../core/domain/activity-utils';

@Component({
  selector: 'app-contribution-grid',
  standalone: true,
  imports: [CommonModule],
  styles: `
    .active-cell { cursor: pointer; }
    .active-cell:hover { opacity: 0.8; }
  `,
  template: `
    <div class="contribution-grid w-full">
      <div
        class="grid gap-[2px] w-full"
        [style.gridTemplateColumns]="'repeat(' + numColumns + ', 1fr)'"
      >
        @for (day of paddedData; track $index) {
          <div
            class="rounded-sm transition-opacity aspect-square"
            [class.active-cell]="day.count > 0"
            [style.backgroundColor]="intensityColor(day.intensity, 'green')"
            [title]="day.count > 0 ? (day.date.toLocaleDateString() + ': ' + day.count + ' sessions') : ''"
            (click)="day.count > 0 && onCellClick(day)"
          ></div>
        }
      </div>
    </div>
  `,
})
export class ContributionGridComponent {
  @Input() data: ContributionDay[] = [];
  @Input() compact: boolean = false;
  @Output() cellClick = new EventEmitter<{ date: Date; count: number }>();

  intensityColor = intensityColor;

  private get emptyDay(): ContributionDay {
    return { date: new Date(), count: 0, intensity: 0 };
  }

  get paddedData(): ContributionDay[] {
    if (this.data.length === 0) return [];

    const firstDay = this.data[0].date.getDay();
    const padDays = firstDay === 0 ? 6 : firstDay - 1;
    const padding: ContributionDay[] = [];
    for (let i = 0; i < padDays; i++) {
      padding.push(this.emptyDay);
    }
    return [...padding, ...this.data];
  }

  get numColumns(): number {
    return Math.ceil(this.paddedData.length / 7);
  }

  onCellClick(day: ContributionDay) {
    if (day.count > 0) {
      this.cellClick.emit({ date: day.date, count: day.count });
    }
  }
}
