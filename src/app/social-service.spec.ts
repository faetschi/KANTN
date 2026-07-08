import { TestBed } from '@angular/core/testing';
import { SocialService, SendRequestResult } from './core/services/social.service';
import { SupabaseService } from './core/services/supabase.service';

type RpcHandler = (args: any) => { data: any; error: any };

/**
 * Fake Supabase client whose `rpc` dispatches on the function name so we can
 * drive the SocialService.sendRequest feedback branches without a backend.
 */
function makeClient(handlers: Record<string, RpcHandler>) {
  return {
    rpc: (fn: string, args: any) => {
      const handler = handlers[fn];
      if (!handler) return Promise.resolve({ data: null, error: { message: `no handler for ${fn}` } });
      return Promise.resolve(handler(args));
    },
  };
}

function configure(client: unknown): SocialService {
  TestBed.configureTestingModule({
    providers: [
      SocialService,
      { provide: SupabaseService, useValue: { getClient: () => client } },
    ],
  });
  return TestBed.inject(SocialService);
}

describe('SocialService.sendRequest', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns not_found when the username does not resolve', async () => {
    const service = configure(makeClient({
      get_public_profile_by_username: () => ({ data: [], error: null }),
    }));
    expect(await service.sendRequest('ghost')).toBe('not_found');
  });

  it('returns error when the client is unavailable', async () => {
    const service = configure(null);
    expect(await service.sendRequest('someone')).toBe('error');
  });

  it('strips a leading @ and forwards the resolved id to send_friend_request', async () => {
    let forwardedId: string | null = null;
    const service = configure(makeClient({
      get_public_profile_by_username: (args) => {
        expect(args.p_username).toBe('alice');
        return { data: [{ id: 'user-123' }], error: null };
      },
      send_friend_request: (args) => {
        forwardedId = args.p_addressee;
        return { data: 'sent', error: null };
      },
      get_friends: () => ({ data: [], error: null }),
      get_friend_requests: () => ({ data: [], error: null }),
    }));

    const result = await service.sendRequest('@Alice');
    expect(result).toBe('sent');
    expect(forwardedId).toBe('user-123');
  });

  const passthroughCases: SendRequestResult[] = [
    'already_friends',
    'already_pending',
    'accepted_incoming',
    'self',
  ];

  passthroughCases.forEach((rpcResult) => {
    it(`passes through the "${rpcResult}" status from the RPC`, async () => {
      const service = configure(makeClient({
        get_public_profile_by_username: () => ({ data: [{ id: 'user-1' }], error: null }),
        send_friend_request: () => ({ data: rpcResult, error: null }),
        get_friends: () => ({ data: [], error: null }),
        get_friend_requests: () => ({ data: [], error: null }),
      }));
      expect(await service.sendRequest('bob')).toBe(rpcResult);
    });
  });

  it('returns error when the send RPC fails', async () => {
    const service = configure(makeClient({
      get_public_profile_by_username: () => ({ data: [{ id: 'user-1' }], error: null }),
      send_friend_request: () => ({ data: null, error: { message: 'boom' } }),
    }));
    expect(await service.sendRequest('bob')).toBe('error');
  });
});

describe('SocialService feed pagination', () => {
  afterEach(() => TestBed.resetTestingModule());

  function feedRow(id: string, finishedAt: string) {
    return {
      session_id: id,
      user_id: 'u1',
      username: 'alice',
      display_name: 'Alice',
      avatar_url: null,
      last_seen: null,
      plan_name: 'Push',
      total_calories: 100,
      duration_seconds: 600,
      finished_at: finishedAt,
      photo_url: null,
      streak: 3,
    };
  }

  it('loads the first page and flags more when a full batch returns', async () => {
    const service = configure(makeClient({
      get_friends_feed: () => ({
        data: Array.from({ length: 15 }, (_, i) => feedRow(`s${i}`, `2026-07-0${(i % 9) + 1}T10:00:00Z`)),
        error: null,
      }),
    }));

    await service.loadActivity();
    expect(service.activity().length).toBe(15);
    expect(service.hasMoreActivity()).toBe(true);
  });

  it('does not flag more when a partial batch returns', async () => {
    const service = configure(makeClient({
      get_friends_feed: () => ({ data: [feedRow('s0', '2026-07-06T10:00:00Z')], error: null }),
    }));

    await service.loadActivity();
    expect(service.hasMoreActivity()).toBe(false);
  });

  it('appends the next batch using the last item as the keyset cursor', async () => {
    let secondCall: any = null;
    let call = 0;
    const service = configure(makeClient({
      get_friends_feed: (args) => {
        call += 1;
        if (call === 1) {
          return {
            data: Array.from({ length: 15 }, (_, i) => feedRow(`a${i}`, '2026-07-06T10:00:00Z')),
            error: null,
          };
        }
        secondCall = args;
        return { data: [feedRow('b0', '2026-07-05T10:00:00Z')], error: null };
      },
    }));

    await service.loadActivity();
    const appended = await service.loadMoreActivity();

    expect(appended).toBe(1);
    expect(service.activity().length).toBe(16);
    expect(service.hasMoreActivity()).toBe(false);
    expect(secondCall.p_before_id).toBe('a14');
    expect(secondCall.p_before_at).toBe('2026-07-06T10:00:00Z');
  });

  it('is a no-op when nothing more is available', async () => {
    const service = configure(makeClient({
      get_friends_feed: () => ({ data: [feedRow('s0', '2026-07-06T10:00:00Z')], error: null }),
    }));

    await service.loadActivity();
    expect(await service.loadMoreActivity()).toBe(0);
  });
});

