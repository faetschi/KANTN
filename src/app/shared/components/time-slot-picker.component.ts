import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TimeSlot } from '../../core/models/models';

export interface TimeSlotItem {
  id: string | null;
  planName: string;
  timeSlot: TimeSlot | null;
}

function getCurrentDefaultSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getOppositeSlot(slot: TimeSlot): TimeSlot {
  if (slot === 'morning') return 'afternoon';
  if (slot === 'afternoon') return 'morning';
  return 'morning';
}

@Component({
  selector: 'app-time-slot-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
      <div class="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">

        @if (workouts().length === 2) {
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900">Schedule Workout</h3>
            <button type="button" (click)="cancel()" class="text-gray-400">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <p class="text-sm text-gray-500">
            When would you like to do <strong>{{ newWorkoutName() }}</strong>?
          </p>
          <div class="flex gap-3 pt-2">
            @for (slot of simpleSlots; track slot.value) {
              <button type="button" (click)="pickSimple(slot.value)"
                      class="flex-1 py-4 rounded-xl font-bold text-sm border-2 transition-all text-center"
                      [class.border-blue-500]="selectedSimpleSlot() === slot.value"
                      [class.bg-blue-50]="selectedSimpleSlot() === slot.value"
                      [class.border-gray-200]="selectedSimpleSlot() !== slot.value"
                      [class.bg-white]="selectedSimpleSlot() !== slot.value"
              >
                <div class="text-lg mb-1">{{ slot.emoji }}</div>
                <div>{{ slot.label }}</div>
              </button>
            }
          </div>

        } @else {
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900">Assign Time Slots</h3>
            <button type="button" (click)="cancel()" class="text-gray-400">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <p class="text-sm text-gray-500">Choose a time slot for each workout on this day.</p>

          <div class="space-y-3">
            @for (item of workouts(); track $index) {
              <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ item.planName }}</p>
                </div>
                <select
                  [ngModel]="item.timeSlot"
                  (ngModelChange)="onSlotChange($index, $event)"
                  class="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option [ngValue]="null">Pick time</option>
                  <option value="morning">🌅 Morning</option>
                  <option value="afternoon">☀️ Afternoon</option>
                  <option value="evening">🌙 Evening</option>
                </select>
              </div>
            }
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" (click)="cancel()" class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100">Cancel</button>
            <button type="button" (click)="save()" [disabled]="!allAssigned()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 disabled:opacity-50">Save</button>
          </div>
        }

      </div>
    </div>
  `,
})
export class TimeSlotPickerComponent {
  workouts = input.required<TimeSlotItem[]>();
  saved = output<TimeSlotItem[]>();
  cancelled = output<void>();

  simpleSlots = [
    { value: 'morning' as TimeSlot, label: 'Morning', emoji: '🌅' },
    { value: 'afternoon' as TimeSlot, label: 'Afternoon', emoji: '☀️' },
  ];

  private localSlots = signal<TimeSlotItem[]>([]);

  newWorkoutName = () => this.workouts().find(i => i.id === null)?.planName || '';

  selectedSimpleSlot = signal<TimeSlot | null>(getCurrentDefaultSlot());

  onSlotChange(index: number, slot: TimeSlot | null) {
    this.localSlots.update(list => {
      if (list.length === 0) return this.workouts().map((item, i) => i === index ? { ...item, timeSlot: slot } : { ...item });
      return list.map((item, i) => i === index ? { ...item, timeSlot: slot } : item);
    });
  }

  allAssigned(): boolean {
    const s = this.localSlots();
    if (s.length > 0) return s.every(item => item.timeSlot !== null);
    return this.workouts().every(item => item.timeSlot !== null);
  }

  pickSimple(slot: TimeSlot) {
    const items = this.workouts();
    const newIdx = items.findIndex(i => i.id === null);
    const existingIdx = items.findIndex(i => i.id !== null);

    if (newIdx === -1 || existingIdx === -1) return;

    const result = [...items];
    result[newIdx] = { ...result[newIdx], timeSlot: slot };
    result[existingIdx] = { ...result[existingIdx], timeSlot: getOppositeSlot(slot) };

    this.saved.emit(result);
  }

  save() {
    this.saved.emit(this.localSlots().length > 0 ? this.localSlots() : this.workouts());
  }

  cancel() {
    this.cancelled.emit();
  }
}
