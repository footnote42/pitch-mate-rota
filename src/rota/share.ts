// The plan as a WhatsApp message for the parents' group. Display names only; the coach pastes it.
import { assess } from './index';
import { gameNumbers, halfKey, HALVES, State, toHalves } from './model';

export function planMessage(state: State): string {
  const { squad, festival } = state;
  const a = assess(state);
  const games = gameNumbers(festival).map(game => {
    const halves = HALVES.map(half => {
      const ids = new Set(festival.picks.filter(p => p.game === game && p.half === half).map(p => p.playerId));
      const names = squad.filter(p => ids.has(p.id)).map(p => a.players[p.id].displayName);
      const open = a.halves[halfKey(game, half)].capacity - names.length;
      const line = names.length === 0 ? 'TBC' : open > 0 ? `${names.join(', ')} + ${open} TBC` : names.join(', ');
      return `${half === 1 ? '1st' : '2nd'}: ${line}`;
    });
    return [`*${festival.labels[game]?.trim() || `Game ${game}`}*`, ...halves].join('\n');
  });
  const allMet = squad.length > 0 && Object.values(a.players).every(p => p.status === 'ok' || p.status === 'exempt');
  const footer = [allMet && `Everyone plays at least ${toHalves(a.minimum)} halves.`, 'Plan may change'].filter(Boolean);
  return [`*${festival.ageGroup} festival plan*`, ...games, footer.join('\n')].join('\n\n');
}
