import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { CreateExerciseInput, Exercise, WorkoutPlan, WorkoutSession } from '../models/models';
import { PersistedSessionPayload } from '../domain/workout-domain';
import { optimizeImageForUpload } from '../domain/image-upload-domain';

interface ExerciseRow {
  id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  muscle_group: string | null;
  exercise_type: string | null;
  met_value: number | string;
  visibility: 'default' | 'private' | 'shared';
  is_active: boolean;
}

interface WorkoutPlanRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  visibility: 'private' | 'shared' | 'public';
  is_active: boolean;
  last_performed_at: string | null;
}

interface WorkoutPlanExerciseRow {
  plan_id: string;
  exercise_id: string;
  position: number;
}

interface WorkoutSessionRow {
  id: string;
  plan_id: string | null;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number;
  total_calories: number | string;
  created_at: string;
}

interface WorkoutSessionExerciseRow {
  id: string;
  session_id: string;
  exercise_id: string | null;
  position: number;
}

interface WorkoutSessionSetRow {
  session_exercise_id: string;
  reps: number | null;
  weight: number | string | null;
  completed: boolean;
}

interface ProfileLookupRow {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class WorkoutRepository {
  private supabase = inject(SupabaseService);

  private mapExercise(row: ExerciseRow): Exercise {
    return {
      id: row.id,
      name: row.name,
      imageUrl: row.image_url || '',
      description: row.description || '',
      muscleGroup: row.muscle_group || '',
      exerciseType: row.exercise_type || 'general',
      metValue: Number(row.met_value ?? 5),
      visibility: row.visibility,
      createdBy: row.created_by,
      isActive: !!row.is_active,
    };
  }

  async loadDashboardData(userId: string) {
    const client = this.supabase.getClient();
    if (!client) return null;

    const [exercisesRes, plansRes, planExercisesRes, sessionsRes, sessionExercisesRes, sessionSetsRes] = await Promise.all([
      client.from('exercises').select('*').eq('is_active', true).order('name', { ascending: true }),
      client.from('workout_plans').select('*').order('created_at', { ascending: false }),
      client.from('workout_plan_exercises').select('*').order('position', { ascending: true }),
      client.from('workout_sessions').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
      client.from('workout_session_exercises').select('*').order('position', { ascending: true }),
      client.from('workout_session_sets').select('*').order('set_order', { ascending: true }),
    ]);

    if (exercisesRes.error) throw exercisesRes.error;
    if (plansRes.error) throw plansRes.error;
    if (planExercisesRes.error) throw planExercisesRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (sessionExercisesRes.error) throw sessionExercisesRes.error;
    if (sessionSetsRes.error) throw sessionSetsRes.error;

    const exercises = ((exercisesRes.data || []) as ExerciseRow[]).map(row => this.mapExercise(row));
    const exerciseById = new Map(exercises.map(e => [e.id, e]));

    const planExercisesByPlanId = new Map<string, WorkoutPlanExerciseRow[]>();
    for (const row of (planExercisesRes.data || []) as WorkoutPlanExerciseRow[]) {
      const group = planExercisesByPlanId.get(row.plan_id) || [];
      group.push(row);
      planExercisesByPlanId.set(row.plan_id, group);
    }

    const plans: WorkoutPlan[] = ((plansRes.data || []) as WorkoutPlanRow[]).map(row => {
      const exerciseRows = planExercisesByPlanId.get(row.id) || [];
      return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        exercises: exerciseRows
          .sort((a, b) => a.position - b.position)
          .map(pe => exerciseById.get(pe.exercise_id))
          .filter((exercise): exercise is Exercise => !!exercise),
        isActive: !!row.is_active,
        lastPerformed: row.last_performed_at ? new Date(row.last_performed_at) : undefined,
        visibility: row.visibility,
        ownerId: row.owner_id,
      };
    });

    const sessionExercisesBySessionId = new Map<string, WorkoutSessionExerciseRow[]>();
    for (const row of (sessionExercisesRes.data || []) as WorkoutSessionExerciseRow[]) {
      const group = sessionExercisesBySessionId.get(row.session_id) || [];
      group.push(row);
      sessionExercisesBySessionId.set(row.session_id, group);
    }

    const sessionSetsByExerciseId = new Map<string, WorkoutSessionSetRow[]>();
    for (const row of (sessionSetsRes.data || []) as WorkoutSessionSetRow[]) {
      const group = sessionSetsByExerciseId.get(row.session_exercise_id) || [];
      group.push(row);
      sessionSetsByExerciseId.set(row.session_exercise_id, group);
    }

