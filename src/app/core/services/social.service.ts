import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { normalizeUsername } from '../domain/username-utils';

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeen: string | null;
  streak: number;
  totalWorkouts: number;
  totalCalories: number;
}

export interface FriendRequest {
  requestId: string;
  requesterId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface FriendActivity {
  sessionId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeen: string | null;
  planName: string | null;
  totalCalories: number;
  durationSeconds: number;
  finishedAt: string;
  photoUrl: string | null;
  streak: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  totalWorkouts: number;
  totalCalories: number;
  streak: number;
  isMe: boolean;
}

export interface UserSession {
  sessionId: string;
  planName: string | null;
  totalCalories: number;
  durationSeconds: number;
  finishedAt: string;
  photoUrl: string | null;
}

export interface FriendSessionSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface FriendSessionExercise {
  exerciseId: string | null;
  name: string;
  exerciseTypeSnapshot: string | null;
  durationSeconds: number;
  distanceMeters: number;
  avgPacePerKmSeconds: number;
  maxPacePerKmSeconds: number;
  avgSpeedKmh: number;
  sets: FriendSessionSet[];
}

export interface FriendSessionDetail {
  sessionId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  planName: string | null;
  totalCalories: number;
  durationSeconds: number;
  startedAt: string;
  finishedAt: string;
  photoUrl: string | null;
  streak: number;
  exercises: FriendSessionExercise[];
}

export type SendRequestResult =
  | 'sent'
  | 'already_friends'
  | 'already_pending'
  | 'accepted_incoming'
  | 'self'
  | 'not_found'
  | 'not_allowed'
  | 'error';

@Injectable({ providedIn: 'root' })
export class SocialService {
  private supabase = inject(SupabaseService);

  /**
   * How many feed items to pull per batch. Kept as a mutable field so an admin
   * setting can override it later (see todo.md — "customizable for admins").
   */
  feedPageSize = 15;

  private friendsSignal = signal<Friend[]>([]);
  private friendRequestsSignal = signal<FriendRequest[]>([]);
  private activitySignal = signal<FriendActivity[]>([]);
  private leaderboardSignal = signal<LeaderboardEntry[]>([]);
  private myStreakSignal = signal<number>(0);
  private hasMoreActivitySignal = signal<boolean>(false);
  private loadingMoreSignal = signal<boolean>(false);

  friends = computed(() => this.friendsSignal());
  friendRequests = computed(() => this.friendRequestsSignal());
  activity = computed(() => this.activitySignal());
  leaderboard = computed(() => this.leaderboardSignal());
  myStreak = computed(() => this.myStreakSignal());
  pendingRequestCount = computed(() => this.friendRequestsSignal().length);
  /** True while more feed items exist beyond what is currently loaded. */
  hasMoreActivity = computed(() => this.hasMoreActivitySignal());
  /** True while a "load next batch" request is in flight. */
  loadingMoreActivity = computed(() => this.loadingMoreSignal());

  async refreshAll(): Promise<void> {
    await Promise.all([
      this.loadFriends(),
      this.loadRequests(),
      this.loadActivity(),
      this.loadLeaderboard(),
      this.loadMyStreak(),
    ]);
  }

  async loadFriends(): Promise<void> {
    const client = this.supabase.getClient();
    if (!client) return;

    const { data, error } = await client.rpc('get_friends');
    if (error || !Array.isArray(data)) return;

    this.friendsSignal.set(data.map((row: any) => ({
      id: row.id,
      username: row.username || '',
      displayName: row.display_name || row.username || 'User',
      avatarUrl: row.avatar_url || null,
      lastSeen: row.last_seen || null,
      streak: Number(row.streak || 0),
      totalWorkouts: Number(row.total_workouts || 0),
      totalCalories: Number(row.total_calories || 0),
    })));
  }

  async loadRequests(): Promise<void> {
    const client = this.supabase.getClient();
    if (!client) return;

    const { data, error } = await client.rpc('get_friend_requests');
    if (error || !Array.isArray(data)) return;

    this.friendRequestsSignal.set(data.map((row: any) => ({
      requestId: row.request_id,
      requesterId: row.requester_id,
      username: row.username || '',
      displayName: row.display_name || row.username || 'User',
      avatarUrl: row.avatar_url || null,
      createdAt: row.created_at,
    })));
  }

