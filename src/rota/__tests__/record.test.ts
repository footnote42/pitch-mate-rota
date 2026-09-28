import { describe, it, expect } from 'vitest';
import { Action, assess, emptyState, gameRecord, reduce, State } from '../index';
import { deserialize, serialize, STORAGE_KEY } from '../storage';

const run = (...actions: Action[]): State => actions.reduce(reduce, emptyState());
const add = (id: string, experienceLevel: 1 | 2 | 3 = 2): Action => ({ type: 'addPlayer', id, name: id, experienceLevel });
const pick = (playerId: string, game: number, half: 1 | 2): Action => ({ type: 'togglePick', playerId, game, half });
const tick = (playerId: string, game: number, quarter: 1 | 2 | 3 | 4): Action => ({ type: 'toggleQuarter', playerId, game, quarter });
const played = (game: number, isPlayed = true): Action => ({ type: 'setPlayed', game, played: isPlayed });
const out = (playerId: string, game: number, quarter: 1 | 2 | 3 | 4): Action => ({ type: 'removeForDay', playerId, reason: 'injury', game, quarter });

// U7 (4 a side), 3 games: minimum 3 halves = 6 quarters.
const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
const u7 = (...actions: Action[]) => run({ type: 'setAgeGroup', ageGroup: 'U7' }, { type: 'setGames', games: 3 }, ...ids.map(id => add(id)), ...actions);
const quarters = (s: State, game: number, id: string) => gameRecord(s, game).filter(q => q.playerId === id).map(q => q.quarter).sort();

describe('match record', () => {
  it('starts from the plan, in quarters', () => {
    const s = u7(pick('a', 1, 1), pick('b', 1, 2));
    expect(quarters(s, 1, 'a')).toEqual([1, 2]);
    expect(quarters(s, 1, 'b')).toEqual([3, 4]);
  });

  it('ticking a quarter records it, and never changes the plan', () => {
    const s = u7(pick('a', 1, 1), tick('a', 1, 2), tick('b', 1, 2));
    expect(quarters(s, 1, 'a')).toEqual([1]);
    expect(quarters(s, 1, 'b')).toEqual([2]);
    expect(s.festival.picks).toEqual([{ playerId: 'a', game: 1, half: 1 }]);
  });

  it('blocks a quarter once the side is full', () => {
    const s = u7(...['a', 'b', 'c', 'd', 'e'].map(id => tick(id, 1, 1)));
    expect(gameRecord(s, 1).filter(q => q.quarter === 1)).toHaveLength(4);
    expect(quarters(s, 1, 'e')).toEqual([]);
  });

  it('the plan counts until the game is played; then the record does', () => {
    const s = u7(pick('a', 1, 1), pick('a', 1, 2), tick('a', 1, 4));
    expect(assess(s).players.a.planned).toBe(4);
    const recorded = reduce(s, played(1));
    expect(assess(recorded).players.a.planned).toBe(3);
    expect(assess(reduce(recorded, played(1, false))).players.a.planned).toBe(4);
  });

  it('with a half length, a quarter is half a half in minutes', () => {
    const s = u7({ type: 'setHalfLength', minutes: 10 }, tick('a', 1, 1), played(1));
    expect(assess(s).players.a.plannedMinutes).toBe(5);
  });

  it('a partial half counts toward consecutive halves', () => {
    // one quarter in each of four halves in a row
    const s = u7(tick('a', 1, 2), tick('a', 1, 3), played(1), pick('a', 2, 1), pick('a', 2, 2));
    expect(assess(s).players.a.longestRun).toBe(4);
  });

  it('recorded games cannot be picked into by the minimum check', () => {
    // 'a' recorded nothing in game 1 and games 2-3 are full of others: Short
    const others = ['b', 'c', 'd', 'e'];
    const fills = [2, 3].flatMap(g => [1, 2].flatMap(h => others.map(id => pick(id, g, h as 1 | 2))));
    const s = u7(...fills, played(1));
    expect(assess(s).players.a.status).toBe('impossible');
  });
});

describe('out for the day (permanent removal)', () => {
  it('clears later quarters and picks, waives the minimum, blocks new picks', () => {
    const s = u7(pick('a', 1, 1), pick('a', 1, 2), pick('a', 2, 1), out('a', 1, 2));
    expect(quarters(s, 1, 'a')).toEqual([1, 2]);
    expect(s.festival.picks).toEqual([{ playerId: 'a', game: 1, half: 1 }]);
    expect(assess(s).players.a.status).toBe('exempt');
    expect(assess(s).flags.some(f => f.kind === 'belowMinimum' && f.playerId === 'a')).toBe(false);
    expect(reduce(s, pick('a', 3, 1))).toBe(s);
    expect(reduce(s, tick('a', 1, 4))).toBe(s);
  });

  it('removed in the second half keeps that half in the plan', () => {
    const s = u7(pick('a', 1, 2), out('a', 1, 3));
    expect(s.festival.picks).toEqual([{ playerId: 'a', game: 1, half: 2 }]);
    expect(quarters(s, 1, 'a')).toEqual([3]);
  });

  it('can be taken back', () => {
    const s = u7(out('a', 1, 1), { type: 'cancelRemoval', playerId: 'a' });
    expect(s.festival.removals).toEqual({});
    expect(assess(s).players.a.status).not.toBe('exempt');
  });
});

describe('auto-fill after a recorded game', () => {
  it('11. leaves recorded games alone and counts their quarters', () => {
    // game 1: a, b, c, d play all four quarters; the plan for game 1 was empty
    const recorded = u7(...['a', 'b', 'c', 'd'].flatMap(id => [1, 2, 3, 4].map(q => tick(id, 1, q as 1 | 2 | 3 | 4))), played(1));
    const s = reduce(recorded, { type: 'autoFill', seed: 0 });
    expect(s.festival.picks.filter(p => p.game === 1)).toEqual([]);
    expect(gameRecord(s, 1)).toEqual(gameRecord(recorded, 1));
    // e and f, who sat out game 1, are owed three halves from the four left
    for (const id of ['e', 'f']) expect(s.festival.picks.filter(p => p.playerId === id).length).toBeGreaterThanOrEqual(3);
    expect(Object.values(assess(s).players).every(p => p.status === 'ok')).toBe(true);
  });

  it('12. a removed player is not picked and not flagged', () => {
    const s = u7(out('a', 1, 1), { type: 'autoFill', seed: 0 });
    expect(s.festival.picks.filter(p => p.playerId === 'a')).toEqual([]);
    expect(assess(s).flags.some(f => f.kind === 'belowMinimum' && f.playerId === 'a')).toBe(false);
  });
});

describe('record housekeeping', () => {
  it('survives saving', () => {
    const s = u7(pick('a', 1, 1), tick('b', 1, 3), played(1), out('c', 2, 2));
    expect(deserialize(key => (key === STORAGE_KEY ? serialize(s) : null)).state).toEqual(s);
  });

  it('fewer games drop their records and removals; a new festival clears them', () => {
    const s = u7({ type: 'setGames', games: 4 }, tick('a', 4, 1), played(4), out('b', 4, 1), tick('c', 1, 1));
    const fewer = reduce(s, { type: 'setGames', games: 3 }).festival;
    expect(Object.keys(fewer.records)).toEqual(['1']);
    expect(fewer.removals).toEqual({});
    const cleared = reduce(s, { type: 'newFestival', keepSquad: true }).festival;
    expect(cleared.records).toEqual({});
    expect(cleared.removals).toEqual({});
  });
});
