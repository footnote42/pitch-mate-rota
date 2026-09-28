// Pure rota module: every rule lives here. No React, no storage.
// The UI talks to it only through reduce and assess; saving lives in ./storage.
import { AgeGroup, AGE_GROUP_CONFIGS, DEFAULT_AGE_GROUP } from '@/types/ageGroup';
import { ExperienceLevel, Player } from '@/types/rotation';
import { autoFill } from './autofill';

export const MIN_GAMES = 3;
export const MAX_GAMES = 8;
export const DEFAULT_GAMES = 5;
const QUARTERS_PER_HALF = 2;

export type Half = 1 | 2;
export type Quarter = 1 | 2 | 3 | 4;

export interface Pick {
  playerId: string;
  game: number;
  half: Half;
}

// The games a player is present for. Only players not there all day have an entry.
export interface Availability {
  arrives: number; // first game
  leaves: number; // last game
}

// Match record: quarters actually played in one game. It counts, instead of the plan, once played.
export interface Played {
  playerId: string;
  quarter: Quarter;
}
export interface GameRecord {
  played: boolean; // the coach has confirmed the game as played: a Recorded game
  quarters: Played[];
}

// Permanent removal ('Out for the day'): the Half Game Rule is waived for this player.
export type RemovalReason = 'injury' | 'risk' | 'redCard';
export interface Removal {
  reason: RemovalReason;
  game: number;
  quarter: Quarter; // the quarter it happened in, which they played part of
}