describe('SocialService.loadUserSessions', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns [] when the client is unavailable', async () => {
    const service = configure(null);
    expect(await service.loadUserSessions('u1')).toEqual([]);
  });

  it('returns [] and does not call the RPC without a userId', async () => {
    let called = false;
    const service = configure(makeClient({
      get_user_sessions: () => { called = true; return { data: [], error: null }; },
    }));
    expect(await service.loadUserSessions('')).toEqual([]);
    expect(called).toBe(false);
  });

  it('maps rows and forwards the keyset cursor', async () => {
    let forwarded: any = null;
    const service = configure(makeClient({
      get_user_sessions: (args) => {
        forwarded = args;
        return {
          data: [
            { session_id: 's1', plan_name: 'Push', total_calories: '250', duration_seconds: '1200', finished_at: '2026-07-06T10:00:00Z', photo_url: 'http://x/p.jpg' },
          ],
          error: null,
        };
      },
    }));

    const rows = await service.loadUserSessions('u1', 20, '2026-07-07T00:00:00Z', 's0');
    expect(rows.length).toBe(1);
    expect(rows[0]).toEqual({
      sessionId: 's1',
      planName: 'Push',
      totalCalories: 250,
      durationSeconds: 1200,
      finishedAt: '2026-07-06T10:00:00Z',
      photoUrl: 'http://x/p.jpg',
    });
    expect(forwarded.p_user).toBe('u1');
    expect(forwarded.p_before_at).toBe('2026-07-07T00:00:00Z');
    expect(forwarded.p_before_id).toBe('s0');
  });

  it('returns [] when the RPC errors (e.g. no access)', async () => {
    const service = configure(makeClient({
      get_user_sessions: () => ({ data: null, error: { message: 'nope' } }),
    }));
    expect(await service.loadUserSessions('u1')).toEqual([]);
  });
});

describe('SocialService.loadSession', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns null when the RPC has no access (null data)', async () => {
    const service = configure(makeClient({
      get_friend_session: (args) => {
        expect(args.p_session_id).toBe('sess-1');
        return { data: null, error: null };
      },
    }));
    expect(await service.loadSession('sess-1')).toBeNull();
  });

  it('returns null when the client is unavailable', async () => {
    const service = configure(null);
    expect(await service.loadSession('sess-1')).toBeNull();
  });

  it('maps the JSON payload into a FriendSessionDetail', async () => {
    const service = configure(makeClient({
      get_friend_session: () => ({
        data: {
          sessionId: 'sess-1',
          userId: 'user-9',
          username: 'alice',
          displayName: 'Alice',
          avatarUrl: null,
          planName: 'Push Day',
          totalCalories: '312.5',
          durationSeconds: '1800',
          startedAt: '2026-07-06T10:00:00Z',
          finishedAt: '2026-07-06T10:30:00Z',
          photoUrl: 'http://x/p.jpg',
          streak: '4',
          exercises: [
            {
              exerciseId: 'ex-1',
              name: 'Bench Press',
              exerciseTypeSnapshot: 'strength',
              durationSeconds: 0,
              distanceMeters: 0,
              avgPacePerKmSeconds: 0,
              maxPacePerKmSeconds: 0,
              avgSpeedKmh: 0,
              sets: [
                { reps: '10', weight: '50', completed: true },
                { reps: 8, weight: 55, completed: false },
              ],
            },
          ],
        },
        error: null,
      }),
    }));

    const detail = await service.loadSession('sess-1');
    expect(detail).not.toBeNull();
    expect(detail!.displayName).toBe('Alice');
    expect(detail!.totalCalories).toBe(312.5);
    expect(detail!.durationSeconds).toBe(1800);
    expect(detail!.streak).toBe(4);
    expect(detail!.exercises.length).toBe(1);
    expect(detail!.exercises[0].name).toBe('Bench Press');
    expect(detail!.exercises[0].sets.length).toBe(2);
    expect(detail!.exercises[0].sets[0]).toEqual({ reps: 10, weight: 50, completed: true });
    expect(detail!.exercises[0].sets[1].completed).toBe(false);
  });
});
