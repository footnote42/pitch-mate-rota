import { describe, it, expect } from 'vitest';
import { Action, assess, emptyState, halfKey, reduce, State } from '../index';

const run = (...actions: Action[]): State => actions.reduce(reduce, emptyState());
const add = (id: string, experienceLevel: 1 | 2 | 3 = 2): Action => ({ type: 'addPlayer', id, name: id, experienceLevel });
const pick = (playerId: string, game: number, half: 1 | 2): Action => ({ type: 'togglePick', playerId, game, half });
const fill = (seed = 0): Action => ({ type: 'autoFill', seed });
const away = (playerId: string, arrives: number, leaves: number): Action => ({ type: 'setAvailability', playerId, arrives, leaves });

// U9 (7 a side), 4 games = 8 halves, 56 places. 12 players: minimum 4 halves each.
const ids = Array.from({ length: 12 }, (_, i) => `p${String(i + 1).padStart(2, '0')}`);
const mixed = ids.map((id, i) => add(id, ((i % 3) + 1) as 1 | 2 | 3));
const u9 = (...actions: Action[]) => run({ type: 'setAgeGroup', ageGroup: 'U9' }, { type: 'setGames', games: 4 }, ...mixed, ...actions);

const halves = (s: State, id: string) => s.festival.picks.filter(p => p.playerId === id).map(p => `${p.game}-${p.half}`).sort();
const counts = (s: State, only = ids) => only.map(id => halves(s, id).length);
const totals = (s: State) => Object.values(assess(s).halves).map(h => h.balance.total);

describe('auto-fill', () => {
  it('1. fills only empty places and never moves a pick; a full plan is unchanged', () => {
    const before = u9(pick('p01', 1, 1), pick('p02', 3, 2));
    const after = reduce(before, fill());
    expect(after.festival.picks.slice(0, 2)).toEqual(before.festival.picks);
    expect(Object.values(assess(after).halves).every(h => h.full)).toBe(true);
    expect(reduce(after, fill()).festival.picks).toEqual(after.festival.picks);
  });

  it('2. everyone reaches the minimum', () => {
    const a = assess(u9(fill()));
    expect(Object.values(a.players).every(p => p.status === 'ok')).toBe(true);
  });

  it('3. an early leaver after game 2 gets all four halves of games 1-2', () => {
    const s = u9(away('p05', 1, 2), fill());
    expect(halves(s, 'p05')).toEqual(['1-1', '1-2', '2-1', '2-2']);
    expect(assess(s).players.p05.status).toBe('ok');
  });

  it('4. a late arrival gets the minimum from the games left, or is Short', () => {
    const s = u9(away('p05', 3, 4), fill());
    expect(halves(s, 'p05')).toEqual(['3-1', '3-2', '4-1', '4-2']);
    const late = u9(away('p05', 4, 4), fill());
    expect(halves(late, 'p05')).toEqual(['4-1', '4-2']);
    expect(assess(late).players.p05.status).toBe('impossible');
  });

  it('5. leaving after game 1 is Short and plays both game 1 halves', () => {
    const s = u9(away('p05', 1, 1), fill());
    expect(halves(s, 'p05')).toEqual(['1-1', '1-2']);
    expect(assess(s).flags).toContainEqual({ kind: 'belowMinimum', playerId: 'p05', impossible: true });
  });

  it('6. after minimums, all-day players end within one half of each other', () => {
    for (const s of [u9(fill()), u9(away('p05', 1, 2), fill()), u9(pick('p01', 1, 1), pick('p01', 2, 1), fill())]) {
      const c = counts(s, ids.filter(id => id !== 'p05'));
      expect(Math.max(...c) - Math.min(...c)).toBeLessThanOrEqual(1);
    }
  });

  it('7. mixed squad halves sit within 2 of the target; an all-Novice squad raises no flag', () => {
    // 4 each of N, I, E: average 2, target 14
    for (const t of totals(u9(fill()))) expect(Math.abs(t - 14)).toBeLessThanOrEqual(2);
    const novices = run({ type: 'setAgeGroup', ageGroup: 'U9' }, { type: 'setGames', games: 4 }, ...ids.map(id => add(id, 1)), fill());
    expect(assess(novices).flags.filter(f => f.kind === 'unbalanced')).toEqual([]);
  });

  it('8. coach picks that push a half out of range are left alone and flagged', () => {
    // every Experienced player plus three Intermediates: 18, over the 14 +/- 3.5 range
    const coach = ['p03', 'p06', 'p09', 'p12', 'p02', 'p05', 'p08'];
    const s = u9(...coach.map(id => pick(id, 1, 1)), fill());
    for (const id of coach) expect(halves(s, id)).toContain('1-1');
    expect(assess(s).halves[halfKey(1, 1)].balance.total).toBe(18);
    expect(assess(s).flags).toContainEqual({ kind: 'unbalanced', game: 1, half: 1 });
  });

  it('9. with fewer players than places, places stay empty', () => {
    const s = run({ type: 'setAgeGroup', ageGroup: 'U9' }, { type: 'setGames', games: 3 }, ...ids.slice(0, 5).map(id => add(id)), fill());
    expect(Object.values(assess(s).halves).map(h => h.count)).toEqual([5, 5, 5, 5, 5, 5]);
  });

  it('10. no run of 4+ unless a minimum needs it, then flagged', () => {
    expect(Object.values(assess(u9(fill())).players).every(p => p.longestRun <= 3)).toBe(true);
    const s = u9(away('p05', 1, 2), fill());
    expect(assess(s).flags).toContainEqual({ kind: 'consecutive', playerId: 'p05', run: 4 });
  });

  it('13. same seed, same plan; another seed differs but is still fair and balanced', () => {
    expect(u9(fill(7)).festival.picks).toEqual(u9(fill(7)).festival.picks);
    const other = u9(fill(8));
    expect(other.festival.picks).not.toEqual(u9(fill(7)).festival.picks);
    expect(Object.values(assess(other).players).every(p => p.status === 'ok')).toBe(true);
    const c = counts(other);
    expect(Math.max(...c) - Math.min(...c)).toBeLessThanOrEqual(1);
    for (const t of totals(other)) expect(Math.abs(t - 14)).toBeLessThanOrEqual(2);
  });

  it('14. is a pure step: the state before is untouched, so undo restores it exactly', () => {
    const before = u9(pick('p01', 1, 1));
    const copy = JSON.parse(JSON.stringify(before));
    reduce(before, fill());
    expect(before).toEqual(copy);
  });
});