export interface Festival {
  ageGroup: AgeGroup;
  games: number;
  labels: Record<number, string>;
  halfLength: number | null; // minutes, optional
  picks: Pick[];
  availability: Record<string, Availability>; // by player id
  records: Record<number, GameRecord>; // by game; only games the coach has touched
  removals: Record<string, Removal>; // by player id
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
  | { type: 'setAvailability'; playerId: string; arrives: number; leaves: number }
  | { type: 'autoFill'; seed: number } // seed from the caller, like ids
  | { type: 'toggleQuarter'; playerId: string; game: number; quarter: Quarter }
  | { type: 'setPlayed'; game: number; played: boolean }
  | { type: 'removeForDay'; playerId: string; reason: RemovalReason; game: number; quarter: Quarter }
  | { type: 'cancelRemoval'; playerId: string }
  | { type: 'newFestival'; keepSquad: boolean };

export const newFestival = (ageGroup: AgeGroup = DEFAULT_AGE_GROUP): Festival => ({
  ageGroup,
  games: DEFAULT_GAMES,
  labels: {},
  halfLength: null,
  picks: [],
  availability: {},
  records: {},
  removals: {},
});

export const emptyState = (): State => ({ version: 1, squad: [], festival: newFestival() });

const byName = (a: Player, b: Player) => a.name.localeCompare(b.name);

const withFestival = (state: State, changes: Partial<Festival>): State => ({
  ...state,
  festival: { ...state.festival, ...changes },
});

const capacity = (state: State) => AGE_GROUP_CONFIGS[state.festival.ageGroup].playersOnField;

const presence = (festival: Festival, playerId: string): Availability =>
  festival.availability[playerId] ?? { arrives: 1, leaves: festival.games };

const isPresent = (festival: Festival, playerId: string, game: number) => {
  const { arrives, leaves } = presence(festival, playerId);
  return game >= arrives && game <= leaves;
};

export const halfOf = (quarter: Quarter): Half => (quarter <= 2 ? 1 : 2);
const QUARTERS: Quarter[] = [1, 2, 3, 4];

// Removed players stay for the quarter it happened in, and the half that quarter belongs to.
export const canPlayQuarter = (festival: Festival, playerId: string, game: number, quarter: Quarter) => {
  const r = festival.removals[playerId];
  return isPresent(festival, playerId, game) && (!r || game < r.game || (game === r.game && quarter <= r.quarter));
};
export const canPlayHalf = (festival: Festival, playerId: string, game: number, half: Half) =>
  canPlayQuarter(festival, playerId, game, half === 1 ? 1 : 3);

export const isRecorded = (festival: Festival, game: number) => !!festival.records[game]?.played;

// A game's match record: what the coach recorded, or the plan in quarters until they touch it.
export function gameRecord({ festival }: State, game: number): Played[] {
  const record = festival.records[game];
  if (record) return record.quarters;
  return festival.picks
    .filter(p => p.game === game)
    .flatMap(p => (p.half === 1 ? [1, 2] : [3, 4]).map(quarter => ({ playerId: p.playerId, quarter: quarter as Quarter })));
}

const withRecord = (state: State, game: number, quarters: Played[], played = isRecorded(state.festival, game)): State =>
  withFestival(state, { records: { ...state.festival.records, [game]: { played, quarters } } });

const byKey = <T,>(obj: Record<string | number, T>, keep: (key: string, value: T) => boolean) =>
  Object.fromEntries(Object.entries(obj).filter(([k, v]) => keep(k, v))) as Record<string, T>;

// Full-day entries are dropped, so availability only lists players who are not there all day.
const withAvailability = (festival: Festival, playerId: string, a: Availability | null): Festival => {
  const { [playerId]: _, ...rest } = festival.availability;
  const availability = !a || (a.arrives <= 1 && a.leaves >= festival.games) ? rest : { ...rest, [playerId]: a };
  const next = { ...festival, availability };
  return { ...next, picks: next.picks.filter(p => isPresent(next, p.playerId, p.game)) };
};

export function reduce(state: State, action: Action): State {
  const { festival } = state;
  switch (action.type) {
    case 'addPlayer': {
      const player: Player = { id: action.id, name: action.name.trim(), experienceLevel: action.experienceLevel };
      return { ...state, squad: [...state.squad, player].sort(byName) };
    }
    case 'removePlayer':
      return {
        ...withFestival(state, {
          picks: festival.picks.filter(p => p.playerId !== action.playerId),
          availability: withAvailability(festival, action.playerId, null).availability,
          records: Object.fromEntries(
            Object.entries(festival.records).map(([g, r]) => [g, { ...r, quarters: r.quarters.filter(q => q.playerId !== action.playerId) }]),
          ),
          removals: byKey(festival.removals, id => id !== action.playerId),
        }),
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
      if (!canPlayHalf(festival, playerId, game, half)) return state;
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
      const games = action.games;
      let next: Festival = {
        ...festival,
        games,
        picks: festival.picks.filter(p => p.game <= games),
        records: byKey(festival.records, g => Number(g) <= games),
        removals: byKey(festival.removals, (_, r) => r.game <= games),
      };
      for (const [id, a] of Object.entries(festival.availability)) {
        next = withAvailability(next, id, { arrives: Math.min(a.arrives, games), leaves: Math.min(a.leaves, games) });
      }
      return { ...state, festival: next };
    }
    case 'setAgeGroup':
      if (action.ageGroup === festival.ageGroup) return state;
      return withFestival(state, { ageGroup: action.ageGroup, picks: [], records: {} }); // new side size
    case 'setLabel':
      return withFestival(state, { labels: { ...festival.labels, [action.game]: action.label } });
    case 'setHalfLength':
      return withFestival(state, { halfLength: action.minutes && action.minutes > 0 ? action.minutes : null });
    case 'setAvailability': {
      const { playerId, arrives, leaves } = action;
      const valid = Number.isInteger(arrives) && Number.isInteger(leaves) && arrives >= 1 && arrives <= leaves && leaves <= festival.games;
      if (!valid || !state.squad.some(p => p.id === playerId)) return state;
      return { ...state, festival: withAvailability(festival, playerId, { arrives, leaves }) };
    }
    case 'autoFill':
      return autoFill(state, action.seed);
    case 'toggleQuarter': {
      const { playerId, game, quarter } = action;
      if (game < 1 || game > festival.games || !QUARTERS.includes(quarter)) return state;
      const quarters = gameRecord(state, game);
      const same = (q: Played) => q.playerId === playerId && q.quarter === quarter;
      if (quarters.some(same)) return withRecord(state, game, quarters.filter(q => !same(q)));
      if (quarters.filter(q => q.quarter === quarter).length >= capacity(state)) return state; // hard block
      if (!canPlayQuarter(festival, playerId, game, quarter) || !state.squad.some(p => p.id === playerId)) return state;
      return withRecord(state, game, [...quarters, { playerId, quarter }]);
    }
    case 'setPlayed': {
      if (action.game < 1 || action.game > festival.games) return state;
      return withRecord(state, action.game, gameRecord(state, action.game), action.played);
    }
    case 'removeForDay': {
      const { playerId, reason, game, quarter } = action;
      if (game < 1 || game > festival.games || !QUARTERS.includes(quarter) || !state.squad.some(p => p.id === playerId)) return state;
      const after: Festival = { ...festival, removals: { ...festival.removals, [playerId]: { reason, game, quarter } } };
      const records: Record<number, GameRecord> = {};
      for (let g = 1; g <= festival.games; g++) {
        if (g !== game && !festival.records[g]) continue;
        const quarters = gameRecord(state, g).filter(q => q.playerId !== playerId || canPlayQuarter(after, playerId, g, q.quarter));
        records[g] = { played: isRecorded(festival, g), quarters };
      }
      return {
        ...state,
        festival: {
          ...after,
          records,
          picks: festival.picks.filter(p => p.playerId !== playerId || canPlayHalf(after, playerId, p.game, p.half)),
        },
      };
    }
    case 'cancelRemoval':
      if (!festival.removals[action.playerId]) return state;
      return withFestival(state, { removals: byKey(festival.removals, id => id !== action.playerId) });
    case 'newFestival':
      return action.keepSquad
        ? { ...state, festival: newFestival(festival.ageGroup) }
        : emptyState();
  }
}

// ---- assess ----

// ok: minimum planned. below: still reachable with room to spare. tight: exactly enough open places left.
// impossible: can no longer reach the minimum (shown as Short).
export type PlayerStatus = 'ok' | 'below' | 'tight' | 'impossible' | 'exempt';

export const MAX_RUN = 3; // more consecutive halves than this is flagged

export interface PlayerAssessment {
  id: string;
  displayName: string;
  planned: number; // quarters
  plannedMinutes: number | null;
  minimum: number; // quarters
  status: PlayerStatus;
  longestRun: number; // most consecutive halves planned, across games
  arrives: number; // first game present
  leaves: number; // last game present
}

export interface Balance {
  total: number;
  target: number;
  balanced: boolean; // judged only once the half is full
  verdict: 'light' | 'heavy' | 'ok' | null; // null until full
  mix: Record<ExperienceLevel, number>;
}

export interface HalfAssessment {
  game: number;
  half: Half;
  count: number;
  capacity: number;
  full: boolean;
  recorded: boolean; // the game is played: the record counts, not this half of the plan
  balance: Balance;
}

export type Flag =
  | { kind: 'belowMinimum'; playerId: string; impossible: boolean }
  | { kind: 'unbalanced'; game: number; half: Half }
  | { kind: 'consecutive'; playerId: string; run: number }
  | { kind: 'halfOverCap'; halfLength: number; cap: number }
  | { kind: 'dayOverCap'; totalMinutes: number; cap: number };

export interface Assessment {
  players: Record<string, PlayerAssessment>;
  halves: Record<string, HalfAssessment>; // keyed by halfKey(game, half)
  minimum: number; // quarters
  minimumMinutes: number | null;
  fairShare: number; // halves, rounded
  totalMinutes: number | null;
  flags: Flag[];
  complete: boolean; // every half full and balanced
}

export const halfKey = (game: number, half: Half) => `${game}-${half}`;

// The squad's average experience times the side size: what an even half adds up to.
export const balanceTarget = ({ squad, festival }: State) => {
  const cap = AGE_GROUP_CONFIGS[festival.ageGroup].playersOnField;
  const average = squad.length === 0 ? 2 : squad.reduce((sum, p) => sum + p.experienceLevel, 0) / squad.length;
  return average * cap;
};
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
  const target = balanceTarget(state);
  for (let game = 1; game <= festival.games; game++) {
    for (const half of [1, 2] as Half[]) {
      const inHalf = picks.filter(p => p.game === game && p.half === half);
      const total = inHalf.reduce((sum, p) => sum + level.get(p.playerId), 0);
      // Soft indicator: a half as strong as the squad on average, +/- 0.5 per player.
      const full = inHalf.length >= cap;
      const verdict = !full ? null : total < target - cap / 2 ? 'light' : total > target + cap / 2 ? 'heavy' : 'ok';
      const balanced = verdict !== 'light' && verdict !== 'heavy';
      const mix = { 1: 0, 2: 0, 3: 0 } as Record<ExperienceLevel, number>;
      inHalf.forEach(p => mix[level.get(p.playerId)]++);
      halves[halfKey(game, half)] = {
        game,
        half,
        count: inHalf.length,
        capacity: cap,
        full,
        recorded: isRecorded(festival, game),
        balance: { total, target, balanced, verdict, mix },
      };
      if (!balanced) flags.push({ kind: 'unbalanced', game, half });
    }
  }

