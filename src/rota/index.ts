// Pure rota module: every rule lives here. No React, no storage.
// The UI talks to it through reduce and assess (plus the helpers in ./model); saving lives in ./storage.
import { AgeGroup, AGE_GROUP_CONFIGS } from '@/types/ageGroup';
import { ExperienceLevel, Player } from '@/types/rotation';
import { autoFill } from './autofill';
import { nameKey, tidyName } from './squad';
import {
  Availability, availabilityOf, balanceTarget, canPick, canPlayHalf, canPlayQuarter, canTick, emptyState, Festival,
  gameNumbers, gameRecord, GameRecord, Half, halfKey, halfOf, HALVES, isRecorded, MAX_GAMES, MAX_RUN, MIN_GAMES,
  minimumQuarters, newFestival, Pick, Played, Quarter, QUARTERS, QUARTERS_PER_HALF, RemovalReason, sideSize, State,
} from './model';

export * from './model';
export { parseSquad, matchSquad } from './squad';

export type Action =
  | { type: 'addPlayer'; id: string; name: string; experienceLevel: ExperienceLevel }
  | { type: 'addPlayers'; players: { id: string; name: string }[] } // squad import: new names only, at Intermediate
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
  | { type: 'autoFill'; seed: number } // seed from the caller, like ids; Shuffle is Undo then a new seed
  | { type: 'toggleQuarter'; playerId: string; game: number; quarter: Quarter }
  | { type: 'setPlayed'; game: number; played: boolean }
  | { type: 'removeForDay'; playerId: string; reason: RemovalReason; game: number; quarter: Quarter }
  | { type: 'cancelRemoval'; playerId: string } // lifts the waiver; cleared picks and quarters stay cleared
  | { type: 'newFestival'; keepSquad: boolean };

const byName = (a: Player, b: Player) => a.name.localeCompare(b.name);

const withFestival = (state: State, changes: Partial<Festival>): State => ({
  ...state,
  festival: { ...state.festival, ...changes },
});

const withRecord = (state: State, game: number, quarters: Played[], played = isRecorded(state.festival, game)): State =>
  withFestival(state, { records: { ...state.festival.records, [game]: { played, quarters } } });

const byKey = <T,>(obj: Record<string | number, T>, keep: (key: string, value: T) => boolean) =>
  Object.fromEntries(Object.entries(obj).filter(([k, v]) => keep(k, v))) as Record<string, T>;

// Full-day entries are dropped, so availability only lists players who are not there all day.
const withAvailability = (festival: Festival, playerId: string, a: Availability | null): Festival => {
  const { [playerId]: _, ...rest } = festival.availability;
  const availability = !a || (a.arrives <= 1 && a.leaves >= festival.games) ? rest : { ...rest, [playerId]: a };
  const next = { ...festival, availability };
  return { ...next, picks: next.picks.filter(p => canPlayHalf(next, p.playerId, p.game, p.half)) };
};

// Everything the festival holds about one player, gone.
const withoutPlayer = (festival: Festival, playerId: string): Festival => ({
  ...festival,
  picks: festival.picks.filter(p => p.playerId !== playerId),
  availability: byKey(festival.availability, id => id !== playerId),
  records: Object.fromEntries(
    Object.entries(festival.records).map(([g, r]) => [g, { ...r, quarters: r.quarters.filter(q => q.playerId !== playerId) }]),
  ),
  removals: byKey(festival.removals, id => id !== playerId),
});

