import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Player, ExperienceLevel, EXPERIENCE_LABELS, EXPERIENCE_FULL_LABELS } from '@/types/rotation';
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
      toast({
        title: "Invalid name",
        description: result.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    onAddPlayer(result.data, newPlayerExperience);
    setNewPlayerName('');
    setNewPlayerExperience(2);
    // Refocus input for rapid player entry
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const confirmRemove = (player: Player) => {
    setPlayerToRemove(player);
  };

  const handleRemove = () => {
    if (playerToRemove) {
      onRemovePlayer(playerToRemove.id);
      setPlayerToRemove(null);
    }
  };

  const getSortedPlayers = (): Player[] => {
    const playersCopy = [...players];

    switch (sortBy) {
      case 'alphabetical':
        return playersCopy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

      case 'experience':
        // Sort by experience level: 3 (Experienced) → 2 (Intermediate) → 1 (Novice)
        return playersCopy.sort((a, b) => b.experienceLevel - a.experienceLevel);

      case 'order-added':
      default:
        return playersCopy; // Maintain original order
    }
  };

  const sortedPlayers = getSortedPlayers();

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Your Squad ({players.length})</h2>

          {players.length > 0 && (
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order-added">Order Added</SelectItem>
                <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                <SelectItem value="experience">Experience Level</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Input
            ref={inputRef}
            placeholder="Player name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          />

          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-1 border rounded-md p-1">
              <button
                type="button"
                onClick={() => setNewPlayerExperience(1)}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded transition-colors ${newPlayerExperience === 1
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {EXPERIENCE_FULL_LABELS[1]}
              </button>
              <button
                type="button"
                onClick={() => setNewPlayerExperience(2)}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded transition-colors ${newPlayerExperience === 2
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {EXPERIENCE_FULL_LABELS[2]}
              </button>
              <button
                type="button"
                onClick={() => setNewPlayerExperience(3)}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded transition-colors ${newPlayerExperience === 3
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {EXPERIENCE_FULL_LABELS[3]}
              </button>
            </div>
            <Button onClick={handleAddPlayer} size="icon" className="shrink-0">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {sortedPlayers.map((player) => {
          const halfCount = getPlayerHalfCount(player.id);
          const belowMinimum = halfCount < minimumHalves;
          const belowFair = halfCount < fairShare - 1;
          const aboveFair = halfCount > fairShare + 1;

          return (
            <div
              key={player.id}
              className="flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors group"
            >
              <Select
                value={player.experienceLevel.toString()}
                onValueChange={(val) => onSetExperienceLevel(player.id, Number(val) as ExperienceLevel)}
              >
                <SelectTrigger className="w-32 h-8 shrink-0">
                  <SelectValue>
                    <ExperienceLevelBadge level={player.experienceLevel} size="sm" displayMode="abbreviated" />
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

              <span className="flex-1 text-sm font-medium text-foreground">{player.name}</span>

              <div className="flex items-center gap-1 text-xs">
                <span className={belowMinimum ? 'text-warning font-semibold' : 'text-muted-foreground'}>
                  {halfCount}
                </span>
                {belowMinimum && (
                  <Badge variant="outline" className="border-warning text-warning h-5 px-1">
                    Need {minimumHalves - halfCount} more
                  </Badge>
                )}
                {!belowMinimum && belowFair && (
                  <Badge variant="outline" className="border-warning text-warning h-5 px-1">
                    Below fair
                  </Badge>
                )}
                {aboveFair && (
                  <Badge variant="outline" className="border-info text-info h-5 px-1">
                    Over-used
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => confirmRemove(player)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        {players.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No squad yet? Time to round up the troops! 🏉
          </p>
        )}
      </div>

      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {playerToRemove?.name} from squad?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from all game assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