  private mapActivityRow(row: any): FriendActivity {
    return {
      sessionId: row.session_id,
      userId: row.user_id,
      username: row.username || '',
      displayName: row.display_name || row.username || 'User',
      avatarUrl: row.avatar_url || null,
      lastSeen: row.last_seen || null,
      planName: row.plan_name || null,
      totalCalories: Number(row.total_calories || 0),
      durationSeconds: Number(row.duration_seconds || 0),
      finishedAt: row.finished_at,
      photoUrl: row.photo_url || null,
      streak: Number(row.streak || 0),
    };
  }

  /** Load the newest page of the feed, resetting the pagination cursor. */
  async loadActivity(): Promise<void> {
    const client = this.supabase.getClient();
    if (!client) return;

    const { data, error } = await client.rpc('get_friends_feed', {
      p_limit: this.feedPageSize,
      p_before_at: null,
      p_before_id: null,
    });
    if (error || !Array.isArray(data)) return;

    const rows = data.map((row: any) => this.mapActivityRow(row));
    this.activitySignal.set(rows);
    this.hasMoreActivitySignal.set(rows.length >= this.feedPageSize);
  }

  /**
   * Append the next batch of feed items using a (finished_at, session_id)
   * keyset cursor. No-op when nothing more is available or a batch is already
   * loading. Returns the number of newly appended items.
   */
  async loadMoreActivity(): Promise<number> {
    const client = this.supabase.getClient();
    if (!client || this.loadingMoreSignal() || !this.hasMoreActivitySignal()) return 0;

    const current = this.activitySignal();
    const last = current[current.length - 1];
    if (!last) return 0;

    this.loadingMoreSignal.set(true);
    try {
      const { data, error } = await client.rpc('get_friends_feed', {
        p_limit: this.feedPageSize,
        p_before_at: last.finishedAt,
        p_before_id: last.sessionId,
      });
      if (error || !Array.isArray(data)) {
        this.hasMoreActivitySignal.set(false);
        return 0;
      }

      const rows = data.map((row: any) => this.mapActivityRow(row));
      // Guard against overlap in case of concurrent inserts sharing a cursor.
      const seen = new Set(current.map((item) => item.sessionId));
      const fresh = rows.filter((item) => !seen.has(item.sessionId));
      if (fresh.length > 0) {
        this.activitySignal.set([...current, ...fresh]);
      }
      this.hasMoreActivitySignal.set(rows.length >= this.feedPageSize);
      return fresh.length;
    } finally {
      this.loadingMoreSignal.set(false);
    }
  }

  async loadLeaderboard(limit = 100): Promise<void> {
    const client = this.supabase.getClient();
    if (!client) return;

    const { data, error } = await client.rpc('get_leaderboard', { p_limit: limit });
    if (error || !Array.isArray(data)) return;

    this.leaderboardSignal.set(data.map((row: any) => ({
      userId: row.user_id,
      username: row.username || '',
      displayName: row.display_name || row.username || 'User',
      avatarUrl: row.avatar_url || null,
      totalWorkouts: Number(row.total_workouts || 0),
      totalCalories: Number(row.total_calories || 0),
      streak: Number(row.streak || 0),
      isMe: !!row.is_me,
    })));
  }

  async loadMyStreak(): Promise<void> {
    const client = this.supabase.getClient();
    if (!client) return;

    const { data, error } = await client.rpc('get_my_streak');
    if (error || data == null) return;

    this.myStreakSignal.set(Number(data || 0));
  }

