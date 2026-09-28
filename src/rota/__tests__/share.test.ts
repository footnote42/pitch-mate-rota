import { describe, it, expect } from 'vitest';
import { Action, emptyState, reduce, State } from '../index';
import { planMessage } from '../share';

const run = (...actions: Action[]): State => actions.reduce(reduce, emptyState());
const add = (id: string, name = id): Action => ({ type: 'addPlayer', id, name, experienceLevel: 2 });
const pick = (playerId: string, game: number, half: 1 | 2): Action => ({ type: 'togglePick', playerId, game, half });

// U7 (4 a side), 3 games: minimum 3 halves each.
const setup: Action[] = [{ type: 'setAgeGroup', ageGroup: 'U7' }, { type: 'setGames', games: 3 }];
const squad = [add('a', 'Alfie Hill'), add('b', 'Ava Jones'), add('c', 'Ben Cole'), add('d', 'Sam Brown'), add('e', 'Sam Smith')];
const every = (ids: string[]) => [1, 2, 3].flatMap(g => [1, 2].flatMap(h => ids.map(id => pick(id, g, h as 1 | 2))));

describe('plan message', () => {
  it('full plan meeting every minimum', () => {
    const s = run(...setup, add('a', 'Alfie Hill'), add('b', 'Ava Jones'), add('c', 'Ben Cole'), add('d', 'Sam Brown'),
      { type: 'setLabel', game: 1, label: 'Tigers 10:00' }, ...every(['a', 'b', 'c', 'd']));
    expect(planMessage(s)).toBe(
      [
        '*U7 festival plan*',
        '',
        '*Tigers 10:00*',
        '1st: Alfie, Ava, Ben, Sam',
        '2nd: Alfie, Ava, Ben, Sam',
        '',
        '*Game 2*',
        '1st: Alfie, Ava, Ben, Sam',
        '2nd: Alfie, Ava, Ben, Sam',
        '',
        '*Game 3*',
        '1st: Alfie, Ava, Ben, Sam',
        '2nd: Alfie, Ava, Ben, Sam',
        '',
        'Everyone plays at least 3 halves.',
        'Plan may change',
      ].join('\n'),
    );
  });

  it('gaps show TBC; blank labels fall back to Game n', () => {
    const s = run(...setup, ...squad, { type: 'setLabel', game: 2, label: '  ' }, pick('d', 1, 1), pick('e', 1, 1));
    const lines = planMessage(s).split('\n');
    expect(lines.slice(2, 5)).toEqual(['*Game 1*', '1st: Sam B, Sam S + 2 TBC', '2nd: TBC']);
    expect(lines[6]).toBe('*Game 2*');
  });

  it('no footer promise when a minimum is not met', () => {
    const s = run(...setup, ...squad, ...every(['a', 'b', 'c', 'd']));
    const msg = planMessage(s);
    expect(msg).not.toContain('Everyone plays');
    expect(msg.endsWith('\n\nPlan may change')).toBe(true);
  });
});
