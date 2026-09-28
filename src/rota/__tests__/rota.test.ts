import { describe, it, expect } from 'vitest';
import { Action, assess, emptyState, halfKey, reduce, State } from '../index';
import { BACKUP_KEY, deserialize, serialize, STORAGE_KEY } from '../storage';

const run = (...actions: Action[]): State => actions.reduce(reduce, emptyState());
const add = (id: string, name = id, experienceLevel: 1 | 2 | 3 = 2): Action => ({ type: 'addPlayer', id, name, experienceLevel });
const pick = (playerId: string, game: number, half: 1 | 2): Action => ({ type: 'togglePick', playerId, game, half });

describe('picks', () => {
  it('toggles a pick on and off', () => {
    const on = run(add('a'), pick('a', 1, 1));
    expect(on.festival.picks).toHaveLength(1);
    expect(reduce(on, pick('a', 1, 1)).festival.picks).toHaveLength(0);
  });

  it('blocks a pick when the half is full', () => {
    // U7: 4 on the pitch
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const s = run({ type: 'setAgeGroup', ageGroup: 'U7' }, ...ids.map(id => add(id)), ...ids.map(id => pick(id, 1, 1)));
    expect(assess(s).halves[halfKey(1, 1)]).toMatchObject({ count: 4, capacity: 4, full: true });
  });

  it('renaming keeps picks, re-sorts, ignores blank names', () => {
    const s = run(add('a', 'Zed'), add('b', 'Amy'), pick('a', 1, 1), { type: 'renamePlayer', playerId: 'a', name: ' Abe ' });
    expect(s.squad.map(p => p.name)).toEqual(['Abe', 'Amy']);
    expect(s.festival.picks).toHaveLength(1);
    expect(reduce(s, { type: 'renamePlayer', playerId: 'a', name: '  ' })).toBe(s);
  });

  it('removing a player drops their picks', () => {
    const s = run(add('a'), pick('a', 1, 1), { type: 'removePlayer', playerId: 'a' });
    expect(s.festival.picks).toEqual([]);
  });
});

describe('games', () => {
  it('increasing keeps picks', () => {
    const s = run(add('a'), pick('a', 1, 1), { type: 'setGames', games: 6 });
    expect(s.festival.games).toBe(6);
    expect(s.festival.picks).toHaveLength(1);
  });

  it('decreasing drops only picks in removed games (dry run shows which)', () => {
    const before = run(add('a'), pick('a', 1, 1), pick('a', 5, 2));
    const after = reduce(before, { type: 'setGames', games: 3 });
    expect(after.festival.picks).toEqual([{ playerId: 'a', game: 1, half: 1 }]);
    expect(before.festival.games).toBe(5);
  });

  it('ignores counts outside 3-8', () => {
    const s = run({ type: 'setGames', games: 9 });
    expect(s.festival.games).toBe(5);
  });

  it('changing age group clears picks, keeps squad and labels', () => {
    const s = run(add('a'), pick('a', 1, 1), { type: 'setLabel', game: 1, label: 'Tigers' }, { type: 'setAgeGroup', ageGroup: 'U9' });
    expect(s.festival.picks).toEqual([]);
    expect(s.squad).toHaveLength(1);
    expect(s.festival.labels[1]).toBe('Tigers');
  });
});

describe('newFestival', () => {
  const played = () => run(add('a'), pick('a', 1, 1), { type: 'setAgeGroup', ageGroup: 'U9' }, { type: 'setLabel', game: 1, label: 'x' });

  it('keeps the squad and age group when asked', () => {
    const s = reduce(played(), { type: 'newFestival', keepSquad: true });
    expect(s.squad).toHaveLength(1);
    expect(s.festival).toMatchObject({ ageGroup: 'U9', picks: [], labels: {} });
  });

  it('clears everything otherwise', () => {
    expect(reduce(played(), { type: 'newFestival', keepSquad: false })).toEqual(emptyState());
  });
});

describe('assess: minimum and status', () => {
  it('minimum is half the festival, in quarters', () => {
    // 4 games = 8 halves = 16 quarters; minimum 8 quarters = 4 halves
    const a = assess(run({ type: 'setGames', games: 4 }, add('a')));
    expect(a.minimum).toBe(8);
    expect(a.players.a).toMatchObject({ planned: 0, minimum: 8, status: 'below' });
  });

  it('ok once the minimum is planned', () => {
    const s = run({ type: 'setGames', games: 3 }, add('a'), pick('a', 1, 1), pick('a', 2, 1), pick('a', 3, 1));
    expect(assess(s).players.a).toMatchObject({ planned: 6, status: 'ok' });
    expect(assess(s).flags.some(f => f.kind === 'belowMinimum')).toBe(false);
  });

  it('impossible when too few open places remain', () => {
    // U7, 3 games: min 3 halves. Fill 4 of 6 halves with others, 'a' can reach only 2.
    const others = ['b', 'c', 'd', 'e'];
    const fills = [1, 2].flatMap(g => [1, 2].flatMap(h => others.map(id => pick(id, g, h as 1 | 2))));
    const s = run({ type: 'setAgeGroup', ageGroup: 'U7' }, { type: 'setGames', games: 3 }, add('a'), ...others.map(id => add(id)), ...fills);
    expect(assess(s).players.a.status).toBe('impossible');
    expect(assess(s).flags).toContainEqual({ kind: 'belowMinimum', playerId: 'a', impossible: true });
  });
});

