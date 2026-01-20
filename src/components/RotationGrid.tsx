import { Player } from '@/types/rotation';
import { GridCell } from './GridCell';
import { ExperienceBalance } from './ExperienceBalance';
import { ExperienceLevelBadge } from './ExperienceLevelBadge';
import { Button } from '@/components/ui/button';
import { Eraser, Users } from 'lucide-react';
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
      <div className="bg-card rounded-lg border p-12 text-center">
        <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
          <div className="rounded-full bg-primary/10 p-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Ready to build your game plan?</p>
            <p className="text-sm text-muted-foreground">Add players to your squad, then click cells to build rotations</p>
          </div>
        </div>
      </div>
    );
  }

  const games = Array.from({ length: numberOfGames }, (_, i) => i + 1);
  const halves = [1, 2];

  return (
    <div className="bg-card rounded-lg border overflow-hidden relative">
      {/* Trojans Logo Watermark */}
      {players.length > 0 && (
        <img
          src="/trojans_logo.png"
          alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none w-64 h-64 object-contain z-0"
          aria-hidden="true"
        />
      )}

      {/* Icon Legend */}
      {players.length > 0 && (
        <div className="relative z-10 bg-muted/50 border-b px-4 py-2">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eraser className="h-3 w-3" />
              <span>Clear assignments</span>
            </div>
            <div className="text-muted-foreground/50">•</div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Experience Mix</span>
              <span>= Balance indicator</span>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto relative z-10">
        <div className="inline-block min-w-full">
          {/* Game label row */}
          <div className="flex border-b bg-muted">
            <div className="sticky left-0 z-20 bg-muted border-r min-w-[140px] px-3 py-2">
              <span className="text-sm font-semibold text-foreground">Opposition & Kick-off</span>
            </div>
            {games.map(game => (
              <div key={`label-${game}`} className="border-r last:border-r-0 min-w-[176px] py-2">
                <input
                  type="text"
                  value={gameLabels[game] || ''}
                  onChange={(e) => updateGameLabel(game, e.target.value)}
                  placeholder="e.g. Tigers - 10:00"
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
                    <div key={half} className="flex flex-col min-w-[88px] px-2 py-1 border-r last:border-r-0 items-center gap-0.5">
                      <span className="text-xs font-medium text-foreground">
                        G{game}-{half === 1 ? '1st' : '2nd'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] hover:bg-destructive/10 p-0"
                        onClick={() => handleClearHalf(game, half)}
                      >
                        <Eraser className="h-4 w-4" />
                      </Button>
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
              <span className="text-xs font-semibold text-foreground">Experience Mix</span>
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
                  className="text-xs min-h-[44px]"
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
                ? `Clear this half?`
                : `Clear both halves of Game ${clearAction?.game}?`
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clearAction?.type === 'half'
                ? 'All assignments for this half will be removed.'
                : 'All assignments for this game will be removed.'
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
