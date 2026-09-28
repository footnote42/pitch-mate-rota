export type ExperienceLevel = 1 | 2 | 3;

export const EXPERIENCE_LABELS = {
  1: 'Novice',
  2: 'Intermediate',
  3: 'Experienced'
} as const;

export interface Player {
  id: string;
  name: string;
  experienceLevel: ExperienceLevel;
}
