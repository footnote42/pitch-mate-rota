import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/types/rotation';
import { UserPlus, X, Award, User } from 'lucide-react';
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

interface PlayerManagementProps {
  players: Player[];
  onAddPlayer: (name: string, experience: 'experienced' | 'novice') => void;
  onRemovePlayer: (playerId: string) => void;
  onToggleExperience: (playerId: string) => void;
  getPlayerHalfCount: (playerId: string) => number;
  minimumHalves: number;
  fairShare: number;
}

export const PlayerManagement = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  onToggleExperience,
  getPlayerHalfCount,
  minimumHalves,
  fairShare,
}: PlayerManagementProps) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerExperience, setNewPlayerExperience] = useState<'experienced' | 'novice'>('novice');
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim(), newPlayerExperience);
      setNewPlayerName('');
      setNewPlayerExperience('novice');
    }
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
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Players ({players.length})</h2>
        
        <div className="flex gap-2">
          <Input
            placeholder="Player name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
            className="flex-1"
          />
          <Button
            onClick={() => setNewPlayerExperience(prev => prev === 'novice' ? 'experienced' : 'novice')}
            variant={newPlayerExperience === 'experienced' ? 'default' : 'outline'}
            size="icon"
            className="shrink-0"
          >
            {newPlayerExperience === 'experienced' ? <Award className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </Button>
          <Button onClick={handleAddPlayer} size="icon" className="shrink-0">
            <UserPlus className="h-4 w-4" />
          </Button>
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
              <button
                onClick={() => onToggleExperience(player.id)}
                className="shrink-0"
              >
                {player.experienceLevel === 'experienced' ? (
                  <Badge variant="default" className="bg-primary">
                    <Award className="h-3 w-3 mr-1" />
                    Exp
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <User className="h-3 w-3 mr-1" />
                    Nov
                  </Badge>
                )}
              </button>
              
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