    const sessions: WorkoutSession[] = ((sessionsRes.data || []) as WorkoutSessionRow[]).map(row => {
      const exerciseRows = (sessionExercisesBySessionId.get(row.id) || []).sort((a, b) => a.position - b.position);
      return {
        id: row.id,
        planId: row.plan_id || '',
        date: row.finished_at ? new Date(row.finished_at) : new Date(row.created_at),
        startTime: new Date(row.started_at),
        endTime: row.finished_at ? new Date(row.finished_at) : undefined,
        duration: row.duration_seconds || 0,
        caloriesBurned: Number(row.total_calories || 0),
        exercises: exerciseRows.map(exRow => ({
          exerciseId: exRow.exercise_id || '',
          notes: undefined,
          sets: (sessionSetsByExerciseId.get(exRow.id) || []).map(setRow => ({
            reps: setRow.reps || 0,
            weight: Number(setRow.weight || 0),
            completed: !!setRow.completed,
          })),
        })),
      };
    });

    return { userId, exercises, plans, sessions };
  }

  async setActivePlan(userId: string, planId: string) {
    const client = this.supabase.getClient();
    if (!client) return false;

    const clearRes = await client.from('workout_plans').update({ is_active: false }).eq('owner_id', userId);
    if (clearRes.error) return false;

    const setRes = await client.from('workout_plans').update({ is_active: true }).eq('owner_id', userId).eq('id', planId);
    return !setRes.error;
  }

  async ensureFirstRunSeed(userId: string) {
    const client = this.supabase.getClient();
    if (!client) return false;

    const { error } = await client.rpc('seed_beginner_plans_for_user', {
      p_owner_id: userId,
    });

    return !error;
  }

  async insertSession(userId: string, payload: PersistedSessionPayload) {
    const client = this.supabase.getClient();
    if (!client) return false;

    const { data, error } = await client.rpc('create_workout_session_tx', {
      p_owner_id: userId,
      p_plan_id: payload.planId,
      p_started_at: payload.startedAtIso,
      p_finished_at: payload.finishedAtIso,
      p_duration_seconds: payload.durationSeconds,
      p_total_calories: payload.totalCalories,
      p_exercises: payload.exercises,
    });

    return !error && !!data;
  }

  async createPlan(userId: string, plan: WorkoutPlan) {
    const client = this.supabase.getClient();
    if (!client) return null;

    const { data: planInsert, error: planError } = await client
      .from('workout_plans')
      .insert({
        owner_id: userId,
        name: plan.name,
        description: plan.description,
        visibility: plan.visibility || 'private',
        is_active: !!plan.isActive,
      })
      .select('id')
      .single();

    if (planError || !planInsert?.id) return null;

    if (plan.exercises.length) {
      const rows = plan.exercises.map((exercise, index) => ({
        plan_id: planInsert.id,
        exercise_id: exercise.id,
        position: index,
      }));

      const { error: relationError } = await client.from('workout_plan_exercises').insert(rows);
      if (relationError) {
        await client.from('workout_plans').delete().eq('id', planInsert.id).eq('owner_id', userId);
        return null;
      }
    }

    if (plan.isActive) {
      const { error: activationError } = await client
        .from('workout_plans')
        .update({ is_active: false })
        .eq('owner_id', userId)
        .neq('id', planInsert.id);

      if (activationError) return null;
    }

    return planInsert.id;
  }

  async updatePlan(userId: string, planId: string, plan: Pick<WorkoutPlan, 'name' | 'description' | 'exercises'>) {
    const client = this.supabase.getClient();
    if (!client) return false;

    const { error: planError } = await client
      .from('workout_plans')
      .update({
        name: plan.name,
        description: plan.description,
      })
      .eq('id', planId)
      .eq('owner_id', userId);

    if (planError) return false;

    const { error: deleteError } = await client
      .from('workout_plan_exercises')
      .delete()
      .eq('plan_id', planId);

    if (deleteError) return false;

    if (plan.exercises.length) {
      const rows = plan.exercises.map((exercise, index) => ({
        plan_id: planId,
        exercise_id: exercise.id,
        position: index,
      }));

      const { error: insertError } = await client.from('workout_plan_exercises').insert(rows);
      if (insertError) return false;
    }

    return true;
  }

  async createExercise(userId: string, input: CreateExerciseInput) {
    const client = this.supabase.getClient();
    if (!client) return null;

    const { data, error } = await client
      .from('exercises')
      .insert({
        created_by: userId,
        name: input.name,
        description: input.description || null,
        image_url: input.imageUrl || null,
        muscle_group: input.muscleGroup || null,
        exercise_type: input.exerciseType || 'general',
        met_value: input.metValue || 5,
        visibility: input.visibility || 'private',
        is_active: true,
      })
      .select('*')
      .single();

    if (error || !data) return null;
    return this.mapExercise(data as ExerciseRow);
  }

