import { Exercise, WorkoutSession } from '../models/models';
import { calcCalories, buildPersistedSessionPayload, PersistedSessionPayload } from './workout-domain';

export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculatePace(elapsedSeconds: number, distanceMeters: number): number {
  if (distanceMeters <= 0 || elapsedSeconds <= 0) return 0;
  const distanceKm = distanceMeters / 1000;
  return Math.floor(elapsedSeconds / distanceKm);
}

export function calculateSpeed(elapsedSeconds: number, distanceMeters: number): number {
  if (elapsedSeconds <= 0 || distanceMeters <= 0) return 0;
  const distanceKm = distanceMeters / 1000;
  const hours = elapsedSeconds / 3600;
  return hours > 0 ? distanceKm / hours : 0;
}

export function formatPace(secondsPerKm: number): string {
  if (secondsPerKm === 0 || !isFinite(secondsPerKm)) return '--:--';
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

export function buildCardioSessionPayload(
  session: WorkoutSession,
  resolveExerciseById: (exerciseId: string) => Exercise | undefined,
  userWeightKg: number
): PersistedSessionPayload {
  return buildPersistedSessionPayload(session, resolveExerciseById, userWeightKg);
}
