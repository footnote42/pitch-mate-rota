import { Check } from 'lucide-react';
import { useState, useRef } from 'react';

interface GridCellProps {
  assigned: boolean;
  disabled: boolean;
  onClick: () => void;
}

export const GridCell = ({ assigned, disabled, onClick }: GridCellProps) => {
  const [flash, setFlash] = useState(false);
  const [ripple, setRipple] = useState(false);
  const lastClickTime = useRef<number>(0);

  const handleClick = () => {
    // Debouncing: prevent rapid toggles (max 1 per 100ms)
    const now = Date.now();
    if (now - lastClickTime.current < 100) {
      return;
    }
    lastClickTime.current = now;

    if (disabled && !assigned) {
      // Flash red when trying to click a full half
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      return;
    }

    // Ripple effect
    setRipple(true);
    setTimeout(() => setRipple(false), 300);

    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled && !assigned}
      className={`
        min-w-[88px] h-12 border-r last:border-r-0
        flex items-center justify-center
        transition-all duration-200 ease-in-out relative overflow-hidden
        ${assigned
          ? 'bg-success hover:bg-success/80 cursor-pointer'
          : disabled
            ? 'bg-muted/50 cursor-not-allowed'
            : 'bg-card hover:bg-accent hover:shadow-sm cursor-pointer'
        }
        ${flash ? 'bg-destructive' : ''}
        ${ripple ? 'after:absolute after:inset-0 after:bg-white/30 after:animate-[ripple_300ms_ease-out]' : ''}
        active:scale-95
      `}
    >
      {assigned && <Check className="h-5 w-5 text-success-foreground" />}
    </button>
  );
};
