import { Check } from 'lucide-react';

interface ExperienceBalanceProps {
  totalPoints: number;
  playerCount: number;
  isBalanced: boolean;
  targetPoints: number;
}

export const ExperienceBalance = ({
  totalPoints,
  playerCount,
  isBalanced,
  targetPoints,
}: ExperienceBalanceProps) => {
  if (playerCount === 0) {
    return (
      <div className="min-w-[88px] px-2 py-2 border-r last:border-r-0 flex items-center justify-center">
        <span className="text-muted-foreground/30 text-xs">—</span>
      </div>
    );
  }

  return (
    <div
      className={`min-w-[88px] px-2 py-2 border-r last:border-r-0 ${isBalanced ? 'bg-success/10' : 'bg-warning/10'}`}
      title={`Balance: ${totalPoints} pts · target ${targetPoints} pts`}
    >
      <div className={`flex items-center justify-center gap-1 text-[0.65rem] font-semibold ${isBalanced ? 'text-success' : 'text-warning'}`}>
        {isBalanced && <Check className="h-3 w-3 stroke-[2.5] flex-shrink-0" />}
        <span>{totalPoints}pt</span>
      </div>
    </div>
  );
};
