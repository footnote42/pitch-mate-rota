import { Absence, Availability } from '@/rota';

// 'Arrives game 2', 'Leaves after game 3', 'Games 2-3'; null when there all day.
export const availabilityLabel = ({ arrives, leaves }: Availability, games: number): string | null => {
  if (arrives === 1 && leaves === games) return null;
  if (arrives === leaves) return `Game ${arrives} only`;
  if (arrives > 1 && leaves < games) return `Games ${arrives}-${leaves}`;
  if (arrives > 1) return `Arrives game ${arrives}`;
  return `Leaves after game ${leaves}`;
};

// The same, short enough for the Overview's name column: 'From G2', 'To G3', 'G2-3'.
export const availabilityShort = ({ arrives, leaves }: Availability, games: number): string | null => {
  if (arrives === 1 && leaves === games) return null;
  if (arrives === leaves) return `G${arrives} only`;
  if (arrives > 1 && leaves < games) return `G${arrives}-${leaves}`;
  return arrives > 1 ? `From G${arrives}` : `To G${leaves}`;
};

export const ABSENCE_LABEL: Record<Exclude<Absence, null>, string> = { notYet: 'Not here yet', gone: 'Gone', out: 'Out' };
