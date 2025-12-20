import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Player, ExperienceLevel, EXPERIENCE_LABELS } from '@/types/rotation';
import { UserPlus, X } from 'lucide-react';
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
  const { toast } = useToast();

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

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Players ({players.length})</h2>

        <div className="space-y-2">
          <Input
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
                ⭐ New
              </button>
              <button
                type="button"
                onClick={() => setNewPlayerExperience(2)}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded transition-colors ${newPlayerExperience === 2
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                ⭐⭐ Getting There
              </button>
              <button
                type="button"
                onClick={() => setNewPlayerExperience(3)}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded transition-colors ${newPlayerExperience === 3
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                ⭐⭐⭐ Ready
              </button>
            </div>
            <Button onClick={handleAddPlayer} size="icon" className="shrink-0">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {players.map((player) => {
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
                    <ExperienceLevelBadge level={player.experienceLevel} size="sm" />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <div className="flex items-center gap-2">
                      <span>⭐</span>
                      <span>New Player</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center gap-2">
                      <span>⭐⭐</span>
                      <span>Getting There</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div className="flex items-center gap-2">
                      <span>⭐⭐⭐</span>
                      <span>Match Ready</span>
                    </div>
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
            No players added yet. Add your first player above.
          </p>
        )}
      </div>

      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {playerToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all their assignments from the grid.
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
