// Saved-state format, validation and migration. Pure: the caller does the reading and writing.
import { AgeGroup, AGE_GROUP_CONFIGS, DEFAULT_AGE_GROUP } from '@/types/ageGroup';
import { ExperienceLevel, Player } from '@/types/rotation';
import {
  Availability, canPlayHalf, emptyState, Festival, GameRecord, Half, MAX_GAMES, MIN_GAMES, DEFAULT_GAMES, newFestival, Pick, Played,
  Quarter, QUARTERS, Removal, REMOVAL_REASONS, State,
} from './model';

export const STORAGE_KEY = 'pitch-mate-rota';
export const BACKUP_KEY = 'pitch-mate-rota-backup';
const LEGACY_STATE_KEY = 'squad-rotation-state';
const LEGACY_AGE_GROUP_KEY = 'squad-rotation-age-group';
export const LEGACY_KEYS = [LEGACY_STATE_KEY, LEGACY_AGE_GROUP_KEY];

export const serialize = (state: State): string => JSON.stringify(state);

export interface Loaded {
  state: State;
  backup: string | null; // unreadable saved data, to keep under BACKUP_KEY; the coach is told
}

class Unreadable extends Error {}

function fail(why: string): never {
  throw new Unreadable(why);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untrusted saved JSON, checked field by field
const isObject = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);

const toLevel = (v: unknown): ExperienceLevel => {
  if (v === 1 || v === 2 || v === 3) return v;
  if (v === 'experienced') return 3; // pre-numeric levels
  if (v === 'novice') return 1;
  return 2;
};

const toSquad = (v: unknown): Player[] => {
  if (!Array.isArray(v)) fail('squad is not a list');
  return (v as unknown[]).map(p => {
    if (!isObject(p) || typeof p.id !== 'string' || typeof p.name !== 'string') fail('bad player');
    return { id: p.id, name: p.name, experienceLevel: toLevel(p.experienceLevel) };
  });
};

const toAgeGroup = (v: unknown): AgeGroup =>
  typeof v === 'string' && v in AGE_GROUP_CONFIGS ? (v as AgeGroup) : DEFAULT_AGE_GROUP;

const toGames = (v: unknown): number =>
  Number.isInteger(v) && (v as number) >= MIN_GAMES && (v as number) <= MAX_GAMES ? (v as number) : DEFAULT_GAMES;

const toLabels = (v: unknown): Record<number, string> => {
  if (!isObject(v)) return {};
  return Object.fromEntries(Object.entries(v).filter(([, label]) => typeof label === 'string'));
};

// Keeps entries for known players with a sensible range; anything else means there all day.
const toAvailability = (v: unknown, squad: Player[], games: number): Record<string, Availability> => {
  if (!isObject(v)) return {};
  const ids = new Set(squad.map(p => p.id));
  return Object.fromEntries(
    Object.entries(v).filter(
      ([id, a]) =>
        ids.has(id) && isObject(a) && Number.isInteger(a.arrives) && Number.isInteger(a.leaves) &&
        a.arrives >= 1 && a.arrives <= a.leaves && a.leaves <= games,
    ).map(([id, a]) => [id, { arrives: a.arrives, leaves: a.leaves }]),
  );
};

const isQuarter = (v: unknown): v is Quarter => QUARTERS.includes(v as Quarter);

// Keeps records of real games, dropping quarters for unknown players or repeats.
const toRecords = (v: unknown, squad: Player[], games: number): Record<number, GameRecord> => {
  if (!isObject(v)) return {};
  const ids = new Set(squad.map(p => p.id));
  const records: Record<number, GameRecord> = {};
  for (const [key, r] of Object.entries(v)) {
    const game = Number(key);
    if (!Number.isInteger(game) || game < 1 || game > games || !isObject(r) || !Array.isArray(r.quarters)) continue;
    const seen = new Set<string>();
    const quarters: Played[] = [];
    for (const q of r.quarters as unknown[]) {
      if (!isObject(q) || !ids.has(q.playerId) || !isQuarter(q.quarter) || seen.has(`${q.playerId}|${q.quarter}`)) continue;
      seen.add(`${q.playerId}|${q.quarter}`);
      quarters.push({ playerId: q.playerId, quarter: q.quarter });
    }
    records[game] = { played: r.played === true, quarters };
  }
  return records;
};

