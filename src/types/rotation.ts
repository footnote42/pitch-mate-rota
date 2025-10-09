export type ExperienceLevel = 'experienced' | 'novice';

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
}