  // Half Game Rule: at least half the Available Playing Time (every game on the day).
  const minimum = (festival.games * 2 * QUARTERS_PER_HALF) / 2;
  const minutesPerQuarter = festival.halfLength ? festival.halfLength / QUARTERS_PER_HALF : null;
  const names = displayNames(squad);

  const players: Record<string, PlayerAssessment> = {};
  // Recorded games count from the match record; the rest from the plan.
  const records = new Map<number, Played[]>();
  for (let game = 1; game <= festival.games; game++) {
    if (isRecorded(festival, game)) records.set(game, gameRecord(state, game));
  }
  for (const p of squad) {
    const mine = picks.filter(k => k.playerId === p.id);
    const playedHalf = (game: number, half: Half) =>
      records.has(game)
        ? records.get(game).some(q => q.playerId === p.id && halfOf(q.quarter) === half)
        : mine.some(k => k.game === game && k.half === half);
    let planned = 0;
    for (let game = 1; game <= festival.games; game++) {
      planned += records.has(game)
        ? records.get(game).filter(q => q.playerId === p.id).length
        : mine.filter(k => k.game === game).length * QUARTERS_PER_HALF;
    }
    const openElsewhere = Object.values(halves).filter(
      h => !h.full && !h.recorded && canPlayHalf(festival, p.id, h.game, h.half) && !playedHalf(h.game, h.half),
    ).length;
    const reachable = planned + openElsewhere * QUARTERS_PER_HALF;
    const status: PlayerStatus = festival.removals[p.id]
      ? 'exempt'
      : planned >= minimum ? 'ok' : reachable < minimum ? 'impossible' : reachable === minimum ? 'tight' : 'below';
    let run = 0;
    let longestRun = 0;
    for (let game = 1; game <= festival.games; game++) {
      for (const half of [1, 2] as Half[]) {
        run = playedHalf(game, half) ? run + 1 : 0; // any quarter of a half counts as playing it
        longestRun = Math.max(longestRun, run);
      }
    }
    players[p.id] = {
      id: p.id,
      displayName: names[p.id],
      planned,
      plannedMinutes: minutesPerQuarter === null ? null : planned * minutesPerQuarter,
      minimum,
      status,
      longestRun,
      ...presence(festival, p.id),
    };
    if (status === 'below' || status === 'tight' || status === 'impossible') {
      flags.push({ kind: 'belowMinimum', playerId: p.id, impossible: status === 'impossible' });
    }
    if (longestRun > MAX_RUN) flags.push({ kind: 'consecutive', playerId: p.id, run: longestRun });
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
    minimumMinutes: minutesPerQuarter === null ? null : minimum * minutesPerQuarter,
    fairShare: squad.length === 0 ? 0 : Math.round((festival.games * 2 * cap) / squad.length),
    totalMinutes,
    flags,
    complete: squad.length > 0 && allHalves.every(h => h.full && h.balance.balanced),
  };
}
