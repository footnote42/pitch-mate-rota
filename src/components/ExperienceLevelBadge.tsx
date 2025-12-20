import { ExperienceLevel, EXPERIENCE_LABELS, EXPERIENCE_STARS } from '@/types/rotation';
import { cn } from '@/lib/utils';

interface ExperienceLevelBadgeProps {
    level: ExperienceLevel;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
};

export const ExperienceLevelBadge = ({
    level,
    showLabel = false,
    size = 'md',
    className
}: ExperienceLevelBadgeProps) => {
    const stars = EXPERIENCE_STARS[level];
    const label = EXPERIENCE_LABELS[level];

    return (
        <span
            className={cn("inline-flex items-center gap-1", sizeClasses[size], className)}
            aria-label={label}
            title={label}
        >
            <span>{stars}</span>
            {showLabel && <span className="text-muted-foreground">{label}</span>}
        </span>
    );
};