  async updateExercise(exerciseId: string, updates: Partial<CreateExerciseInput>) {
    const client = this.supabase.getClient();
    if (!client) return null;

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload['name'] = updates.name;
    if (updates.description !== undefined) payload['description'] = updates.description || null;
    if (updates.imageUrl !== undefined) payload['image_url'] = updates.imageUrl || null;
    if (updates.muscleGroup !== undefined) payload['muscle_group'] = updates.muscleGroup || null;
    if (updates.exerciseType !== undefined) payload['exercise_type'] = updates.exerciseType || 'general';
    if (updates.metValue !== undefined) payload['met_value'] = updates.metValue || 5;
    if (updates.visibility !== undefined) payload['visibility'] = updates.visibility;

    const { data, error } = await client
      .from('exercises')
      .update(payload)
      .eq('id', exerciseId)
      .select('*')
      .single();

    if (error || !data) return null;
    return this.mapExercise(data as ExerciseRow);
  }

  async shareExercise(userId: string, exerciseId: string, sharedWithUserId: string) {
    const client = this.supabase.getClient();
    if (!client) return false;

    const { error } = await client.from('exercise_shares').upsert(
      {
        exercise_id: exerciseId,
        shared_with_user_id: sharedWithUserId,
        created_by: userId,
      },
      { onConflict: 'exercise_id,shared_with_user_id' }
    );

    if (error) return false;

    const { error: visibilityError } = await client
      .from('exercises')
      .update({ visibility: 'shared' })
      .eq('id', exerciseId)
      .eq('created_by', userId);

    if (visibilityError) return false;

    return true;
  }

  async unshareExercise(userId: string, exerciseId: string, sharedWithUserId: string) {
    const client = this.supabase.getClient();
    if (!client) return false;

    const { error: deleteError } = await client
      .from('exercise_shares')
      .delete()
      .eq('exercise_id', exerciseId)
      .eq('shared_with_user_id', sharedWithUserId)
      .eq('created_by', userId);

    if (deleteError) return false;

    const { count, error: countError } = await client
      .from('exercise_shares')
      .select('id', { count: 'exact', head: true })
      .eq('exercise_id', exerciseId);

    if (countError) return false;

    if ((count || 0) === 0) {
      const { error: visibilityError } = await client
        .from('exercises')
        .update({ visibility: 'private' })
        .eq('id', exerciseId)
        .eq('created_by', userId)
        .eq('visibility', 'shared');

      if (visibilityError) return false;
    }

    return true;
  }

  async sharePlan(userId: string, planId: string, sharedWithUserId: string) {
    const client = this.supabase.getClient();
    if (!client) return false;

    const { error } = await client.from('workout_plan_shares').upsert(
      {
        plan_id: planId,
        shared_with_user_id: sharedWithUserId,
        created_by: userId,
      },
      { onConflict: 'plan_id,shared_with_user_id' }
    );

    if (error) return false;

    const { error: visibilityError } = await client
      .from('workout_plans')
      .update({ visibility: 'shared' })
      .eq('id', planId)
      .eq('owner_id', userId);

    if (visibilityError) return false;

    return true;
  }

  async unsharePlan(userId: string, planId: string, sharedWithUserId: string) {
    const client = this.supabase.getClient();
    if (!client) return false;

    const { error: deleteError } = await client
      .from('workout_plan_shares')
      .delete()
      .eq('plan_id', planId)
      .eq('shared_with_user_id', sharedWithUserId)
      .eq('created_by', userId);

    if (deleteError) return false;

    const { count, error: countError } = await client
      .from('workout_plan_shares')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId);

    if (countError) return false;

    if ((count || 0) === 0) {
      const { error: visibilityError } = await client
        .from('workout_plans')
        .update({ visibility: 'private' })
        .eq('id', planId)
        .eq('owner_id', userId)
        .eq('visibility', 'shared');

      if (visibilityError) return false;
    }

    return true;
  }

  async resolveUserIdByEmail(email: string) {
    const client = this.supabase.getClient();
    if (!client) return null;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;

    const { data, error } = await client
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) return null;

    const profile = data as ProfileLookupRow | null;
    return profile?.id || null;
  }

  async uploadExerciseImage(userId: string, file: File) {
    const client = this.supabase.getClient();
    if (!client) return null;

    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.82,
    });
    const fileExt = optimizedFile.name.includes('.') ? optimizedFile.name.split('.').pop() : 'jpg';
    const safeExt = (fileExt || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;

    const uploadPromise = client
      .storage
      .from('exercise-images')
      .upload(filePath, optimizedFile, { upsert: false });

    const timeoutMs = 20000;
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
      setTimeout(() => resolve({ data: null, error: { message: 'Upload timed out. Please try again.' } }), timeoutMs);
    });

    const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
    const uploadError = uploadResult?.error;

    if (uploadError) return null;

    const { data } = client.storage.from('exercise-images').getPublicUrl(filePath);
    return data.publicUrl || null;
  }
}
