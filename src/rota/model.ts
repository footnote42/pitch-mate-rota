// The rota's data and the small rules every part of the module shares. No React, no storage.
import { AgeGroup, AGE_GROUP_CONFIGS, DEFAULT_AGE_GROUP } from '@/types/ageGroup';
import { Player } from '@/types/rotation';

export const MIN_GAMES = 3;
export const MAX_GAMES = 8;
export const DEFAULT_GAMES = 5;
export const MAX_RUN = 3; // more consecutive halves than this is flagged
export const QUARTERS_PER_HALF = 2;

export type Half = 1 | 2;
export type Quarter = 1 | 2 | 3 | 4;
export const HALVES: Half[] = [1, 2];
export const QUARTERS: Quarter[] = [1, 2, 3, 4];

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

// Permanent removal ('Out for the day'): the Half Game Rule is waived for this player (Reg 15.13(5)).
export const REMOVAL_REASONS = ['injury', 'risk', 'redCard'] as const;
export type RemovalReason = (typeof REMOVAL_REASONS)[number];
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

export const gameNumbers = (festival: Festival) => Array.from({ length: festival.games }, (_, i) => i + 1);
export const halfKey = (game: number, half: Half) => `${game}-${half}`;
export const halfOf = (quarter: Quarter): Half => (quarter <= 2 ? 1 : 2);
export const quartersOf = (half: Half): Quarter[] => (half === 1 ? [1, 2] : [3, 4]);
export const toHalves = (quarters: number) => quarters / QUARTERS_PER_HALF;
export const sideSize = (festival: Festival) => AGE_GROUP_CONFIGS[festival.ageGroup].playersOnField;

// Half Game Rule: at least half the Available Playing Time, which at a festival is every game on the day.
export const minimumQuarters = (festival: Festival) => (festival.games * 2 * QUARTERS_PER_HALF) / 2;

// The squad's average experience times the side size: what an even half adds up to.
export const balanceTarget = ({ squad, festival }: State) => {
  const average = squad.length === 0 ? 2 : squad.reduce((sum, p) => sum + p.experienceLevel, 0) / squad.length;
  return average * sideSize(festival);
};

export const availabilityOf = (festival: Festival, playerId: string): Availability =>
  festival.availability[playerId] ?? { arrives: 1, leaves: festival.games };

// Why a player can't play any of a game: not arrived yet, already gone, or out for the day.
export type Absence = 'notYet' | 'gone' | 'out' | null;
export const absence = (festival: Festival, playerId: string, game: number): Absence => {
  const { arrives, leaves } = availabilityOf(festival, playerId);
  const r = festival.removals[playerId];
  if (r && game > r.game) return 'out';
  return game < arrives ? 'notYet' : game > leaves ? 'gone' : null;
};

// Removed players stay for the quarter it happened in, and the half that quarter belongs to.
export const canPlayQuarter = (festival: Festival, playerId: string, game: number, quarter: Quarter) => {
  const r = festival.removals[playerId];
  const { arrives, leaves } = availabilityOf(festival, playerId);
  const present = game >= arrives && game <= leaves;
  return present && (!r || game < r.game || (game === r.game && quarter <= r.quarter));
};
export const canPlayHalf = (festival: Festival, playerId: string, game: number, half: Half) =>
  canPlayQuarter(festival, playerId, game, quartersOf(half)[0]);

export const isRecorded = (festival: Festival, game: number) => !!festival.records[game]?.played;

// A game's match record: what the coach recorded, or the plan in quarters until they touch it.
export function gameRecord(festival: Festival, game: number): Played[] {
  const record = festival.records[game];
  if (record) return record.quarters;
  return festival.picks
    .filter(p => p.game === game)
    .flatMap(p => quartersOf(p.half).map(quarter => ({ playerId: p.playerId, quarter })));
}

// Whether tapping an unpicked half or quarter would add it: the hard block at side size, and who can play.
export const canPick = ({ squad, festival }: State, playerId: string, game: number, half: Half) =>
  game >= 1 && game <= festival.games && squad.some(p => p.id === playerId) &&
  festival.picks.filter(p => p.game === game && p.half === half).length < sideSize(festival) &&
  canPlayHalf(festival, playerId, game, half);

export const canTick = ({ squad, festival }: State, playerId: string, game: number, quarter: Quarter) =>
  game >= 1 && game <= festival.games && QUARTERS.includes(quarter) && squad.some(p => p.id === playerId) &&
  gameRecord(festival, game).filter(q => q.quarter === quarter).length < sideSize(festival) &&
  canPlayQuarter(festival, playerId, game, quarter);

// Picks in `after` that weren't in `before`: what an auto-fill added.
export const addedPicks = (before: State, after: State) =>
  after.festival.picks.filter(p => !before.festival.picks.includes(p));