  async loadSession(sessionId: string): Promise<FriendSessionDetail | null> {
    const client = this.supabase.getClient();
    if (!client) return null;

    const { data, error } = await client.rpc('get_friend_session', { p_session_id: sessionId });
    if (error || !data) return null;

    const row = data as any;
    return {
      sessionId: row.sessionId,
      userId: row.userId,
      username: row.username || '',
      displayName: row.displayName || row.username || 'User',
      avatarUrl: row.avatarUrl || null,
      planName: row.planName || null,
      totalCalories: Number(row.totalCalories || 0),
      durationSeconds: Number(row.durationSeconds || 0),
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      photoUrl: row.photoUrl || null,
      streak: Number(row.streak || 0),
      exercises: Array.isArray(row.exercises)
        ? row.exercises.map((ex: any) => ({
            exerciseId: ex.exerciseId || null,
            name: ex.name || 'Exercise',
            exerciseTypeSnapshot: ex.exerciseTypeSnapshot || null,
            durationSeconds: Number(ex.durationSeconds || 0),
            distanceMeters: Number(ex.distanceMeters || 0),
            avgPacePerKmSeconds: Number(ex.avgPacePerKmSeconds || 0),
            maxPacePerKmSeconds: Number(ex.maxPacePerKmSeconds || 0),
            avgSpeedKmh: Number(ex.avgSpeedKmh || 0),
            sets: Array.isArray(ex.sets)
              ? ex.sets.map((s: any) => ({
                  reps: Number(s.reps || 0),
                  weight: Number(s.weight || 0),
                  completed: !!s.completed,
                }))
              : [],
          }))
        : [],
    };
  }

  /**
   * All finished workouts of a single user (self or an accepted friend),
   * newest first. Returns [] when the viewer has no access. Pass the last
   * loaded item's finishedAt/sessionId as a keyset cursor to load older ones.
   */
  async loadUserSessions(
    userId: string,
    limit = 20,
    beforeAt: string | null = null,
    beforeId: string | null = null,
  ): Promise<UserSession[]> {
    const client = this.supabase.getClient();
    if (!client || !userId) return [];

    const { data, error } = await client.rpc('get_user_sessions', {
      p_user: userId,
      p_limit: limit,
      p_before_at: beforeAt,
      p_before_id: beforeId,
    });
    if (error || !Array.isArray(data)) return [];

    return data.map((row: any) => ({
      sessionId: row.session_id,
      planName: row.plan_name || null,
      totalCalories: Number(row.total_calories || 0),
      durationSeconds: Number(row.duration_seconds || 0),
      finishedAt: row.finished_at,
      photoUrl: row.photo_url || null,
    }));
  }

  async sendRequest(username: string): Promise<SendRequestResult> {
    const client = this.supabase.getClient();
    if (!client) return 'error';

    const normalized = normalizeUsername(username).replace(/^@/, '');
    if (!normalized) return 'not_found';

    // Resolve @username -> id via the existing public profile RPC (avoids RLS).
    const { data: profileData, error: profileError } = await client.rpc('get_public_profile_by_username', {
      p_username: normalized,
    });
    if (profileError || !Array.isArray(profileData) || profileData.length === 0) {
      return 'not_found';
    }

    const addresseeId = (profileData[0] as { id: string }).id;
    const { data, error } = await client.rpc('send_friend_request', { p_addressee: addresseeId });
    if (error) return 'error';

    const result = (data as SendRequestResult) || 'error';
    if (result === 'sent' || result === 'accepted_incoming') {
      await Promise.all([this.loadFriends(), this.loadRequests()]);
    }
    return result;
  }

  async respondRequest(requestId: string, accept: boolean): Promise<boolean> {
    const client = this.supabase.getClient();
    if (!client) return false;

    const { data, error } = await client.rpc('respond_friend_request', {
      p_request_id: requestId,
      p_accept: accept,
    });
    if (error || !data) return false;

    await Promise.all([this.loadRequests(), this.loadFriends()]);
    return true;
  }

  async removeFriend(friendId: string): Promise<boolean> {
    const client = this.supabase.getClient();
    if (!client) return false;

    const { data, error } = await client.rpc('remove_friend', { p_friend: friendId });
    if (error || !data) return false;

    await this.loadFriends();
    return true;
  }

  clear(): void {
    this.friendsSignal.set([]);
    this.friendRequestsSignal.set([]);
    this.activitySignal.set([]);
    this.leaderboardSignal.set([]);
    this.myStreakSignal.set(0);
    this.hasMoreActivitySignal.set(false);
    this.loadingMoreSignal.set(false);
  }
}
