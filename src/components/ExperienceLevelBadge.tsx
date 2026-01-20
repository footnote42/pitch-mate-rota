import { ExperienceLevel, EXPERIENCE_LABELS, EXPERIENCE_ABBREVIATIONS, EXPERIENCE_FULL_LABELS } from '@/types/rotation';
import { cn } from '@/lib/utils';

interface ExperienceLevelBadgeProps {
    level: ExperienceLevel;
    displayMode?: 'full' | 'abbreviated';
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
    displayMode = 'abbreviated',
    size = 'md',
    className
}: ExperienceLevelBadgeProps) => {
    const label = displayMode === 'full'
        ? EXPERIENCE_FULL_LABELS[level]
        : EXPERIENCE_ABBREVIATIONS[level];
    const fullLabel = EXPERIENCE_LABELS[level];

    return (
        <span
            className={cn("inline-flex items-center gap-1", sizeClasses[size], className)}
            aria-label={fullLabel}
            title={fullLabel}
        >
            <span>{label}</span>
        </span>
    );
};