describe('assess: tight and consecutive halves', () => {
  it('tight when exactly enough open places remain', () => {
    // U7, 3 games: min 3 halves. Fill 3 of 6 halves with others: 'a' has exactly 3 left.
    const others = ['b', 'c', 'd', 'e'];
    const fills = [[1, 1], [1, 2], [2, 1]].flatMap(([g, h]) => others.map(id => pick(id, g, h as 1 | 2)));
    const s = run({ type: 'setAgeGroup', ageGroup: 'U7' }, { type: 'setGames', games: 3 }, add('a'), ...others.map(id => add(id)), ...fills);
    expect(assess(s).players.a.status).toBe('tight');
  });

  it('flags more than three halves in a row, across games', () => {
    const three = run(add('a'), pick('a', 1, 2), pick('a', 2, 1), pick('a', 2, 2));
    expect(assess(three).players.a.longestRun).toBe(3);
    expect(assess(three).flags.some(f => f.kind === 'consecutive')).toBe(false);
    const four = reduce(three, pick('a', 3, 1));
    expect(assess(four).flags).toContainEqual({ kind: 'consecutive', playerId: 'a', run: 4 });
  });
});

describe('assess: balance', () => {
  it('flags a half whose experience is outside the range', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const s = run({ type: 'setAgeGroup', ageGroup: 'U7' }, ...ids.map(id => add(id, id, 3)), ...ids.map(id => pick(id, 1, 1)));
    expect(assess(s).halves[halfKey(1, 1)].balance).toEqual({
      total: 12, target: 8, balanced: false, verdict: 'heavy', mix: { 1: 0, 2: 0, 3: 4 },
    });
    expect(assess(s).flags).toContainEqual({ kind: 'unbalanced', game: 1, half: 1 });
  });

  it('judges balance only once the half is full', () => {
    const s = run({ type: 'setAgeGroup', ageGroup: 'U7' }, add('a', 'a', 3), pick('a', 1, 1));
    expect(assess(s).halves[halfKey(1, 1)].balance).toMatchObject({ verdict: null, balanced: true, mix: { 1: 0, 2: 0, 3: 1 } });
    expect(assess(s).flags.some(f => f.kind === 'unbalanced')).toBe(false);
  });

  it('complete when every half is full and balanced', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const all = [1, 2, 3].flatMap(g => [1, 2].flatMap(h => ids.map(id => pick(id, g, h as 1 | 2))));
    const s = run({ type: 'setAgeGroup', ageGroup: 'U7' }, { type: 'setGames', games: 3 }, ...ids.map(id => add(id)), ...all);
    expect(assess(s).complete).toBe(true);
  });
});

describe('assess: minutes and caps', () => {
  it('no minutes until a half length is set', () => {
    const a = assess(run(add('a')));
    expect(a.totalMinutes).toBeNull();
    expect(a.players.a.plannedMinutes).toBeNull();
  });

  it('reads quarters as minutes and flags caps', () => {
    // U9: 15 min per half, 60 per day. 4 games x 2 x 8 = 64 > 60.
    const s = run({ type: 'setAgeGroup', ageGroup: 'U9' }, { type: 'setGames', games: 4 }, { type: 'setHalfLength', minutes: 8 }, add('a'), pick('a', 1, 1));
    const a = assess(s);
    expect(a.players.a.plannedMinutes).toBe(8);
    expect(a.totalMinutes).toBe(64);
    expect(a.minimumMinutes).toBe(32);
    expect(a.flags).toContainEqual({ kind: 'dayOverCap', totalMinutes: 64, cap: 60 });
    expect(a.flags.some(f => f.kind === 'halfOverCap')).toBe(false);
    const long = assess(reduce(s, { type: 'setHalfLength', minutes: 16 }));
    expect(long.flags).toContainEqual({ kind: 'halfOverCap', halfLength: 16, cap: 15 });
  });

  it('changing half length never changes picks', () => {
    const s = run(add('a'), pick('a', 1, 1));
    expect(reduce(s, { type: 'setHalfLength', minutes: 10 }).festival.picks).toEqual(s.festival.picks);
  });
});

