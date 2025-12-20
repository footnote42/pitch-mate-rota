export type AgeGroup = 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12';

export interface AgeGroupConfig {
  name: AgeGroup;
  playersOnField: number;
  displayLabel: string;
}

export const AGE_GROUP_CONFIGS: Record<AgeGroup, AgeGroupConfig> = {
  U7: { name: 'U7', playersOnField: 4, displayLabel: 'U7 (4 players)' },
  U8: { name: 'U8', playersOnField: 6, displayLabel: 'U8 (6 players)' },
  U9: { name: 'U9', playersOnField: 7, displayLabel: 'U9 (7 players)' },
  U10: { name: 'U10', playersOnField: 8, displayLabel: 'U10 (8 players)' },
  U11: { name: 'U11', playersOnField: 9, displayLabel: 'U11 (9 players)' },
  U12: { name: 'U12', playersOnField: 12, displayLabel: 'U12 (12 players)' },
};

export const DEFAULT_AGE_GROUP: AgeGroup = 'U10';
export const AGE_GROUP_PREFERENCE_KEY = 'squad-rotation-age-group';
