import { Award, User } from 'lucide-react';

interface ExperienceBalanceProps {
  experiencedCount: number;
  noviceCount: number;
  total: number;
}

export const ExperienceBalance = ({ experiencedCount, noviceCount, total }: ExperienceBalanceProps) => {
  if (total === 0) {
    return (
      <div className="min-w-[88px] px-2 py-2 border-r last:border-r-0 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">-</span>
      </div>
    );
  }

  // Calculate balance score (0-10 scale, 5 is perfectly balanced)
  const balanceScore = total > 0 ? (experiencedCount / total) * 10 : 5;
  
  // Determine color based on balance
  let colorClass = 'text-success bg-success/10';
  if (balanceScore < 2 || balanceScore > 8) {
    colorClass = 'text-destructive bg-destructive/10';
  } else if (balanceScore < 4 || balanceScore > 6) {
    colorClass = 'text-warning bg-warning/10';
  }

  return (
    <div className={`min-w-[88px] px-2 py-2 border-r last:border-r-0 ${colorClass}`}>
      <div className="flex items-center justify-center gap-1 text-xs font-medium">
        <div className="flex items-center gap-0.5">
          <Award className="h-3 w-3" />
          <span>{experiencedCount}</span>
        </div>
        <span>/</span>
        <div className="flex items-center gap-0.5">
          <User className="h-3 w-3" />
          <span>{noviceCount}</span>
        </div>
      </div>
    </div>
  );
};
