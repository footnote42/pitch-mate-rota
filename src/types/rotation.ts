export type ExperienceLevel = 1 | 2 | 3;

export const EXPERIENCE_LABELS = {
  1: 'New Player',
  2: 'Getting There',
  3: 'Match Ready'
} as const;

export const EXPERIENCE_STARS = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐'
} as const;

// Legacy type for migration
export type LegacyExperienceLevel = 'experienced' | 'novice';

export interface Player {
  id: string;
  name: string;
  experienceLevel: ExperienceLevel;
}

export interface Assignment {
  playerId: string;
  game: number;
  half: number;
}

export interface RotationState {
  players: Player[];
  assignments: Assignment[];
  numberOfGames: number;
  gameLabels: Record<number, string>;
}
