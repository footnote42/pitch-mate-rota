import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ExperienceBalanceProps {
  totalPoints: number;
  playerCount: number;
  isBalanced: boolean;
  targetPoints: number;
}

export const ExperienceBalance = ({ totalPoints, playerCount, isBalanced, targetPoints }: ExperienceBalanceProps) => {
  if (playerCount === 0) {
    return (
      <div className="min-w-[88px] px-2 py-2 border-r last:border-r-0 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">-</span>
      </div>
    );
  }

  // Determine color based on balance
  const colorClass = isBalanced
    ? 'text-success bg-success/10'
    : 'text-warning bg-warning/10';

  const Icon = isBalanced ? CheckCircle2 : AlertCircle;

  return (
    <div className={`min-w-[88px] px-2 py-2 border-r last:border-r-0 ${colorClass}`} title={`Target: ${targetPoints} pts`}>
      <div className="flex items-center justify-center gap-1 text-xs font-medium">
        <Icon className="h-3 w-3" />
        <span>{totalPoints} pts</span>
      </div>
    </div>
  );
};
