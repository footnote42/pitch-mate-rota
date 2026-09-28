// Saved-state format, validation and migration. Pure: the caller does the reading and writing.
import { AgeGroup, AGE_GROUP_CONFIGS, DEFAULT_AGE_GROUP } from '@/types/ageGroup';
import { ExperienceLevel, Player } from '@/types/rotation';
import { emptyState, Festival, Half, MAX_GAMES, MIN_GAMES, DEFAULT_GAMES, Pick, State } from './index';

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
  };
  return { version: 1, squad, festival };
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
      ageGroup: toAgeGroup(ageGroup),
      games,
      labels: toLabels(data.gameLabels),
      halfLength: null,
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
