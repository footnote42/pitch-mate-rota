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
    const now = Date.now();
    if (now - lastClickTime.current < 100) return;
    lastClickTime.current = now;

    if (disabled && !assigned) {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      return;
    }

    setRipple(true);
    setTimeout(() => setRipple(false), 300);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled && !assigned}
      className={[
        'min-w-[88px] h-12 px-2 border-r last:border-r-0',
        'flex items-center justify-center',
        'transition-colors duration-150 relative overflow-hidden',
        'active:scale-95',
        flash
          ? 'bg-destructive/15'
          : assigned
            ? 'bg-success hover:bg-success/85 cursor-pointer'
            : disabled
              ? 'bg-muted/40 cursor-not-allowed opacity-50'
              : 'bg-background hover:bg-accent cursor-pointer',
        ripple ? 'after:absolute after:inset-0 after:bg-white/25 after:animate-[ripple_300ms_ease-out]' : '',
      ].filter(Boolean).join(' ')}
    >
      {assigned && <Check className="h-4 w-4 text-success-foreground stroke-[2.5]" />}
    </button>
  );
};