const toRemovals = (v: unknown, squad: Player[], games: number): Record<string, Removal> => {
  if (!isObject(v)) return {};
  const ids = new Set(squad.map(p => p.id));
  return Object.fromEntries(
    Object.entries(v)
      .filter(([id, r]) => ids.has(id) && isObject(r) && REMOVAL_REASONS.includes(r.reason) && Number.isInteger(r.game) && r.game >= 1 && r.game <= games && isQuarter(r.quarter))
      .map(([id, r]) => [id, { reason: r.reason, game: r.game, quarter: r.quarter }]),
  );
};

// Drops picks that point at missing players, games or halves, or repeat.
const toPicks = (v: unknown, squad: Player[], games: number): Pick[] => {
  if (v === undefined) return [];
  if (!Array.isArray(v)) fail('picks is not a list');
  const ids = new Set(squad.map(p => p.id));
  const seen = new Set<string>();
  const picks: Pick[] = [];
  for (const p of v as unknown[]) {
    if (!isObject(p) || !ids.has(p.playerId) || !Number.isInteger(p.game)) continue;
    if (p.game < 1 || p.game > games || (p.half !== 1 && p.half !== 2)) continue;
    const key = `${p.playerId}|${p.game}|${p.half}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push({ playerId: p.playerId, game: p.game, half: p.half as Half });
  }
  return picks;
};

function fromCurrent(data: unknown): State {
  if (!isObject(data) || data.version !== 1 || !isObject(data.festival)) fail('not a version 1 save');
  const f = data.festival;
  const squad = toSquad(data.squad);
  const games = toGames(f.games);
  const halfLength = typeof f.halfLength === 'number' && f.halfLength > 0 ? f.halfLength : null;
  const festival: Festival = {
    ageGroup: toAgeGroup(f.ageGroup),
    games,
    labels: toLabels(f.labels),
    halfLength,
    picks: toPicks(f.picks, squad, games),
    availability: toAvailability(f.availability, squad, games),
    records: toRecords(f.records, squad, games),
    removals: toRemovals(f.removals, squad, games),
  };
  const picks = festival.picks.filter(p => canPlayHalf(festival, p.playerId, p.game, p.half));
  return { version: 1, squad, festival: { ...festival, picks } };
}

// Old app: { players, assignments, numberOfGames, gameLabels } plus a separate age group key.
function fromLegacy(data: unknown, ageGroup: string | null): State {
  if (!isObject(data)) fail('legacy save is not an object');
  const squad = toSquad(data.players ?? []);
  const games = toGames(data.numberOfGames);
  return {
    version: 1,
    squad,
    festival: {
      ...newFestival(toAgeGroup(ageGroup)),
      games,
      labels: toLabels(data.gameLabels),
      picks: toPicks(data.assignments, squad, games),
    },
  };
}

export function deserialize(read: (key: string) => string | null): Loaded {
  const current = read(STORAGE_KEY);
  const legacy = read(LEGACY_STATE_KEY);
  const raw = current ?? legacy;
  try {
    if (current !== null) return { state: fromCurrent(JSON.parse(current)), backup: null };
    if (legacy !== null) return { state: fromLegacy(JSON.parse(legacy), read(LEGACY_AGE_GROUP_KEY)), backup: null };
    const ageGroup = read(LEGACY_AGE_GROUP_KEY);
    const state = emptyState();
    return { state: ageGroup ? { ...state, festival: { ...state.festival, ageGroup: toAgeGroup(ageGroup) } } : state, backup: null };
  } catch (e) {
    if (e instanceof Unreadable || e instanceof SyntaxError) return { state: emptyState(), backup: raw };
    throw e;
  }
}
