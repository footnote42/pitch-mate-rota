import { Availability } from '@/rota';

// 'Arrives game 2', 'Leaves after game 3', 'Games 2-3'; null when there all day.
export const presenceLabel = ({ arrives, leaves }: Availability, games: number): string | null => {
  if (arrives === 1 && leaves === games) return null;
  if (arrives === leaves) return `Game ${arrives} only`;
  if (arrives > 1 && leaves < games) return `Games ${arrives}-${leaves}`;
  if (arrives > 1) return `Arrives game ${arrives}`;
  return `Leaves after game ${leaves}`;
};
