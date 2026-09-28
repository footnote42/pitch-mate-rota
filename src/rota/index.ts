// Pure rota module: every rule lives here. No React, no storage.
// The UI talks to it only through reduce and assess; saving lives in ./storage.
import { AgeGroup, AGE_GROUP_CONFIGS, DEFAULT_AGE_GROUP } from '@/types/ageGroup';
import { ExperienceLevel, Player } from '@/types/rotation';

export const MIN_GAMES = 3;
export const MAX_GAMES = 8;
export const DEFAULT_GAMES = 5;
const QUARTERS_PER_HALF = 2;

export type Half = 1 | 2;

export interface Pick {
  playerId: string;
  game: number;
  half: Half;
}

export interface Festival {
  ageGroup: AgeGroup;
  games: number;
  labels: Record<number, string>;
  halfLength: number | null; // minutes, optional
  picks: Pick[];
}

export interface State {
  version: 1;
  squad: Player[];
  festival: Festival;
}

export type Action =
  | { type: 'addPlayer'; id: string; name: string; experienceLevel: ExperienceLevel }
  | { type: 'removePlayer'; playerId: string }
  | { type: 'renamePlayer'; playerId: string; name: string }
  | { type: 'setExperienceLevel'; playerId: string; level: ExperienceLevel }
  | { type: 'togglePick'; playerId: string; game: number; half: Half }
  | { type: 'clearHalf'; game: number; half: Half }
  | { type: 'clearGame'; game: number }
  | { type: 'setGames'; games: number }
  | { type: 'setAgeGroup'; ageGroup: AgeGroup }
  | { type: 'setLabel'; game: number; label: string }
  | { type: 'setHalfLength'; minutes: number | null }
  | { type: 'newFestival'; keepSquad: boolean };

export const newFestival = (ageGroup: AgeGroup = DEFAULT_AGE_GROUP): Festival => ({
  ageGroup,
  games: DEFAULT_GAMES,
  labels: {},
  halfLength: null,
  picks: [],
});

export const emptyState = (): State => ({ version: 1, squad: [], festival: newFestival() });

const byName = (a: Player, b: Player) => a.name.localeCompare(b.name);

const withFestival = (state: State, changes: Partial<Festival>): State => ({
  ...state,
  festival: { ...state.festival, ...changes },
});

const capacity = (state: State) => AGE_GROUP_CONFIGS[state.festival.ageGroup].playersOnField;

export function reduce(state: State, action: Action): State {
  const { festival } = state;
  switch (action.type) {
    case 'addPlayer': {
      const player: Player = { id: action.id, name: action.name.trim(), experienceLevel: action.experienceLevel };
      return { ...state, squad: [...state.squad, player].sort(byName) };
    }
    case 'removePlayer':
      return {
        ...withFestival(state, { picks: festival.picks.filter(p => p.playerId !== action.playerId) }),
        squad: state.squad.filter(p => p.id !== action.playerId),
      };
    case 'renamePlayer': {
      const name = action.name.trim();
      if (!name) return state;
      return { ...state, squad: state.squad.map(p => (p.id === action.playerId ? { ...p, name } : p)).sort(byName) };
    }
    case 'setExperienceLevel':
      return {
        ...state,
        squad: state.squad.map(p => (p.id === action.playerId ? { ...p, experienceLevel: action.level } : p)),
      };
    case 'togglePick': {
      const { playerId, game, half } = action;
      const same = (p: Pick) => p.playerId === playerId && p.game === game && p.half === half;
      if (festival.picks.some(same)) return withFestival(state, { picks: festival.picks.filter(p => !same(p)) });
      const inHalf = festival.picks.filter(p => p.game === game && p.half === half).length;
      if (inHalf >= capacity(state) || game < 1 || game > festival.games) return state; // hard block
      return withFestival(state, { picks: [...festival.picks, { playerId, game, half }] });
    }
    case 'clearHalf':
      return withFestival(state, {
        picks: festival.picks.filter(p => !(p.game === action.game && p.half === action.half)),
      });
    case 'clearGame':
      return withFestival(state, { picks: festival.picks.filter(p => p.game !== action.game) });
    case 'setGames': {
      if (action.games < MIN_GAMES || action.games > MAX_GAMES) return state;
      return withFestival(state, { games: action.games, picks: festival.picks.filter(p => p.game <= action.games) });
    }
    case 'setAgeGroup':
      if (action.ageGroup === festival.ageGroup) return state;
      return withFestival(state, { ageGroup: action.ageGroup, picks: [] });
    case 'setLabel':
      return withFestival(state, { labels: { ...festival.labels, [action.game]: action.label } });
    case 'setHalfLength':
      return withFestival(state, { halfLength: action.minutes && action.minutes > 0 ? action.minutes : null });
    case 'newFestival':
      return action.keepSquad
        ? { ...state, festival: newFestival(festival.ageGroup) }
        : emptyState();
  }
}

// ---- assess ----

export type PlayerStatus = 'ok' | 'below' | 'impossible' | 'exempt';

export interface PlayerAssessment {
  id: string;
  displayName: string;
  planned: number; // quarters
  plannedMinutes: number | null;
  minimum: number; // quarters
  status: PlayerStatus;
}