describe('display names', () => {
  it('forename, plus surname letters only until unique', () => {
    const s = run(add('1', 'Sam Jones'), add('2', 'Sam Johnson'), add('3', 'Alex Smith'), add('4', 'Sam Brown'));
    const names = Object.fromEntries(Object.values(assess(s).players).map(p => [p.id, p.displayName]));
    expect(names).toEqual({ '1': 'Sam Jon', '2': 'Sam Joh', '3': 'Alex', '4': 'Sam B' });
  });
});

describe('saving', () => {
  const storage = (entries: Record<string, string>) => (key: string) => entries[key] ?? null;

  it('round-trips', () => {
    const s = run(add('a'), pick('a', 1, 1), { type: 'setHalfLength', minutes: 10 });
    expect(deserialize(storage({ [STORAGE_KEY]: serialize(s) }))).toEqual({ state: s, backup: null });
  });

  it('migrates the old keys', () => {
    const legacy = JSON.stringify({
      players: [{ id: 'p1', name: 'Alex', experienceLevel: 'experienced' }, { id: 'p2', name: 'Bo', experienceLevel: 1 }],
      assignments: [{ playerId: 'p1', game: 1, half: 1 }, { playerId: 'gone', game: 1, half: 1 }, { playerId: 'p2', game: 7, half: 1 }],
      numberOfGames: 4,
      gameLabels: { 1: 'Tigers' },
    });
    const { state, backup } = deserialize(storage({ 'squad-rotation-state': legacy, 'squad-rotation-age-group': 'U9' }));
    expect(backup).toBeNull();
    expect(state.squad.map(p => p.experienceLevel)).toEqual([3, 1]);
    expect(state.festival).toEqual({
      ageGroup: 'U9',
      games: 4,
      labels: { 1: 'Tigers' },
      halfLength: null,
      picks: [{ playerId: 'p1', game: 1, half: 1 }],
      availability: {},
    });
  });

  it('unreadable data starts empty and is handed back for backup', () => {
    for (const raw of ['{not json', JSON.stringify({ version: 1, squad: 'x', festival: {} }), JSON.stringify([1, 2])]) {
      expect(deserialize(storage({ [STORAGE_KEY]: raw }))).toEqual({ state: emptyState(), backup: raw });
    }
    expect(BACKUP_KEY).not.toBe(STORAGE_KEY);
  });

  it('nothing saved starts empty', () => {
    expect(deserialize(storage({}))).toEqual({ state: emptyState(), backup: null });
  });
});

describe('availability', () => {
  // U7 (4 a side), 4 games: minimum 4 halves (8 quarters).
  const base = (...actions: Action[]) => run({ type: 'setAgeGroup', ageGroup: 'U7' }, { type: 'setGames', games: 4 }, add('a'), ...actions);
  const avail = (arrives: number, leaves: number): Action => ({ type: 'setAvailability', playerId: 'a', arrives, leaves });

  it('an early leaver cannot be picked after leaving, and keeps the full minimum', () => {
    const s = base(avail(1, 2), pick('a', 3, 1));
    expect(s.festival.picks).toEqual([]);
    const a = assess(s).players.a;
    expect(a).toMatchObject({ minimum: 8, arrives: 1, leaves: 2, status: 'tight' });
  });

  it('a late arrival cannot be picked before arriving', () => {
    const s = base(avail(2, 4), pick('a', 1, 2), pick('a', 2, 1));
    expect(s.festival.picks).toEqual([{ playerId: 'a', game: 2, half: 1 }]);
    expect(assess(s).players.a.status).toBe('below');
  });

  it('setting availability drops picks outside it', () => {
    const s = base(pick('a', 1, 1), pick('a', 4, 2), avail(1, 3));
    expect(s.festival.picks).toEqual([{ playerId: 'a', game: 1, half: 1 }]);
  });

  it('impossible (Short) when available halves cannot reach the minimum', () => {
    const a = assess(base(avail(1, 1)));
    expect(a.players.a.status).toBe('impossible');
    expect(a.flags).toContainEqual({ kind: 'belowMinimum', playerId: 'a', impossible: true });
  });

  it('full day is stored as no entry; fewer games clamps it; a new festival clears it', () => {
    expect(base(avail(2, 3), avail(1, 4)).festival.availability).toEqual({});
    expect(base(avail(2, 4), { type: 'setGames', games: 3 }).festival.availability).toEqual({ a: { arrives: 2, leaves: 3 } });
    expect(base(avail(2, 3), { type: 'newFestival', keepSquad: true }).festival.availability).toEqual({});
  });

  it('ignores impossible ranges', () => {
    const s = base(avail(1, 2));
    expect(reduce(s, avail(3, 2))).toBe(s);
    expect(reduce(s, avail(0, 2))).toBe(s);
  });

  it('survives saving', () => {
    const s = base(avail(2, 3));
    expect(deserialize(key => (key === STORAGE_KEY ? serialize(s) : null)).state).toEqual(s);
  });
});
