import { ExperienceLevel } from '@/types/rotation';
import { cn } from '@/lib/utils';

interface ExperienceLevelBadgeProps {
    level: ExperienceLevel;
    displayMode?: 'full' | 'abbreviated';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const levelConfig = {
  1: { letter: 'N', full: 'Novice',       pill: 'bg-red-50 text-red-700'        },
  2: { letter: 'I', full: 'Intermediate', pill: 'bg-amber-50 text-amber-700'    },
  3: { letter: 'E', full: 'Experienced',  pill: 'bg-primary/10 text-primary'    },
} as const;

const sizeMap = {
  sm: { pill: 'w-5 h-5 text-[0.6rem]',  row: 'text-xs' },
  md: { pill: 'w-6 h-6 text-xs',        row: 'text-sm' },
  lg: { pill: 'w-7 h-7 text-sm',        row: 'text-base' },
};

export const ExperienceLevelBadge = ({
    level,
    displayMode = 'abbreviated',
    size = 'md',
    className,
}: ExperienceLevelBadgeProps) => {
    const config = levelConfig[level];
    const sizes = sizeMap[size];

    if (displayMode === 'full') {
      return (
        <span
          className={cn('inline-flex items-center gap-1.5', sizes.row, className)}
          aria-label={config.full}
          title={config.full}
        >
          <span className={cn('inline-flex items-center justify-center rounded font-bold leading-none flex-shrink-0', config.pill, sizes.pill)}>
            {config.letter}
          </span>
          <span>{config.full}</span>
        </span>
      );
    }

    return (
        <span
            className={cn(
              'inline-flex items-center justify-center rounded font-bold leading-none flex-shrink-0',
              config.pill,
              sizes.pill,
              className,
            )}
            aria-label={config.full}
            title={config.full}
        >
            {config.letter}
        </span>
    );
};