export interface Balance {
  total: number;
  target: number;
  balanced: boolean;
}

export interface HalfAssessment {
  game: number;
  half: Half;
  count: number;
  capacity: number;
  full: boolean;
  balance: Balance;
}

export type Flag =
  | { kind: 'belowMinimum'; playerId: string; impossible: boolean }
  | { kind: 'unbalanced'; game: number; half: Half }
  | { kind: 'halfOverCap'; halfLength: number; cap: number }
  | { kind: 'dayOverCap'; totalMinutes: number; cap: number };

export interface Assessment {
  players: Record<string, PlayerAssessment>;
  halves: Record<string, HalfAssessment>; // keyed by halfKey(game, half)
  minimum: number; // quarters
  fairShare: number; // halves, rounded
  totalMinutes: number | null;
  flags: Flag[];
  complete: boolean; // every half full and balanced
}

export const halfKey = (game: number, half: Half) => `${game}-${half}`;
export const toHalves = (quarters: number) => quarters / QUARTERS_PER_HALF;

// Forename, plus surname letters only until unique among players sharing that forename.
export function displayNames(squad: Player[]): Record<string, string> {
  const split = squad.map(p => {
    const [forename = '', ...rest] = p.name.trim().split(/\s+/);
    return { id: p.id, full: p.name.trim(), forename, surname: rest.join(' ') };
  });
  const names: Record<string, string> = {};
  for (const p of split) {
    const others = split.filter(o => o.id !== p.id && o.forename.toLowerCase() === p.forename.toLowerCase());
    if (others.length === 0) {
      names[p.id] = p.forename;
      continue;
    }
    names[p.id] = p.full;
    for (let k = 1; k <= p.surname.length; k++) {
      const prefix = p.surname.slice(0, k).toLowerCase();
      if (!others.some(o => o.surname.toLowerCase().startsWith(prefix))) {
        names[p.id] = `${p.forename} ${p.surname.slice(0, k)}`;
        break;
      }
    }
  }
  return names;
}

export function assess(state: State): Assessment {
  const { squad, festival } = state;
  const config = AGE_GROUP_CONFIGS[festival.ageGroup];
  const cap = config.playersOnField;
  const level = new Map(squad.map(p => [p.id, p.experienceLevel]));
  const picks = festival.picks.filter(p => level.has(p.playerId));
  const flags: Flag[] = [];

  const halves: Record<string, HalfAssessment> = {};
  for (let game = 1; game <= festival.games; game++) {
    for (const half of [1, 2] as Half[]) {
      const inHalf = picks.filter(p => p.game === game && p.half === half);
      const total = inHalf.reduce((sum, p) => sum + level.get(p.playerId), 0);
      // Soft indicator: 2 points per player is the ideal mix, +/- 0.5 per player.
      const balanced = inHalf.length === 0 || (total >= cap * 1.5 && total <= cap * 2.5);
      halves[halfKey(game, half)] = {
        game,
        half,
        count: inHalf.length,
        capacity: cap,
        full: inHalf.length >= cap,
        balance: { total, target: cap * 2, balanced },
      };
      if (!balanced) flags.push({ kind: 'unbalanced', game, half });
    }
  }

  // Half Game Rule: at least half the Available Playing Time (every game on the day).
  const minimum = (festival.games * 2 * QUARTERS_PER_HALF) / 2;
  const minutesPerQuarter = festival.halfLength ? festival.halfLength / QUARTERS_PER_HALF : null;
  const names = displayNames(squad);

  const players: Record<string, PlayerAssessment> = {};
  for (const p of squad) {
    const mine = picks.filter(k => k.playerId === p.id);
    const planned = mine.length * QUARTERS_PER_HALF;
    const openElsewhere = Object.values(halves).filter(
      h => !h.full && !mine.some(k => k.game === h.game && k.half === h.half),
    ).length;
    const reachable = planned + openElsewhere * QUARTERS_PER_HALF;
    const status: PlayerStatus = planned >= minimum ? 'ok' : reachable < minimum ? 'impossible' : 'below';
    players[p.id] = {
      id: p.id,
      displayName: names[p.id],
      planned,
      plannedMinutes: minutesPerQuarter === null ? null : planned * minutesPerQuarter,
      minimum,
      status,
    };
    if (status === 'below' || status === 'impossible') {
      flags.push({ kind: 'belowMinimum', playerId: p.id, impossible: status === 'impossible' });
    }
  }

  const totalMinutes = festival.halfLength ? festival.games * 2 * festival.halfLength : null;
  if (festival.halfLength && festival.halfLength > config.halfCapMinutes) {
    flags.push({ kind: 'halfOverCap', halfLength: festival.halfLength, cap: config.halfCapMinutes });
  }
  if (totalMinutes !== null && totalMinutes > config.dayCapMinutes) {
    flags.push({ kind: 'dayOverCap', totalMinutes, cap: config.dayCapMinutes });
  }

  const allHalves = Object.values(halves);
  return {
    players,
    halves,
    minimum,
    fairShare: squad.length === 0 ? 0 : Math.round((festival.games * 2 * cap) / squad.length),
    totalMinutes,
    flags,
    complete: squad.length > 0 && allHalves.every(h => h.full && h.balance.balanced),
  };
}
