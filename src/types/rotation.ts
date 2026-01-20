export type ExperienceLevel = 1 | 2 | 3;

export const EXPERIENCE_LABELS = {
  1: 'Novice',
  2: 'Intermediate',
  3: 'Experienced'
} as const;

export const EXPERIENCE_ABBREVIATIONS = {
  1: 'Nov',
  2: 'Int',
  3: 'Exp'
} as const;

export const EXPERIENCE_FULL_LABELS = {
  1: 'Novice (Nov)',
  2: 'Intermediate (Int)',
  3: 'Experienced (Exp)'
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
