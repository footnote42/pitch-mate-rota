import { Check } from 'lucide-react';
import { useState } from 'react';

interface GridCellProps {
  assigned: boolean;
  disabled: boolean;
  onClick: () => void;
}

export const GridCell = ({ assigned, disabled, onClick }: GridCellProps) => {
  const [flash, setFlash] = useState(false);

  const handleClick = () => {
    if (disabled && !assigned) {
      // Flash red when trying to click a full half
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled && !assigned}
      className={`
        min-w-[88px] h-12 border-r last:border-r-0 
        flex items-center justify-center
        transition-all duration-150
        ${assigned 
          ? 'bg-success hover:bg-success/80 cursor-pointer' 
          : disabled 
            ? 'bg-muted/50 cursor-not-allowed' 
            : 'bg-card hover:bg-accent cursor-pointer'
        }
        ${flash ? 'bg-destructive' : ''}
        active:scale-95
      `}
    >
      {assigned && <Check className="h-5 w-5 text-success-foreground" />}
    </button>
  );
};
