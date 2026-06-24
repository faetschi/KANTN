import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { CardioExerciseData, Exercise, InProgressWorkout, WorkoutSession, Set as WorkoutSet } from '../../core/models/models';
import { SearchBarComponent } from '../../shared/components/search-bar.component';
import { getWorkoutTypeVisual, workoutTypeBadgeStyle, deriveWorkoutPlanType, getWorkoutTypeEmoji } from '../../core/domain/workout-types';
import { resolveDefault, resolveCardioDefaults, getUnitMismatchMessage, sourceLabel, DefaultSource } from '../../core/domain/smart-defaults';
import { computeCardioMetrics, createVirtualCardioExercise } from '../../core/domain/cardio-utils';
import { CardioMapComponent } from './cardio-map.component';

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, SearchBarComponent, CardioMapComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-white">
      <!-- Header -->
      <header class="sticky top-0 z-20 bg-white px-6 py-3 flex justify-between items-center border-b border-gray-100">
        <button (click)="openExitOptions()" class="text-gray-400">
          <mat-icon>close</mat-icon>
        </button>
        <div class="text-center">
          <h2 class="font-bold text-gray-900">{{ workoutTitle() }}</h2>
          @if (paused()) {
            <p class="text-xs text-yellow-600 font-mono">PAUSED — {{ formatTime(elapsedTime()) }}</p>
          } @else {
            <p class="text-xs text-blue-600 font-mono">{{ formatTime(elapsedTime()) }}</p>
          }
        </div>
        <div class="flex items-center gap-2">
          <button (click)="finishWorkout()" class="text-blue-600 font-bold text-sm">
            Finish
          </button>
        </div>
      </header>

      @if (isCardioExercise() && currentExercise(); as exercise) {
        <!-- Cardio Layout: map fills, metrics anchored at bottom -->
        <div class="flex-1 flex flex-col min-h-0">
          <div class="flex-1 min-h-0 p-6 pb-3 flex flex-col">
            @if (saveErrorMessage) {
              <div class="mb-3 rounded-xl bg-red-50 text-red-600 text-sm px-4 py-3 border border-red-100 shrink-0">{{ saveErrorMessage }}</div>
            }

            @if (currentCardioData()?.gpsEnabled) {
              <div class="flex-none h-[50vh] max-h-[50vh] min-h-[240px] w-full">
                <app-cardio-map
                  [gpsCoordinates]="currentCardioData()?.gpsCoordinates || []"
                  [currentPosition]="currentCardioPosition()"
                />
              </div>
            } @else {
              <div class="flex-none h-[50vh] max-h-[50vh] min-h-[240px] w-full rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-2">
                <mat-icon class="text-4xl text-gray-300">map</mat-icon>
                <p class="text-sm text-gray-400">Enable GPS to view your route</p>
              </div>
            }
          </div>

          <div class="shrink-0 px-6 pb-6 space-y-3">
            <div class="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <div class="flex items-center justify-between">
                <div class="flex-1 text-center">
                  <div class="text-4xl font-bold text-orange-600 font-mono">
                    {{ formatTime(elapsedTime()) }}
                  </div>
                  <div class="text-xs text-orange-500 uppercase tracking-wide mt-1">Elapsed Time</div>
                </div>
                <button (click)="togglePause()"
                        class="w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0 ml-3"
                        [class.bg-yellow-400]="paused()"
                        [class.text-white]="paused()"
                        [class.bg-gray-100]="!paused()"
                        [class.text-gray-600]="!paused()"
                        [title]="paused() ? 'Resume' : 'Pause'">
                  <mat-icon class="text-2xl">{{ paused() ? 'play_arrow' : 'pause' }}</mat-icon>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="text-center bg-white rounded-xl p-3">
                <div class="text-lg font-bold text-gray-900">
                  {{ currentCardioData() ? formatDistance(currentCardioData()!.distanceMeters) : '0m' }}
                </div>
                <div class="text-xs text-gray-500 uppercase">Distance</div>
              </div>
              <div class="text-center bg-white rounded-xl p-3">
                <div class="text-lg font-bold text-gray-900">
                  {{ currentCardioData() ? formatPace(currentCardioData()!.avgPaceSecondsPerKm) : '--:--' }}
                </div>
                <div class="text-xs text-gray-500 uppercase">Avg Pace</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="text-center bg-white rounded-xl p-3">
                <div class="text-lg font-bold text-gray-900">
                  {{ currentCardioData() ? formatPace(currentCardioData()!.currentPaceSecondsPerKm) : '--:--' }}
                </div>
                <div class="text-xs text-gray-500 uppercase">Current Pace</div>
              </div>
              <div class="text-center bg-white rounded-xl p-3">
                <div class="text-lg font-bold text-gray-900">
                  {{ currentCardioData() ? (currentCardioData()!.avgSpeedKmh | number:'1.1-1') : '0.0' }}
                </div>
                <div class="text-xs text-gray-500 uppercase">km/h</div>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <button (click)="toggleGPS()"
                      [class.bg-green-500]="currentCardioData()?.gpsEnabled"
                      [class.bg-gray-200]="!currentCardioData()?.gpsEnabled"
                      class="px-4 py-2 rounded-xl text-sm font-semibold text-white">
                GPS {{ currentCardioData()?.gpsEnabled ? 'ON' : 'OFF' }}
              </button>
              @if (!currentCardioData()?.gpsEnabled) {
                <button (click)="enterManualDistance()"
                        class="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold">
                  Enter Distance
                </button>
              }
            </div>
          </div>
        </div>
      } @else {
        <!-- Strength / Default scrollable layout -->
        <div class="flex-1 p-6 workout-content" #workoutContent>
          @if (saveErrorMessage) {
            <div class="mb-4 rounded-xl bg-red-50 text-red-600 text-sm px-4 py-3 border border-red-100">{{ saveErrorMessage }}</div>
          }

          @if (showMissingExercisesBanner() && missingExercises().length > 0) {
            <div class="mb-4 rounded-xl bg-yellow-50 text-yellow-800 text-sm px-4 py-3 border border-yellow-200 flex items-start gap-2">
              <mat-icon class="text-yellow-600 text-base mt-0.5">warning</mat-icon>
              <div>
                <p class="font-semibold">Exercises removed</p>
                <p>The following exercises are no longer available: {{ missingExercises().join(', ') }}. Add a replacement from your exercises.</p>
                <button type="button" (click)="showExercisePicker = true; showMissingExercisesBanner.set(false)" class="mt-2 text-blue-600 font-semibold text-xs underline">
                  Add Exercise
                </button>
              </div>
            </div>
          }



          @if (currentExercise(); as exercise) {
            @if (!showFreestylePicker()) {
            <div class="mb-8 animate-fade-in">
              <div class="aspect-video rounded-2xl overflow-hidden mb-6 shadow-sm bg-gray-100">
                <img [src]="exercise.imageUrl" [alt]="exercise.name" class="w-full h-full object-cover">
              </div>

              <div class="flex justify-between items-start mb-2">
                <h1 class="text-2xl font-bold text-gray-900">{{ exercise.name }}</h1>
                <button class="text-blue-600 text-sm font-medium" (click)="showInfo = !showInfo">
                  {{ showInfo ? 'Hide Info' : 'Info' }}
                </button>
              </div>

              @if (showInfo) {
                <p class="text-gray-500 text-sm mb-6 bg-gray-50 p-4 rounded-xl">{{ exercise.description }}</p>
              }

              <!-- Quick confirm actions -->
              <div class="flex gap-2 mb-4">
                <button (click)="confirmCurrentExercise()"
                        class="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm shadow-sm active:scale-95 transition-transform">
                  <mat-icon class="text-[16px] align-middle" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                  Confirm All Sets
                </button>
                <button (click)="resetExerciseToDefaults()"
                        class="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm">
                  <mat-icon class="text-[16px] align-middle" style="font-size:16px;width:16px;height:16px;">refresh</mat-icon>
                  Reset
                </button>
              </div>

              <!-- Strength UI (sets/reps/weight) -->
              <div class="space-y-1">
                <div class="grid grid-cols-4 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-2">
                  <span>Set</span>
                  <span>Kg</span>
                  <span>Reps</span>
                  <span>Done</span>
                </div>

                @for (set of currentSets(); track $index) {
                  <div
                    class="grid grid-cols-4 gap-4 items-center rounded-xl px-2 py-2 transition-colors border"
                    [class.bg-green-50]="set.completed"
                    [class.border-green-300]="set.completed"
                    [class.bg-white]="!set.completed"
                    [class.border-2]="!set.completed && set.source === 'plan_target'"
                    [class.border-blue-200]="!set.completed && set.source === 'plan_target'"
                    [class.border-dashed]="!set.completed && set.source === 'plan_target'"
                    [class.border-2]="!set.completed && set.source === 'last_workout'"
                    [class.border-purple-200]="!set.completed && set.source === 'last_workout'"
                    [class.border-dashed]="!set.completed && set.source === 'last_workout'"
                    [class.border]="!set.completed && !set.source"
                    [class.border-gray-200]="!set.completed && !set.source"
                    [class.border-transparent]="set.completed"
                  >
                    <div class="flex justify-center flex-col items-center">
                      <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                        {{ $index + 1 }}
                      </div>
                      @if (set.source) {
                        <span class="text-[8px] mt-0.5 uppercase tracking-wider font-semibold"
                              [class.text-blue-500]="set.source === 'plan_target'"
                              [class.text-purple-500]="set.source === 'last_workout'">
                          {{ setSourceLabel(set) }}
                        </span>
                      }
                    </div>
                    <input type="number" [(ngModel)]="set.weight" (ngModelChange)="markSetEdited(set)" 
                           class="bg-gray-50 border-none rounded-xl text-center font-bold text-gray-900 py-2 focus:ring-2 focus:ring-blue-500"
                           [attr.aria-label]="'Weight in kg' + (set.source ? ', ' + setSourceLabel(set) : '')">
                    <input type="number" [(ngModel)]="set.reps" (ngModelChange)="markSetEdited(set)"
                           class="bg-gray-50 border-none rounded-xl text-center font-bold text-gray-900 py-2 focus:ring-2 focus:ring-blue-500"
                           [attr.aria-label]="'Reps' + (set.source ? ', ' + setSourceLabel(set) : '')">
                    <button (click)="toggleSet($index)"
                            [class.bg-green-500]="set.completed"
                            [class.text-white]="set.completed"
                            [class.bg-gray-100]="!set.completed"
                            [class.text-gray-300]="!set.completed"
                            class="h-10 w-full rounded-xl flex items-center justify-center transition-colors active:scale-95"
                            [attr.aria-label]="set.completed ? 'Mark set as incomplete' : 'Mark set as complete'">
                      <mat-icon [class.animate-pop]="set.completed">check</mat-icon>
                    </button>
                  </div>
                  <div class="flex justify-end mt-1">
                    <button
                      type="button"
                      (click)="removeSet($index)"
                      [disabled]="currentSets().length <= 1"
                      class="text-xs text-red-500 disabled:text-gray-300"
                    >
                      Remove
                    </button>
                  </div>
                }

                <button (click)="addSet()" class="w-full py-3 mt-4 text-blue-600 font-semibold text-sm bg-blue-50 rounded-xl border border-blue-100 border-dashed">
                  + Add Set
                </button>
              </div>

              <!-- Undo toast -->
              @if (undoMessage()) {
                <div class="fixed bottom-24 left-4 right-4 z-50 flex justify-center pointer-events-none">
                  <div class="bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-3 pointer-events-auto">
                    <span>{{ undoMessage() }}</span>
                    <button (click)="undoLastAction()" class="text-blue-300 font-bold underline">Undo</button>
                    <button (click)="dismissUndo()" class="text-gray-400">
                      <mat-icon class="text-base" style="font-size:16px;width:16px;height:16px;">close</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
            }
          } @else {
            <div class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p class="text-gray-600 text-sm">{{ freestyleMode() ? 'No freestyle exercise selected yet.' : 'No exercises in this workout plan.' }}</p>
            </div>
          }
        </div>
      }

      <!-- Footer Navigation -->
      <div class="fixed left-0 right-0 bottom-[-1px] z-[60] bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,1rem)+12px)] after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-24 after:bg-transparent workout-action-bar" [style.padding-bottom]="freestyleMode() ? 'calc(env(safe-area-inset-bottom, 1rem) + 20px)' : 'calc(env(safe-area-inset-bottom, 1rem) + 12px)'">
        <div class="flex justify-between items-center max-w-screen-xl mx-auto">
          @if (freestyleMode()) {
            <div class="flex items-center gap-1.5">
              <button (click)="prevExercise()" [disabled]="effectiveExerciseIndex() === 0" class="p-2 rounded-full bg-gray-100 text-gray-600 disabled:opacity-30">
                <mat-icon>arrow_back</mat-icon>
              </button>
              <button type="button" (click)="showFreestylePicker.set(true); freestylePickerClosable.set(true)" class="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                <mat-icon style="font-size:18px;width:18px;height:18px;">add</mat-icon>
                <span>Add</span>
              </button>
            </div>
          } @else {
            <button (click)="prevExercise()" [disabled]="effectiveExerciseIndex() === 0" class="p-2.5 rounded-full bg-gray-100 text-gray-600 disabled:opacity-30">
              <mat-icon>arrow_back</mat-icon>
            </button>
          }
          
          <button type="button" (click)="openExerciseListModal()" class="text-sm font-medium text-gray-500">
            {{ currentExercise() ? effectiveExerciseIndex() + 1 : 0 }} / {{ totalExercisesCount() }}
          </button>

          <button (click)="nextExercise()" class="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 flex items-center space-x-2">
            <span>{{ isLastExercise() ? 'Finish' : 'Next' }}</span>
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>

      @if (showExitOptionsModal()) {
        <div class="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-gray-900">Exit workout</h3>
              <button type="button" (click)="dismissExitOptionsModal()" class="text-gray-400">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <p class="text-sm text-gray-500 mt-1">Do you want to pause and exit (resume later) or cancel the workout?</p>

            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="exitWorkout()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600">Pause</button>
              <button type="button" (click)="cancelWorkout()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-red-600">Cancel Workout</button>
            </div>
          </div>
        </div>
      }

      @if (showManualDistanceDialog()) {
        <div class="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">
            <div>
              <h3 class="text-base font-bold text-gray-900">Enter Distance</h3>
              <p class="text-sm text-gray-500 mt-1">Enter the distance you have covered in meters.</p>
            </div>
            <input
              type="number"
              [(ngModel)]="manualDistanceInput"
              placeholder="e.g., 5000"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="showManualDistanceDialog.set(false)" class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100">Cancel</button>
              <button type="button" (click)="confirmManualDistance()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-orange-600">Confirm</button>
            </div>
          </div>
        </div>
      }

      @if (showFreestyleSaveModal()) {
        <div class="fixed top-0 left-0 right-0 z-[70] bg-black/40 flex items-center justify-center p-4" style="bottom: calc(72px + env(safe-area-inset-bottom, 20px));">
          <div class="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">
            <div>
              <h3 class="text-base font-bold text-gray-900">Save as workout plan?</h3>
              <p class="text-sm text-gray-500 mt-1">Your freestyle session is saved. Optionally save these exercises as a reusable plan.</p>
            </div>

            <div class="space-y-2">
              <label for="freestyle-plan-name" class="block text-xs font-semibold uppercase tracking-wide text-gray-500">Plan Name</label>
              <input
                id="freestyle-plan-name"
                type="text"
                [(ngModel)]="freestylePlanName"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Freestyle plan name"
              />
            </div>

            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="skipFreestylePlanSave()" class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100">Skip</button>
              <button type="button" (click)="saveFreestylePlanFromModal()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600">Save Plan</button>
            </div>
          </div>
        </div>
      }
      
      @if (showExerciseListModal()) {
        <div class="fixed top-0 left-0 right-0 z-70 bg-black/40 flex items-center justify-center p-4" style="bottom: calc(72px + env(safe-area-inset-bottom, 20px));">
          <div class="w-full max-w-lg bg-white rounded-2xl p-4 shadow-xl border border-gray-100 space-y-3" style="max-height: calc(100vh - (72px + env(safe-area-inset-bottom, 20px)) - 32px); overflow:auto;">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-gray-900">Exercises</h3>
              <button type="button" (click)="closeExerciseListModal()" class="text-gray-400">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="max-h-64 overflow-y-auto space-y-2">
            @for (exercise of visibleExercises(); track exercise.id) {
              <button type="button" (click)="selectExercise($index)" class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between">
                <span class="font-medium text-gray-900">{{ exercise.name }}</span>
                <span class="text-xs text-gray-400">{{ $index + 1 }}</span>
              </button>
            }
            </div>

            <div class="flex justify-end">
              <button type="button" (click)="closeExerciseListModal()" class="px-3 py-2 rounded-lg bg-gray-100 text-sm">Close</button>
            </div>
          </div>
        </div>
      }

      @if (showFreestylePicker()) {
        <div class="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div class="animate-fade-in w-full max-w-lg bg-white rounded-2xl p-4 shadow-xl border border-gray-100 space-y-3" style="max-height: calc(100vh - (72px + env(safe-area-inset-bottom, 20px)) - 32px); overflow:auto;">
            @if (!freestyleWorkoutType()) {
              <!-- Workout Type Picker -->
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-gray-900">What kind of workout?</h3>
                <button type="button" (click)="closeFreestylePicker()" class="text-gray-400 hover:text-gray-600 transition-colors">
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <div class="grid grid-cols-2 gap-3 mt-2">
                <button type="button" (click)="selectFreestyleWorkoutType('strength')"
                        class="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all active:scale-95"
                        [class.border-red-300]="true"
                        [class.bg-red-50]="true">
                  <span class="text-3xl">{{ workoutTypeEmoji('strength') }}</span>
                  <span class="text-base font-bold text-gray-900">Strength</span>
                  <span class="text-xs text-gray-500">Weightlifting, resistance training</span>
                </button>
                <button type="button" (click)="selectFreestyleWorkoutType('cardio')"
                        class="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all active:scale-95"
                        [class.border-green-300]="true"
                        [class.bg-green-50]="true">
                  <span class="text-3xl">{{ workoutTypeEmoji('cardio') }}</span>
                  <span class="text-base font-bold text-gray-900">Cardio</span>
                  <span class="text-xs text-gray-500">Running, cycling, hiking</span>
                </button>
              </div>
            } @else {
              <!-- Exercise Picker -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <button type="button" (click)="freestyleWorkoutType.set(null)" class="text-gray-400 hover:text-gray-600 transition-colors flex items-center">
                    <mat-icon>arrow_back</mat-icon>
                  </button>
                  <h3 class="text-base font-bold text-gray-900">Add Exercise</h3>
                  <span
                    class="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    [ngStyle]="typeBadgeStyle(freestyleWorkoutType())"
                  >
                    {{ typeLabel(freestyleWorkoutType()) }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">{{ freestyleExercises().length }} selected</span>
                  @if (freestylePickerClosable()) {
                    <button type="button" (click)="showFreestylePicker.set(false)" class="text-gray-400">
                      <mat-icon>close</mat-icon>
                    </button>
                  }
                </div>
              </div>

              <app-search-bar
                [value]="exerciseSearchQuery"
                (valueChange)="exerciseSearchQuery = $event"
                placeholder="Search exercises"
              />

              <div class="max-h-64 overflow-y-auto space-y-2 mt-5">
                @for (ex of filteredExerciseOptions(); track ex.id) {
                  <button
                    type="button"
                    (click)="addFreestyleExercise(ex)"
                    [disabled]="isExerciseLocked(ex)"
                    class="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors"
                    [class.bg-orange-50]="isExerciseCurrent(ex)"
                    [class.border-orange-300]="isExerciseCurrent(ex)"
                    [class.bg-blue-50]="isExerciseSelected(ex) && !isExerciseCurrent(ex) && !isExerciseLocked(ex)"
                    [class.border-blue-300]="isExerciseSelected(ex) && !isExerciseCurrent(ex) && !isExerciseLocked(ex)"
                    [class.bg-white]="!isExerciseSelected(ex) || isExerciseLocked(ex)"
                    [class.border-gray-200]="!isExerciseSelected(ex) || isExerciseLocked(ex)"
                    [class.hover:bg-gray-50]="!isExerciseSelected(ex) && !isExerciseLocked(ex)"
                    [class.opacity-50]="isExerciseLocked(ex)"
                    [class.cursor-not-allowed]="isExerciseLocked(ex)"
                  >
                    <span class="flex items-center gap-1">
                      <span class="text-sm truncate" [class.text-gray-900]="!isExerciseLocked(ex)" [class.text-gray-400]="isExerciseLocked(ex)">{{ ex.name }}</span>
                      @if (isExerciseCurrent(ex)) {
                        <span class="text-[10px] font-semibold text-orange-600 shrink-0 leading-[18px]">(current)</span>
                      }
                    </span>
                    <span class="flex items-center gap-1.5">
                      @if (isExerciseLocked(ex)) {
                        <mat-icon style="font-size:14px;width:14px;height:14px;" class="text-gray-400">lock</mat-icon>
                      }
                      <span
                        class="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        [ngStyle]="typeBadgeStyle(ex.exerciseType)"
                      >
                        {{ typeLabel(ex.exerciseType) }}
                      </span>
                    </span>
                  </button>
                }
                @if (filteredExerciseOptions().length === 0) {
                  <p class="text-center text-gray-400 text-sm py-8">No exercises found</p>
                }
              </div>

              @if (freestyleExercises().length > 0) {
                <button type="button" (click)="startFreestyleWorkout()"
                        class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                  {{ freestylePickerClosable() ? 'Continue' : 'Start Workout' }} ({{ freestyleExercises().length }} exercises)
                </button>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .workout-content {
      padding-bottom: calc(72px + env(safe-area-inset-bottom, 20px) + 24px);
    }
    .workout-action-bar {
      bottom: 0;
      z-index: 60;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class WorkoutComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  workoutService = inject(WorkoutService);

  planId = signal<string>('');
  scheduleId = signal<string | null>(null);
  plan = computed(() => this.workoutService.getPlanById(this.planId()));
  freestyleMode = signal(false);
  freestyleExercises = signal<Exercise[]>([]);
  freestyleWorkoutType = signal<'strength' | 'cardio' | null>(null);
  workoutTitle = computed(() => this.freestyleMode() ? 'Freestyle Workout' : (this.plan()?.name || 'Workout'));

  virtualExercise = computed<Exercise | null>(() => {
    const plan = this.plan();
    if (!plan || this.freestyleMode()) return null;
    if (plan.exercises.length > 0) return null;
    if (!plan.category) return null;
    return createVirtualCardioExercise(plan.category);
  });

  virtualExercisesList = computed(() => {
    const ve = this.virtualExercise();
    return ve ? [ve] : [];
  });
  
  currentExerciseIndex = signal(0);
  allExercises = computed(() => {
    if (this.freestyleMode()) return this.freestyleExercises();
    const plan = this.plan();
    if (!plan) return [];
    if (plan.exercises.length > 0) return plan.exercises;
    const virtual = this.virtualExercise();
    return virtual ? [virtual] : [];
  });
  isCardioOnlyWorkout = computed(() => {
    const exercises = this.allExercises();
    if (exercises.length === 0) return false;
    return exercises.every(ex => ex.exerciseType === 'cardio');
  });
  effectiveExerciseIndex = computed(() => this.isCardioOnlyWorkout() ? 0 : this.currentExerciseIndex());
  currentExercise = computed(() => this.allExercises()[this.effectiveExerciseIndex()] || undefined);
  visibleExercises = computed(() => {
    const exercises = this.allExercises();
    if (!this.isCardioOnlyWorkout()) return exercises;
    const current = this.currentExercise();
    return current ? [current] : [];
  });
  totalExercisesCount = computed(() => this.visibleExercises().length || 0);
  
  // State for the current workout session
  workoutData = signal<Map<string, WorkoutSet[]>>(new Map());
  missingExercises = signal<string[]>([]);
  showMissingExercisesBanner = signal(false);

  // Quick-confirm and undo state
  undoMessage = signal('');
  private lastSnapshot: { exerciseId: string; sets: WorkoutSet[] } | null = null;
  private undoTimeout: ReturnType<typeof setTimeout> | undefined;
  
  startTime = new Date();
  elapsedTime = signal(0);
  paused = signal(false);
  timerInterval: ReturnType<typeof setInterval> | undefined;
  saveErrorMessage = '';
  
  @ViewChild('freestyleListAnchor', { static: false }) freestyleListAnchorEl?: ElementRef<HTMLElement>;
  showInfo = false;
  showExercisePicker = false;
  showFreestylePicker = signal(false);
  freestylePickerClosable = signal(false);
  freestyleStarted = signal(false);
  showExerciseListModal = signal(false);
  exerciseSearchQuery = '';
  showExitOptionsModal = signal(false);
  showFreestyleSaveModal = signal(false);
  freestylePlanName = '';
  private persistThrottleTimer: ReturnType<typeof setTimeout> | undefined;

  // Cardio state
  cardioExerciseData = signal<Map<string, CardioExerciseData>>(new Map());
  private gpsIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  showManualDistanceDialog = signal(false);
  manualDistanceInput = '';
  @ViewChild(CardioMapComponent) cardioMap?: CardioMapComponent;

  isCardioExercise = computed(() => {
    const exercise = this.currentExercise();
    return exercise?.exerciseType === 'cardio';
  });

  currentCardioData = computed(() => {
    const exerciseId = this.currentExercise()?.id;
    if (!exerciseId) return null;
    return this.cardioExerciseData().get(exerciseId) || null;
  });

  currentCardioPosition = computed(() => {
    const data = this.currentCardioData();
    const coords = data?.gpsCoordinates;
    if (!coords || coords.length === 0) return null;
    const last = coords[coords.length - 1];
    return { lat: last.lat, lng: last.lng };
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('planId');
      if (!id) return;
      this.scheduleId.set(this.route.snapshot?.queryParamMap?.get('scheduleId') ?? null);

      // If there is an in-progress workout matching this id, resume it
      const inProgress = this.workoutService.inProgress();
      if (inProgress && inProgress.planId === id) {
        this.planId.set(id);
        this.freestyleMode.set(!!inProgress.freestyleMode);
        this.currentExerciseIndex.set(inProgress.currentExerciseIndex || 0);
        this.startTime = inProgress.startTime ? new Date(inProgress.startTime) : new Date();
        this.elapsedTime.set(inProgress.elapsedTime || 0);
        // restore workoutData map
        const restored = new Map<string, WorkoutSet[]>();
        if (inProgress.workoutData) {
          for (const [exId, sets] of Object.entries(inProgress.workoutData)) {
            restored.set(exId, sets as WorkoutSet[]);
          }
        }
        if (this.freestyleMode()) {
          this.freestyleExercises.set(inProgress.freestyleExercises || []);
        }
        this.workoutData.set(restored);
        // Restore cardio data
        if (inProgress.cardioExerciseData) {
          const restoredCardio = new Map<string, CardioExerciseData>();
          for (const [exId, data] of Object.entries(inProgress.cardioExerciseData)) {
            restoredCardio.set(exId, data as CardioExerciseData);
          }
          this.cardioExerciseData.set(restoredCardio);
        }
        if (this.timerInterval !== undefined) {
          clearInterval(this.timerInterval);
          this.timerInterval = undefined;
        }
        this.startTimer();
        return;
      }

      // No resume – start a fresh workout
      this.planId.set(id);
      this.freestyleMode.set(id === 'freestyle');
      if (id === 'freestyle') {
        this.freestyleExercises.set([]);
        this.freestylePickerClosable.set(false);
        this.showFreestylePicker.set(true);
      }
      this.startTime = new Date();
      this.elapsedTime.set(0);
      this.currentExerciseIndex.set(0);
      this.cardioExerciseData.set(new Map());
      if (this.timerInterval !== undefined) {
        clearInterval(this.timerInterval);
        this.timerInterval = undefined;
      }
      this.initializeWorkoutData();
      if (!this.freestyleMode()) {
        this.startTimer();
      }

      // Optimistically mark the plan as started so UI shows it as started
      if (!this.freestyleMode()) {
        const plan = this.plan();
        if (plan) {
          this.workoutService.markPlanStartedLocally(plan.id, this.startTime);
        }
      }

      // persist lightweight in-progress marker so user can resume after navigation
      this.persistInProgress();
    });
  }

  ngOnDestroy() {
    this.stopGPSTracking();
    if (this.persistThrottleTimer !== undefined) {
      clearTimeout(this.persistThrottleTimer);
      this.persistThrottleTimer = undefined;
    }
    if (this.timerInterval !== undefined) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    // Persist latest state so the user can resume if they navigated away
    if (this.workoutService.inProgress()) {
      this.persistInProgress();
    }
  }

  initializeWorkoutData() {
    if (this.freestyleMode()) {
      this.workoutData.set(new Map());
      return;
    }

    const plan = this.plan();
    if (plan) {
      const data = new Map<string, WorkoutSet[]>();
      const missing: string[] = [];
      const planTargets = this.workoutService.getPlanExerciseTargets(plan.id);
      const lastSession = this.workoutService.getLastSessionForPlan(plan.id);
      
      plan.exercises.forEach(ex => {
        const exerciseExists = !!this.workoutService.getExerciseById(ex.id);
        if (!exerciseExists) {
          missing.push(ex.name);
          return;
        }

        // Resolve smart defaults: plan target → last workout → empty
        const defaults = resolveDefault(ex.id, ex.name, planTargets, lastSession, lastSession?.exercises);
        const unitWarning = getUnitMismatchMessage(
          defaults.source,
          planTargets.find(t => t.exerciseId === ex.id)?.targetWeight,
          lastSession?.exercises.find(e => e.exerciseId === ex.id)?.sets.slice(-1)[0]?.weight,
        );

        const initialSet: WorkoutSet = {
          reps: defaults.reps,
          weight: defaults.weight,
          completed: false,
          source: defaults.source,
        };

        data.set(ex.id, [
          { ...initialSet },
          { ...initialSet },
          { ...initialSet },
        ]);

        // Track unit warnings
        if (unitWarning) {
          console.debug(`[Workout] Unit mismatch on "${ex.name}": ${unitWarning}`);
        }
      });

      this.missingExercises.set(missing);
      if (missing.length > 0) {
        this.showMissingExercisesBanner.set(true);
      }
      this.workoutData.set(data);
    }
  }

  persistInProgress() {
    const dataObj: Record<string, WorkoutSet[]> = {};
    for (const [k, v] of this.workoutData().entries()) {
      dataObj[k] = v;
    }
    const cardioObj: Record<string, CardioExerciseData> = {};
    for (const [k, v] of this.cardioExerciseData().entries()) {
      cardioObj[k] = v;
    }
    const payload: InProgressWorkout = {
      planId: this.planId(),
      freestyleMode: this.freestyleMode(),
      startTime: this.startTime.toISOString(),
      elapsedTime: this.elapsedTime(),
      currentExerciseIndex: this.currentExerciseIndex(),
      workoutData: dataObj,
      freestyleExercises: this.freestyleExercises() || [],
      cardioExerciseData: Object.keys(cardioObj).length > 0 ? cardioObj : undefined,
    };
    this.workoutService.setInProgress(payload);
  }

  /** Debounce persist calls so rapid mutations (e.g. toggling sets) don't flood the service. */
  private throttledPersist() {
    if (this.persistThrottleTimer !== undefined) {
      clearTimeout(this.persistThrottleTimer);
    }
    this.persistThrottleTimer = setTimeout(() => {
      this.persistThrottleTimer = undefined;
      this.persistInProgress();
    }, 2000);
  }

  currentSets = computed(() => {
    const exId = this.currentExercise()?.id;
    if (!exId) return [];
    return this.workoutData().get(exId) || [];
  });

  addSet() {
    const exId = this.currentExercise()?.id;
    if (exId) {
      const sets = this.workoutData().get(exId) || [];
      const lastSet = sets[sets.length - 1] || { reps: 0, weight: 0, completed: false };
      
      sets.push({ ...lastSet, completed: false });
      this.workoutData.update(m => new Map(m.set(exId, sets)));
      this.throttledPersist();
    }
  }

  filteredExerciseOptions() {
    const query = this.exerciseSearchQuery.trim().toLowerCase();
    const all = this.workoutService.exercises();
    const selectedType = this.freestyleWorkoutType();
    let filtered = all;

    if (selectedType) {
      filtered = filtered.filter(ex => ex.exerciseType === selectedType);
    }

    if (!query) return filtered;

    return filtered.filter(exercise => {
      const haystack = [exercise.name, exercise.muscleGroup || '', exercise.exerciseType || ''].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  typeLabel(type: string | null | undefined) {
    return getWorkoutTypeVisual(type).label;
  }

  typeBadgeStyle(type: string | null | undefined) {
    return workoutTypeBadgeStyle(type);
  }

  workoutTypeEmoji(type: string | null | undefined) {
    return getWorkoutTypeEmoji(type);
  }

  toggleExercisePicker() {
    this.showExercisePicker = !this.showExercisePicker;
    if (this.showExercisePicker) {
      requestAnimationFrame(() => {
        const anchor = this.freestyleListAnchorEl?.nativeElement;
        if (anchor) {
          anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  addFreestyleExercise(exercise: Exercise) {
    if (this.isExerciseLocked(exercise)) return;

    if (this.isExerciseSelected(exercise)) {
      this.freestyleExercises.update(current => current.filter(ex => ex.id !== exercise.id));
      this.workoutData.update(current => {
        const next = new Map(current);
        next.delete(exercise.id);
        return next;
      });
      if (exercise.exerciseType === 'cardio') {
        this.stopGPSTracking(exercise.id);
        this.cardioExerciseData.update(map => {
          const next = new Map(map);
          next.delete(exercise.id);
          return next;
        });
      }
      if (this.currentExercise()?.id === exercise.id) {
        const remaining = this.freestyleExercises();
        this.currentExerciseIndex.set(remaining.length > 0 ? 0 : 0);
      }
      return;
    }

    if (exercise.exerciseType === 'cardio') {
      const existingCardio = this.freestyleExercises().find(ex => ex.exerciseType === 'cardio');
      if (existingCardio) {
        this.workoutData.update(current => {
          const next = new Map(current);
          next.delete(existingCardio.id);
          return next;
        });
      }
      this.freestyleExercises.set([exercise]);
    } else {
      this.freestyleExercises.update(current => [...current, exercise]);
    }
    this.workoutData.update(current => {
      const next = new Map(current);
      next.set(exercise.id, [
        { reps: 0, weight: 0, completed: false },
        { reps: 0, weight: 0, completed: false },
        { reps: 0, weight: 0, completed: false },
      ]);
      return next;
    });
    if (exercise.exerciseType === 'cardio') {
      this.initCardioExercise(exercise.id);
    }
    const wasEmpty = this.freestyleExercises().length <= 1;
    if (wasEmpty) {
      this.currentExerciseIndex.set(0);
    }
    this.showExercisePicker = false;
  }

  selectFreestyleWorkoutType(type: 'strength' | 'cardio') {
    this.freestyleWorkoutType.set(type);
  }

  closeFreestylePicker() {
    if (this.freestyleMode()) {
      this.router.navigate(['/home']);
    } else {
      this.showFreestylePicker.set(false);
    }
  }

  

  startFreestyleWorkout() {
    if (!this.freestyleStarted()) {
      this.currentExerciseIndex.set(0);
      this.freestyleStarted.set(true);
      this.startTime = new Date();
      this.elapsedTime.set(0);
      this.startTimer();
      this.persistInProgress();
    }
  }

  isExerciseSelected(exercise: Exercise): boolean {
    return this.freestyleExercises().some(ex => ex.id === exercise.id);
  }

  isExerciseCurrent(exercise: Exercise): boolean {
    return this.currentExercise()?.id === exercise.id;
  }

  isExerciseLocked(exercise: Exercise): boolean {
    if (!this.freestyleStarted()) return false;
    const idx = this.freestyleExercises().findIndex(ex => ex.id === exercise.id);
    return idx !== -1 && idx < this.currentExerciseIndex();
  }

  confirmCurrentExercise() {
    const exId = this.currentExercise()?.id;
    if (!exId) return;

    const sets = this.workoutData().get(exId);
    if (!sets || sets.length === 0) return;

    // Snapshot for undo
    this.lastSnapshot = { exerciseId: exId, sets: sets.map(s => ({ ...s })) };

    const updated = sets.map(s => ({ ...s, completed: true }));
    this.workoutData.update(m => new Map(m.set(exId, updated)));
    this.showUndo('All sets confirmed');
  }

  resetExerciseToDefaults() {
    const exId = this.currentExercise()?.id;
    if (!exId) return;

    const plan = this.plan();
    if (!plan) return;

    const exercise = plan.exercises.find(e => e.id === exId);
    if (!exercise) return;

    const planTargets = this.workoutService.getPlanExerciseTargets(plan.id);
    const lastSession = this.workoutService.getLastSessionForPlan(plan.id);

    // Snapshot for undo
    this.lastSnapshot = { exerciseId: exId, sets: (this.workoutData().get(exId) || []).map(s => ({ ...s })) };

    const defaults = resolveDefault(exId, exercise.name, planTargets, lastSession, lastSession?.exercises);
    const resetSet: WorkoutSet = { reps: defaults.reps, weight: defaults.weight, completed: false, source: defaults.source };
    const count = this.workoutData().get(exId)?.length || 3;
    const resetSets = Array.from({ length: count }, () => ({ ...resetSet }));
    this.workoutData.update(m => new Map(m.set(exId, resetSets)));
    this.showUndo('Reset to defaults');
  }

  private showUndo(message: string) {
    this.undoMessage.set(message);
    if (this.undoTimeout !== undefined) {
      clearTimeout(this.undoTimeout);
    }
    this.undoTimeout = setTimeout(() => {
      this.undoMessage.set('');
      this.undoTimeout = undefined;
    }, 5000);
  }

  undoLastAction() {
    if (!this.lastSnapshot) return;
    this.workoutData.update(m => new Map(m.set(this.lastSnapshot!.exerciseId, this.lastSnapshot!.sets)));
    this.lastSnapshot = null;
    this.undoMessage.set('');
    if (this.undoTimeout !== undefined) {
      clearTimeout(this.undoTimeout);
      this.undoTimeout = undefined;
    }
  }

  dismissUndo() {
    this.undoMessage.set('');
    this.lastSnapshot = null;
    if (this.undoTimeout !== undefined) {
      clearTimeout(this.undoTimeout);
      this.undoTimeout = undefined;
    }
  }

  markSetEdited(set: WorkoutSet) {
    if (set.source && set.source !== ('empty' as DefaultSource)) {
      set.source = undefined;
    }
  }

  setSourceLabel(set: WorkoutSet): string {
    return set.source ? sourceLabel(set.source) : '';
  }

  removeSet(index: number) {
    const exId = this.currentExercise()?.id;
    if (!exId) return;

    const sets = this.workoutData().get(exId) || [];
    if (sets.length <= 1) return;

    sets.splice(index, 1);
    this.workoutData.update(m => new Map(m.set(exId, sets)));
  }

  toggleSet(index: number) {
    const exId = this.currentExercise()?.id;
    if (exId) {
      const sets = this.workoutData().get(exId) || [];
      sets[index].completed = !sets[index].completed;
      this.workoutData.update(m => new Map(m.set(exId, sets)));
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.paused()) return;
      this.elapsedTime.update(t => t + 1);
      if (this.isCardioExercise()) {
        this.updateCardioTime();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  prevExercise() {
    if (this.isCardioOnlyWorkout()) return;
    if (this.currentExerciseIndex() > 0) {
      this.currentExerciseIndex.update(i => i - 1);
      const exercise = this.currentExercise();
      if (exercise?.exerciseType === 'cardio') {
        this.initCardioExercise(exercise.id);
      }
    }
  }

  nextExercise() {
    if (!this.currentExercise()) return;

    if (this.isLastExercise()) {
      this.finishWorkout();
    } else {
      if (!this.isCardioOnlyWorkout()) {
        this.currentExerciseIndex.update(i => i + 1);
        const exercise = this.currentExercise();
        if (exercise?.exerciseType === 'cardio') {
          this.initCardioExercise(exercise.id);
        }
      }
    }
  }

  isLastExercise() {
    return this.effectiveExerciseIndex() === (this.totalExercisesCount() || 0) - 1;
  }

  togglePause() {
    this.paused.update(p => !p);
  }

  cancelWorkout() {
    void this.confirmCancelWorkout();
  }

  openExitOptions() {
    this.showExitOptionsModal.set(true);
  }

  dismissExitOptionsModal() {
    this.showExitOptionsModal.set(false);
  }

  /**
   * Exit the workout without cancelling. Persist current in-progress state
   * so the user can resume later, and navigate away.
   */
  exitWorkout() {
    // stop timer but keep state
    if (this.timerInterval !== undefined) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    this.persistInProgress();
    this.router.navigate(['/home']);
  }

  async confirmCancelWorkout() {
    if (this.timerInterval !== undefined) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }

    // clear in-progress marker when cancelling
    this.workoutService.clearInProgress();

    // Ensure navigation completes and double-check clear (race safety)
    try {
      await this.router.navigate(['/home']);
    } finally {
      this.workoutService.clearInProgress();
    }
  }

  async finishWorkout() {
    const plan = this.plan();
    if (!this.freestyleMode() && !plan) return;
    if (this.freestyleMode() && !this.freestyleExercises().length) {
      this.saveErrorMessage = 'Please add at least one exercise for freestyle workout.';
      return;
    }

    // Capture map snapshot before stopping GPS (while map component is still alive)
    let mapSnapshotUrl: string | null = null;
    const currentEx = this.currentExercise();
    if (currentEx?.exerciseType === 'cardio' && this.cardioMap) {
      mapSnapshotUrl = await this.cardioMap.captureSnapshot();
    }

    // Stop GPS tracking
    this.stopGPSTracking();

    const allVirtual = this.virtualExercisesList();
    const resolveExercise = (exerciseId: string) =>
      this.workoutService.getExerciseById(exerciseId) || allVirtual.find(e => e.id === exerciseId);

    const exercises = Array.from(this.workoutData().entries()).map(([exerciseId, sets]) => {
      const exercise = resolveExercise(exerciseId);
      const isCardio = exercise?.exerciseType === 'cardio';
      const cardioData = this.cardioExerciseData().get(exerciseId);

      if (isCardio) {
        const metrics = computeCardioMetrics(
          cardioData?.distanceMeters || 0,
          cardioData?.elapsedSeconds || 0,
          cardioData?.avgPaceSecondsPerKm,
          cardioData?.maxPaceSecondsPerKm,
          cardioData?.avgSpeedKmh,
        );
        return {
          exerciseId,
          sets: [] as WorkoutSet[],
          ...metrics,
          mapSnapshotUrl: exerciseId === currentEx?.id ? (mapSnapshotUrl ?? undefined) : undefined,
        };
      }

      return {
        exerciseId,
        sets,
        distanceMeters: 0,
        avgPacePerKmSeconds: 0,
        maxPacePerKmSeconds: 0,
        avgSpeedKmh: 0,
        exerciseDurationSeconds: 0,
      };
    });

    // Also include cardio exercises that may not have entries in workoutData
    const currentPlan = this.plan();
    const planExercises = currentPlan?.exercises || [];
    const allExercises = this.freestyleMode() ? this.freestyleExercises() : [...planExercises, ...allVirtual];
    for (const ex of allExercises) {
      if (ex.exerciseType === 'cardio' && !exercises.find(e => e.exerciseId === ex.id)) {
        const cardioData = this.cardioExerciseData().get(ex.id);
        const metrics = computeCardioMetrics(
          cardioData?.distanceMeters || 0,
          cardioData?.elapsedSeconds || 0,
          cardioData?.avgPaceSecondsPerKm,
          cardioData?.maxPaceSecondsPerKm,
          cardioData?.avgSpeedKmh,
        );
        exercises.push({
          exerciseId: ex.id,
          sets: [],
          ...metrics,
        });
      }
    }

    const session: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      planId: this.freestyleMode() ? '' : (plan?.id || ''),
      date: new Date(),
      createdAt: new Date(),
      startTime: this.startTime,
      endTime: new Date(),
      duration: this.elapsedTime(),
      exercises
    };

    if (this.timerInterval !== undefined) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    const saved = await this.workoutService.addSession(session, allVirtual.length > 0 ? allVirtual : undefined);
    if (!saved) {
      this.saveErrorMessage = 'Failed to save workout session. Please try again.';
      this.startTimer();
      return;
    }

    // clear in-progress marker on successful finish
    this.workoutService.clearInProgress();

    // Mark the scheduled workout as completed
    const schedId = this.scheduleId();
    if (schedId) {
      await this.workoutService.updateScheduledWorkoutStatus(schedId, 'completed');
    }

    // Optimistically mark the plan as completed so UI reflects the finished workout
    if (!this.freestyleMode()) {
      const plan = this.plan();
      if (plan) {
        this.workoutService.markPlanCompletedLocally(plan.id, session.endTime || new Date());
      }
    }

    this.saveErrorMessage = '';

    if (this.freestyleMode()) {
      this.freestylePlanName = `Freestyle ${new Date().toLocaleDateString()}`;
      this.showFreestyleSaveModal.set(true);
      return;
    }

    this.router.navigate(['/home']);
  }

  async saveFreestylePlanFromModal() {
    const planName = this.freestylePlanName.trim();
    if (!planName) {
      this.saveErrorMessage = 'Enter a plan name or skip plan creation.';
      return;
    }

    const planType = deriveWorkoutPlanType(this.freestyleExercises());
    const category = planType === 'cardio' ? 'running' : undefined;

    const created = await this.workoutService.createPlan({
      id: Math.random().toString(36).substr(2, 9),
      name: planName,
      description: 'Created from freestyle workout',
      exercises: this.freestyleExercises(),
      isActive: false,
      category,
    });

    if (!created) {
      this.saveErrorMessage = 'Workout saved, but failed to create plan from freestyle session.';
      return;
    }

    this.saveErrorMessage = '';
    this.showFreestyleSaveModal.set(false);
    this.router.navigate(['/home']);
  }

  skipFreestylePlanSave() {
    this.saveErrorMessage = '';
    this.showFreestyleSaveModal.set(false);
    this.router.navigate(['/home']);
  }

  openExerciseListModal() {
    this.showExerciseListModal.set(true);
  }

  closeExerciseListModal() {
    this.showExerciseListModal.set(false);
  }

  selectExercise(index: number) {
    if (this.isCardioOnlyWorkout()) {
      this.currentExerciseIndex.set(0);
    } else {
      this.currentExerciseIndex.set(index);
    }
    this.showExerciseListModal.set(false);
    const exercise = this.currentExercise();
    if (exercise?.exerciseType === 'cardio') {
      this.initCardioExercise(exercise.id);
    }
  }

  // Cardio methods
  initCardioExercise(exerciseId: string) {
    if (this.cardioExerciseData().has(exerciseId)) return;
    const now = Date.now();
    this.cardioExerciseData.update(map => {
      const newData = new Map(map);
      newData.set(exerciseId, {
        startTime: now,
        elapsedSeconds: 0,
        distanceMeters: 0,
        currentPaceSecondsPerKm: 0,
        avgPaceSecondsPerKm: 0,
        maxPaceSecondsPerKm: 0,
        avgSpeedKmh: 0,
        gpsEnabled: false,
        gpsCoordinates: [],
      });
      return newData;
    });
    this.startGPSTracking(exerciseId);
  }

  toggleGPS() {
    const exerciseId = this.currentExercise()?.id;
    if (!exerciseId) return;
    const currentData = this.cardioExerciseData().get(exerciseId);
    if (!currentData) return;

    if (currentData.gpsEnabled) {
      this.stopGPSTracking(exerciseId);
      this.cardioExerciseData.update(map => {
        const newData = new Map(map);
        newData.set(exerciseId, { ...currentData, gpsEnabled: false });
        return newData;
      });
    } else {
      this.startGPSTracking(exerciseId);
    }
  }

  startGPSTracking(exerciseId: string) {
    if (!navigator.geolocation) return;
    this.cardioExerciseData.update(map => {
      const newData = new Map(map);
      const data = newData.get(exerciseId);
      if (data) {
        newData.set(exerciseId, { ...data, gpsEnabled: true });
      }
      return newData;
    });

    const geoOptions: PositionOptions = { enableHighAccuracy: true, timeout: 10000 };

    // Immediate first position
    navigator.geolocation.getCurrentPosition(
      (position) => this.updateGPSPosition(exerciseId, position),
      () => {
        this.cardioExerciseData.update(map => {
          const newData = new Map(map);
          const data = newData.get(exerciseId);
          if (data) newData.set(exerciseId, { ...data, gpsEnabled: false });
          return newData;
        });
      },
      geoOptions
    );

    // Then poll every 5 seconds
    const intervalId = setInterval(() => {
      if (this.paused()) return;
      navigator.geolocation.getCurrentPosition(
        (position) => this.updateGPSPosition(exerciseId, position),
        () => {},
        geoOptions
      );
    }, 5000);

    this.gpsIntervals.set(exerciseId, intervalId);
  }

  stopGPSTracking(exerciseId?: string) {
    if (exerciseId) {
      const intervalId = this.gpsIntervals.get(exerciseId);
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        this.gpsIntervals.delete(exerciseId);
      }
    } else {
      this.gpsIntervals.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      this.gpsIntervals.clear();
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  updateGPSPosition(exerciseId: string, position: GeolocationPosition) {
    const data = this.cardioExerciseData().get(exerciseId);
    if (!data) return;
    const { latitude, longitude } = position.coords;
    const timestamp = position.timestamp;
    const newData = new Map(this.cardioExerciseData());
    const updated = { ...data };

    if (updated.gpsCoordinates.length > 0) {
      const lastCoord = updated.gpsCoordinates[updated.gpsCoordinates.length - 1];
      const distance = this.calculateDistance(lastCoord.lat, lastCoord.lng, latitude, longitude);
      if (distance < 100 && distance > 1) {
        const timeDiff = (timestamp - lastCoord.timestamp) / 1000;
        if (timeDiff > 0) {
          updated.currentPaceSecondsPerKm = Math.floor((timeDiff / distance) * 1000);
        }
        updated.distanceMeters += distance;
        if (updated.elapsedSeconds > 0 && updated.distanceMeters > 0) {
          const distanceKm = updated.distanceMeters / 1000;
          const hours = updated.elapsedSeconds / 3600;
          updated.avgSpeedKmh = hours > 0 ? distanceKm / hours : 0;
          updated.avgPaceSecondsPerKm = Math.floor(updated.elapsedSeconds / distanceKm);
        }
        updated.gpsCoordinates = [...updated.gpsCoordinates, { lat: latitude, lng: longitude, timestamp }];
        if (updated.gpsCoordinates.length > 1000) {
          updated.gpsCoordinates = updated.gpsCoordinates.slice(-1000);
        }
      }
    } else {
      updated.gpsCoordinates = [{ lat: latitude, lng: longitude, timestamp }];
    }
    newData.set(exerciseId, updated);
    this.cardioExerciseData.set(newData);
  }

  enterManualDistance() {
    this.manualDistanceInput = '';
    this.showManualDistanceDialog.set(true);
  }

  confirmManualDistance() {
    const exerciseId = this.currentExercise()?.id;
    if (!exerciseId) return;
    const distance = Math.round(parseFloat(this.manualDistanceInput));
    if (!isNaN(distance) && distance > 0) {
      const data = this.cardioExerciseData().get(exerciseId);
      if (data) {
        const newData = new Map(this.cardioExerciseData());
        const updated = { ...data, distanceMeters: distance };
        if (updated.elapsedSeconds > 0) {
          const distanceKm = distance / 1000;
          updated.avgPaceSecondsPerKm = Math.floor(updated.elapsedSeconds / distanceKm);
          updated.avgSpeedKmh = distanceKm / (updated.elapsedSeconds / 3600);
        }
        newData.set(exerciseId, updated);
        this.cardioExerciseData.set(newData);
      }
    }
    this.showManualDistanceDialog.set(false);
  }

  updateCardioTime() {
    const exerciseId = this.currentExercise()?.id;
    if (!exerciseId) return;
    const data = this.cardioExerciseData().get(exerciseId);
    if (!data) {
      this.initCardioExercise(exerciseId);
      return;
    }
    const newData = new Map(this.cardioExerciseData());
    newData.set(exerciseId, { ...data, elapsedSeconds: data.elapsedSeconds + 1 });
    this.cardioExerciseData.set(newData);
  }

  formatDistance(meters: number): string {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  }

  formatPace(secondsPerKm: number): string {
    if (secondsPerKm === 0 || !isFinite(secondsPerKm)) return '--:--';
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.floor(secondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  }
}
