import { Player } from '@/types/rotation';
import { GridCell } from './GridCell';
import { ExperienceBalance } from './ExperienceBalance';
import { ExperienceLevelBadge } from './ExperienceLevelBadge';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
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
import { useState } from 'react';

interface RotationGridProps {
  players: Player[];
  numberOfGames: number;
  playersOnField: number;
  isAssigned: (playerId: string, game: number, half: number) => boolean;
  toggleAssignment: (playerId: string, game: number, half: number) => boolean;
  getHalfCount: (game: number, half: number) => number;
  getExperienceBalance: (game: number, half: number) => { totalPoints: number; playerCount: number; isBalanced: boolean; targetPoints: number };
  clearHalf: (game: number, half: number) => void;
  clearGame: (game: number) => void;
  gameLabels: Record<number, string>;
  updateGameLabel: (game: number, label: string) => void;
}

export const RotationGrid = ({
  players,
  numberOfGames,
  playersOnField,
  isAssigned,
  toggleAssignment,
  getHalfCount,
  getExperienceBalance,
  clearHalf,
  clearGame,
  gameLabels,
  updateGameLabel,
}: RotationGridProps) => {
  const [clearAction, setClearAction] = useState<{ type: 'half' | 'game'; game: number; half?: number } | null>(null);

  const handleClearHalf = (game: number, half: number) => {
    setClearAction({ type: 'half', game, half });
  };

  const handleClearGame = (game: number) => {
    setClearAction({ type: 'game', game });
  };

  const confirmClear = () => {
    if (!clearAction) return;

    if (clearAction.type === 'half' && clearAction.half !== undefined) {
      clearHalf(clearAction.game, clearAction.half);
    } else if (clearAction.type === 'game') {
      clearGame(clearAction.game);
    }
    setClearAction(null);
  };

  if (players.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">Add players to start creating rotations</p>
      </div>
    );
  }

  const games = Array.from({ length: numberOfGames }, (_, i) => i + 1);
  const halves = [1, 2];

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Game label row */}
          <div className="flex border-b bg-muted">
            <div className="sticky left-0 z-20 bg-muted border-r min-w-[140px] px-3 py-2">
              <span className="text-sm font-semibold text-foreground">Team / Time</span>
            </div>
            {games.map(game => (
              <div key={`label-${game}`} className="border-r last:border-r-0 min-w-[176px] px-2 py-2">
                <input
                  type="text"
                  value={gameLabels[game] || ''}
                  onChange={(e) => updateGameLabel(game, e.target.value)}
                  placeholder="Team X - 1000 hrs"
                  className="w-full text-center text-xs font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 placeholder:text-muted-foreground/50"
                />
              </div>
            ))}
          </div>
          {/* Header row */}
          <div className="flex border-b bg-muted">
            <div className="sticky left-0 z-20 bg-muted border-r min-w-[140px] px-3 py-2">
              <span className="text-sm font-semibold text-foreground">Player</span>
            </div>
            {games.map(game => (
              <div key={game} className="flex border-r last:border-r-0">
                {halves.map(half => {
                  const count = getHalfCount(game, half);
                  const isFull = count >= playersOnField;

                  return (
                    <div key={half} className="flex flex-col min-w-[88px] px-2 py-1 border-r last:border-r-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">
                          G{game}-{half === 1 ? '1st' : '2nd'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 hover:bg-destructive/10"
                          onClick={() => handleClearHalf(game, half)}
                        >
                          <Eraser className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className={`text-xs font-semibold ${isFull ? 'text-warning' : 'text-muted-foreground'}`}>
                        {count}/{playersOnField} {isFull && 'FULL'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Player rows */}
          {players.map(player => (
            <div key={player.id} className="flex border-b last:border-b-0 hover:bg-accent/50 transition-colors">
              <div className="sticky left-0 z-10 bg-card border-r min-w-[140px] px-3 py-2 flex items-center gap-1">
                <ExperienceLevelBadge level={player.experienceLevel} size="sm" />
                <span className="text-sm font-medium text-foreground truncate">{player.name}</span>
              </div>
              {games.map(game => (
                <div key={game} className="flex border-r last:border-r-0">
                  {halves.map(half => {
                    const assigned = isAssigned(player.id, game, half);
                    const count = getHalfCount(game, half);
                    const isFull = count >= playersOnField;

                    return (
                      <GridCell
                        key={half}
                        assigned={assigned}
                        disabled={!assigned && isFull}
                        onClick={() => toggleAssignment(player.id, game, half)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          {/* Experience balance row */}
          <div className="flex border-t bg-muted/50">
            <div className="sticky left-0 z-10 bg-muted/50 border-r min-w-[140px] px-3 py-2">
              <span className="text-xs font-semibold text-foreground">Balance</span>
            </div>
            {games.map(game => (
              <div key={game} className="flex border-r last:border-r-0">
                {halves.map(half => {
                  const balance = getExperienceBalance(game, half);
                  return (
                    <ExperienceBalance
                      key={half}
                      totalPoints={balance.totalPoints}
                      playerCount={balance.playerCount}
                      isBalanced={balance.isBalanced}
                      targetPoints={balance.targetPoints}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Clear game buttons */}
          <div className="flex border-t">
            <div className="sticky left-0 z-10 bg-card border-r min-w-[140px] px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground">Clear Game</span>
            </div>
            {games.map(game => (
              <div key={game} className="flex items-center justify-center border-r last:border-r-0 min-w-[176px] px-2 py-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleClearGame(game)}
                >
                  <Eraser className="h-3 w-3 mr-1" />
                  Clear Game {game}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={!!clearAction} onOpenChange={(open) => !open && setClearAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {clearAction?.type === 'half'
                ? `Clear Game ${clearAction.game} - ${clearAction.half === 1 ? '1st' : '2nd'} Half?`
                : `Clear Game ${clearAction?.game}?`
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clearAction?.type === 'half'
                ? 'All player assignments in this half will be cleared.'
                : 'Both halves will be cleared.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear}>Clear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
