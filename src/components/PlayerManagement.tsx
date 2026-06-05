import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Player, ExperienceLevel, EXPERIENCE_FULL_LABELS } from '@/types/rotation';
import { UserPlus, X, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExperienceLevelBadge } from './ExperienceLevelBadge';
import { cn } from '@/lib/utils';

const playerNameSchema = z.string()
  .trim()
  .min(1, 'Name cannot be empty')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s'-]+$/, 'Name contains invalid characters');

type SortOption = 'order-added' | 'alphabetical' | 'experience';

interface PlayerManagementProps {
  players: Player[];
  onAddPlayer: (name: string, experience: ExperienceLevel) => void;
  onRemovePlayer: (playerId: string) => void;
  onSetExperienceLevel: (playerId: string, level: ExperienceLevel) => void;
  getPlayerHalfCount: (playerId: string) => number;
  minimumHalves: number;
  fairShare: number;
}

export const PlayerManagement = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  onSetExperienceLevel,
  getPlayerHalfCount,
  minimumHalves,
  fairShare,
}: PlayerManagementProps) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerExperience, setNewPlayerExperience] = useState<ExperienceLevel>(2);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('order-added');
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddPlayer = () => {
    const result = playerNameSchema.safeParse(newPlayerName);
    if (!result.success) {
      toast({ title: "Invalid name", description: result.error.errors[0].message, variant: "destructive" });
      return;
    }
    onAddPlayer(result.data, newPlayerExperience);
    setNewPlayerName('');
    setNewPlayerExperience(2);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const getSortedPlayers = (): Player[] => {
    const copy = [...players];
    switch (sortBy) {
      case 'alphabetical':
        return copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      case 'experience':
        return copy.sort((a, b) => b.experienceLevel - a.experienceLevel);
      default:
        return copy;
    }
  };

  const sortedPlayers = getSortedPlayers();

  return (
    <div className="space-y-3">
      {/* Section heading */}
      <div className="flex items-center justify-between gap-3">
        <h2
          className="text-foreground uppercase leading-none"
          style={{
            fontFamily: '"Big Shoulders Display", system-ui, sans-serif',
            fontSize: '1.15rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}
        >
          Your Squad
          <span className="text-muted-foreground ml-2 font-headings text-base font-normal">
            {players.length}
          </span>
        </h2>

        {players.length > 0 && (
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-auto h-7 text-[0.7rem] gap-1 pl-2 pr-2 border-muted text-muted-foreground">
              <ArrowUpDown className="h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order-added">Order added</SelectItem>
              <SelectItem value="alphabetical">A–Z</SelectItem>
              <SelectItem value="experience">Experience</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Add player */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Player name"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          className="flex-1 min-w-0"
        />
        <div className="flex items-center border rounded-md overflow-hidden bg-background shrink-0">
          {([1, 2, 3] as ExperienceLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setNewPlayerExperience(level)}
              className={cn(
                'px-3 py-2 text-xs font-semibold transition-colors h-10',
                newPlayerExperience === level
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {level === 1 ? 'N' : level === 2 ? 'I' : 'E'}
            </button>
          ))}
        </div>
        <Button onClick={handleAddPlayer} size="icon" className="shrink-0 h-10 w-10">
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Player list */}
      <div className="rounded-md border border-border overflow-hidden">
        {sortedPlayers.length === 0 ? (
          <div className="py-8 px-4 text-center text-sm text-muted-foreground">
            No players yet — add your squad above
          </div>
        ) : (
          sortedPlayers.map((player, idx) => {
            const halfCount = getPlayerHalfCount(player.id);
            const belowMinimum = halfCount < minimumHalves;
            const belowFair = !belowMinimum && halfCount < fairShare - 1;
            const aboveFair = halfCount > fairShare + 1;

            const countColor = belowMinimum
              ? 'text-destructive font-bold'
              : belowFair
                ? 'text-warning font-semibold'
                : aboveFair
                  ? 'text-info font-medium'
                  : 'text-muted-foreground';

            return (
              <div
                key={player.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 group hover:bg-accent transition-colors',
                  idx < sortedPlayers.length - 1 ? 'border-b border-border' : ''
                )}
              >
                <Select
                  value={player.experienceLevel.toString()}
                  onValueChange={(val) => onSetExperienceLevel(player.id, Number(val) as ExperienceLevel)}
                >
                  <SelectTrigger className="w-[3.25rem] h-7 px-1 border-0 bg-transparent shadow-none focus:ring-0 shrink-0">
                    <SelectValue>
                      <ExperienceLevelBadge level={player.experienceLevel} size="sm" />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      <ExperienceLevelBadge level={1} size="sm" displayMode="full" />
                    </SelectItem>
                    <SelectItem value="2">
                      <ExperienceLevelBadge level={2} size="sm" displayMode="full" />
                    </SelectItem>
                    <SelectItem value="3">
                      <ExperienceLevelBadge level={3} size="sm" displayMode="full" />
                    </SelectItem>
                  </SelectContent>
                </Select>

                <span className="flex-1 text-sm font-medium text-foreground truncate leading-tight">
                  {player.name}
                </span>

                <span
                  className={cn('text-sm tabular-nums shrink-0 min-w-[1.75rem] text-right', countColor)}
                  title={
                    belowMinimum
                      ? `Needs ${minimumHalves - halfCount} more half${minimumHalves - halfCount === 1 ? '' : 's'}`
                      : belowFair
                        ? 'Below fair share'
                        : aboveFair
                          ? 'Above fair share'
                          : 'On track'
                  }
                >
                  {halfCount}h
                </span>

                <button
                  onClick={() => setPlayerToRemove(player)}
                  className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title={`Remove ${player.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {playerToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from all game assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (playerToRemove) { onRemovePlayer(playerToRemove.id); setPlayerToRemove(null); } }}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
