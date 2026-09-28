import { describe, it, expect } from 'vitest';
import { Action, assess, emptyState, matchSquad, parseSquad, reduce, State } from '../index';

const run = (...actions: Action[]): State => actions.reduce(reduce, emptyState());

// Anonymised: the shape of a real selection message (made-up names; the repo is public).
const MESSAGE = [
  '🏉 U9 squad for Sunday 🏉',
  '',
  'Alfie   Hill',
  'Ava Jones-Pike',
  '  Ben  Cole ',
  '',
  '4. Sam Brown',
  '5) Sam Bell',
  '- Zoe  Park-Lee 👍',
  'Mia Grant',
  'mia grant',
  'Meet 9:15 at the club, kit on please',
].join('\n');

describe('squad import', () => {
  it('reads one name per line, tidying spaces, numbering, bullets, emoji and header lines', () => {
    expect(parseSquad(MESSAGE)).toEqual([
      'Alfie Hill',
      'Ava Jones-Pike',
      'Ben Cole',
      'Sam Brown',
      'Sam Bell',
      'Zoe Park-Lee',
      'Mia Grant',
    ]);
  });

  it('keeps names that look like words', () => {
    expect(parseSquad(['Kit Moss', 'Faith Hope', 'Squad for Saturday'].join('\n'))).toEqual(['Kit Moss', 'Faith Hope']);
  });

  it('display names: forename, plus surname letters until unique; a hyphenated surname starts with its first letter', () => {
    const names = parseSquad(MESSAGE);
    const s = run({ type: 'addPlayers', players: names.map((name, i) => ({ id: `p${i}`, name })) });
    const display = Object.values(assess(s).players).map(p => p.displayName).sort();
    expect(display).toEqual(['Alfie', 'Ava', 'Ben', 'Mia', 'Sam Be', 'Sam Br', 'Zoe']);
  });

  it('matches names already in the squad, ignoring case and spacing', () => {
    const s = run({ type: 'addPlayer', id: 'x', name: 'Ben Cole', experienceLevel: 3 });
    expect(matchSquad(s.squad, ['ben  cole', 'Alfie Hill'])).toEqual({ fresh: ['Alfie Hill'], existing: ['ben  cole'] });
  });

  it('merging adds only new players, at Intermediate, and keeps existing ones as they are', () => {
    const s = run(
      { type: 'addPlayer', id: 'x', name: 'Ben Cole', experienceLevel: 3 },
      { type: 'addPlayers', players: [{ id: 'a', name: 'Alfie Hill' }, { id: 'b', name: 'ben cole' }] },
    );
    expect(s.squad).toEqual([
      { id: 'a', name: 'Alfie Hill', experienceLevel: 2 },
      { id: 'x', name: 'Ben Cole', experienceLevel: 3 },
    ]);
  });
});