export function reduce(state: State, action: Action): State {
  const { festival } = state;
  switch (action.type) {
    case 'addPlayer': {
      const player: Player = { id: action.id, name: tidyName(action.name), experienceLevel: action.experienceLevel };
      return { ...state, squad: [...state.squad, player].sort(byName) };
    }
    case 'addPlayers': {
      const have = new Set(state.squad.map(p => nameKey(p.name)));
      const fresh: Player[] = [];
      for (const { id, name } of action.players) {
        const key = nameKey(name);
        if (!key || have.has(key)) continue;
        have.add(key);
        fresh.push({ id, name: tidyName(name), experienceLevel: 2 });
      }
      return fresh.length === 0 ? state : { ...state, squad: [...state.squad, ...fresh].sort(byName) };
    }
    case 'removePlayer':
      return { ...state, squad: state.squad.filter(p => p.id !== action.playerId), festival: withoutPlayer(festival, action.playerId) };
    case 'renamePlayer': {
      const name = tidyName(action.name);
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
      if (!canPick(state, playerId, game, half)) return state; // hard block
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
      if (game < 1 || game > festival.games) return state;
      const quarters = gameRecord(festival, game);
      const same = (q: Played) => q.playerId === playerId && q.quarter === quarter;
      if (quarters.some(same)) return withRecord(state, game, quarters.filter(q => !same(q)));
      if (!canTick(state, playerId, game, quarter)) return state; // hard block
      return withRecord(state, game, [...quarters, { playerId, quarter }]);
    }
    case 'setPlayed': {
      if (action.game < 1 || action.game > festival.games) return state;
      return withRecord(state, action.game, gameRecord(festival, action.game), action.played);
    }
    case 'removeForDay': {
      const { playerId, reason, game, quarter } = action;
      if (game < 1 || game > festival.games || !QUARTERS.includes(quarter) || !state.squad.some(p => p.id === playerId)) return state;
      const after: Festival = { ...festival, removals: { ...festival.removals, [playerId]: { reason, game, quarter } } };
      const records: Record<number, GameRecord> = {};
      for (const g of gameNumbers(festival)) {
        if (g !== game && !festival.records[g]) continue;
        const quarters = gameRecord(festival, g).filter(q => q.playerId !== playerId || canPlayQuarter(after, playerId, g, q.quarter));
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

// ok: minimum met. below: still reachable with room to spare. tight: exactly enough open places left.
// impossible: can no longer reach the minimum (shown as Short). exempt: out for the day.
export type PlayerStatus = 'ok' | 'below' | 'tight' | 'impossible' | 'exempt';

export interface PlayerAssessment {
  id: string;
  displayName: string;
  counted: number; // quarters: the record for recorded games, the plan for the rest
  countedMinutes: number | null;
  minimum: number; // quarters
  status: PlayerStatus;
  longestRun: number; // most consecutive halves played or planned, across games
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
  shortOfPlayers: boolean; // not enough players who can play it are left to fill it
  balance: Balance;
}

export type Flag =
  | { kind: 'belowMinimum'; playerId: string; impossible: boolean }
  | { kind: 'unbalanced'; game: number; half: Half }
  | { kind: 'shortOfPlayers'; game: number; half: Half }
  | { kind: 'consecutive'; playerId: string; run: number }
  | { kind: 'halfOverCap'; halfLength: number; cap: number }
  | { kind: 'dayOverCap'; totalMinutes: number; cap: number };

export interface Assessment {
  players: Record<string, PlayerAssessment>;
  halves: Record<string, HalfAssessment>; // keyed by halfKey(game, half)
  record: Record<number, Played[]>; // each game's match record (the plan in quarters until touched)
  quarterCounts: Record<number, Record<Quarter, number>>; // players recorded per quarter, by game
  capacity: number; // side size: players per half and per quarter
  minimum: number; // quarters
  minimumMinutes: number | null;
  fairShare: number; // halves, rounded
  totalMinutes: number | null;
  openPlaces: number; // empty places in games not yet recorded
  watching: number; // players Tight or Short: the Half Game Rule line
  toWatch: number; // flags worth a look: Short, balance, Short of players, runs
  flags: Flag[];
  complete: boolean; // every half full and balanced
}

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
  const cap = sideSize(festival);
  const games = gameNumbers(festival);
  const level = new Map(squad.map(p => [p.id, p.experienceLevel]));
  const picks = festival.picks.filter(p => level.has(p.playerId));
  const flags: Flag[] = [];

  const record: Record<number, Played[]> = {};
  const quarterCounts: Record<number, Record<Quarter, number>> = {};
  for (const game of games) {
    record[game] = gameRecord(festival, game).filter(q => level.has(q.playerId));
    quarterCounts[game] = Object.fromEntries(QUARTERS.map(q => [q, record[game].filter(r => r.quarter === q).length])) as Record<Quarter, number>;
  }

  const halves: Record<string, HalfAssessment> = {};
  const target = balanceTarget(state);
  for (const game of games) {
    for (const half of HALVES) {
      const inHalf = picks.filter(p => p.game === game && p.half === half);
      const total = inHalf.reduce((sum, p) => sum + level.get(p.playerId), 0);
      const recorded = isRecorded(festival, game);
      // Soft indicator: a half as strong as the squad on average, +/- 0.5 per player.
      const full = inHalf.length >= cap;
      const verdict = !full ? null : total < target - cap / 2 ? 'light' : total > target + cap / 2 ? 'heavy' : 'ok';
      const balanced = verdict !== 'light' && verdict !== 'heavy';
      const mix = { 1: 0, 2: 0, 3: 0 } as Record<ExperienceLevel, number>;
      inHalf.forEach(p => mix[level.get(p.playerId)]++);
      const couldJoin = squad.filter(p => !inHalf.some(k => k.playerId === p.id) && canPlayHalf(festival, p.id, game, half)).length;
      const shortOfPlayers = !recorded && inHalf.length + couldJoin < cap;
      halves[halfKey(game, half)] = {
        game, half, count: inHalf.length, capacity: cap, full, recorded, shortOfPlayers,
        balance: { total, target, balanced, verdict, mix },
      };
      // A recorded game is history: its plan isn't judged.
      if (!balanced && !recorded) flags.push({ kind: 'unbalanced', game, half });
      if (shortOfPlayers) flags.push({ kind: 'shortOfPlayers', game, half });
    }
  }

  const minimum = minimumQuarters(festival);
  const minutesPerQuarter = festival.halfLength ? festival.halfLength / QUARTERS_PER_HALF : null;
  const names = displayNames(squad);

  const players: Record<string, PlayerAssessment> = {};
  for (const p of squad) {
    const mine = picks.filter(k => k.playerId === p.id);
    // Recorded games count from the match record; the rest from the plan.
    const playedHalf = (game: number, half: Half) =>
      isRecorded(festival, game)
        ? record[game].some(q => q.playerId === p.id && halfOf(q.quarter) === half)
        : mine.some(k => k.game === game && k.half === half);
    const counted = games.reduce(
      (sum, game) =>
        sum + (isRecorded(festival, game)
          ? record[game].filter(q => q.playerId === p.id).length
          : mine.filter(k => k.game === game).length * QUARTERS_PER_HALF),
      0,
    );
    const openElsewhere = Object.values(halves).filter(
      h => !h.full && !h.recorded && canPlayHalf(festival, p.id, h.game, h.half) && !playedHalf(h.game, h.half),
    ).length;
    const reachable = counted + openElsewhere * QUARTERS_PER_HALF;
    const status: PlayerStatus = festival.removals[p.id]
      ? 'exempt'
      : counted >= minimum ? 'ok' : reachable < minimum ? 'impossible' : reachable === minimum ? 'tight' : 'below';
    let run = 0;
    let longestRun = 0;
    for (const game of games) {
      for (const half of HALVES) {
        run = playedHalf(game, half) ? run + 1 : 0; // any quarter of a half counts as playing it
        longestRun = Math.max(longestRun, run);
      }
    }
    players[p.id] = {
      id: p.id,
      displayName: names[p.id],
      counted,
      countedMinutes: minutesPerQuarter === null ? null : counted * minutesPerQuarter,
      minimum,
      status,
      longestRun,
      ...availabilityOf(festival, p.id),
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
  const statuses = Object.values(players).map(p => p.status);
  return {
    players,
    halves,
    record,
    quarterCounts,
    capacity: cap,
    minimum,
    minimumMinutes: minutesPerQuarter === null ? null : minimum * minutesPerQuarter,
    fairShare: squad.length === 0 ? 0 : Math.round((festival.games * 2 * cap) / squad.length),
    totalMinutes,
    openPlaces: allHalves.filter(h => !h.recorded).reduce((n, h) => n + h.capacity - h.count, 0),
    watching: statuses.filter(s => s === 'tight' || s === 'impossible').length,
    toWatch: flags.filter(
      f => (f.kind === 'belowMinimum' && f.impossible) || f.kind === 'unbalanced' || f.kind === 'shortOfPlayers' || f.kind === 'consecutive',
    ).length,
    flags,
    complete: squad.length > 0 && allHalves.every(h => h.full && h.balance.balanced),
  };
}
