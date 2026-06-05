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

const displayFont = '"Big Shoulders Display", system-ui, sans-serif';

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
      <p className="py-6 text-sm text-muted-foreground">
        Add players to your squad to start building rotations.
      </p>
    );
  }

  const games = Array.from({ length: numberOfGames }, (_, i) => i + 1);
  const halves = [1, 2];

  return (
    <div className="rounded-lg border overflow-hidden relative bg-background">
      {/* Trojans logo watermark */}
      <img
        src="/trojans_logo.png"
        alt=""
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none w-72 h-72 object-contain z-0"
        aria-hidden="true"
      />

      <div className="overflow-x-auto relative z-10">
        <div className="inline-block min-w-full">

          {/* Row 1 — opponent / kick-off label inputs */}
          <div className="flex bg-muted/50 border-b border-border">
            <div className="sticky left-0 z-20 bg-muted/50 border-r border-border min-w-[140px] px-3 py-2 flex items-end">
              <span
                className="text-[0.58rem] font-semibold uppercase text-muted-foreground"
                style={{ letterSpacing: '0.18em' }}
              >
                vs · Time
              </span>
            </div>
            {games.map(game => (
              <div key={`label-${game}`} className="min-w-[176px] py-2 border-r border-border last:border-r-0">
                <input
                  type="text"
                  value={gameLabels[game] || ''}
                  onChange={(e) => updateGameLabel(game, e.target.value)}
                  placeholder="e.g. Tigers · 10:00"
                  className="w-full text-center text-xs font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 placeholder:text-muted-foreground/35"
                />
              </div>
            ))}
          </div>

          {/* Row 2 — game/half column headers */}
          <div
            className="flex bg-primary text-primary-foreground"
            style={{ borderBottom: '2px solid hsl(var(--trojans-gold))' }}
          >
            <div
              className="sticky left-0 z-20 bg-primary min-w-[140px] px-3 py-2 flex items-center"
              style={{ borderRight: '1px solid hsl(var(--primary-foreground) / 0.15)' }}
            >
              <span
                className="text-primary-foreground/75 uppercase"
                style={{ fontFamily: displayFont, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em' }}
              >
                Player
              </span>
            </div>
            {games.map(game => (
              <div
                key={game}
                className="flex"
                style={{ borderRight: '1px solid hsl(var(--primary-foreground) / 0.15)' }}
              >
                {halves.map(half => {
                  const count = getHalfCount(game, half);
                  const isFull = count >= playersOnField;

                  return (
                    <div
                      key={half}
                      className="flex flex-col min-w-[88px] px-2 py-1.5 items-center gap-0.5"
                      style={half === 1 ? { borderRight: '1px solid hsl(var(--primary-foreground) / 0.10)' } : undefined}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className="text-primary-foreground/90 uppercase leading-none"
                          style={{ fontFamily: displayFont, fontSize: '0.75rem', fontWeight: 900 }}
                        >
                          G{game} {half === 1 ? '1st' : '2nd'}
                        </span>
                        <button
                          className="text-primary-foreground/35 hover:text-primary-foreground/80 transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center rounded"
                          onClick={() => setClearAction({ type: 'half', game, half })}
                          title={`Clear G${game} ${half === 1 ? '1st' : '2nd'} half`}
                        >
                          <Eraser className="h-3 w-3" />
                        </button>
                      </div>
                      <span
                        className="text-[0.6rem] font-bold uppercase tracking-wide"
                        style={{
                          color: isFull ? 'hsl(var(--trojans-gold))' : 'hsl(var(--primary-foreground) / 0.45)',
                        }}
                      >
                        {count}/{playersOnField}{isFull ? ' FULL' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Player rows */}
          {players.map((player, idx) => (
            <div
              key={player.id}
              className={`flex hover:bg-accent/70 transition-colors ${idx < players.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="sticky left-0 z-10 bg-background min-w-[140px] px-3 py-2 flex items-center gap-1.5 border-r border-border">
                <ExperienceLevelBadge level={player.experienceLevel} size="sm" />
                <span className="text-sm font-medium text-foreground truncate leading-tight">{player.name}</span>
              </div>
              {games.map(game => (
                <div key={game} className="flex border-r border-border last:border-r-0">
                  {halves.map(half => {
                    const assigned = isAssigned(player.id, game, half);
                    const count = getHalfCount(game, half);
                    return (
                      <GridCell
                        key={half}
                        assigned={assigned}
                        disabled={!assigned && count >= playersOnField}
                        onClick={() => toggleAssignment(player.id, game, half)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          {/* Experience balance row */}
          <div className="flex bg-muted/40 border-t border-border">
            <div className="sticky left-0 z-10 bg-muted/40 min-w-[140px] px-3 py-2 flex items-center border-r border-border">
              <span
                className="text-[0.58rem] font-semibold uppercase text-muted-foreground"
                style={{ letterSpacing: '0.18em' }}
              >
                Exp. Mix
              </span>
            </div>
            {games.map(game => (
              <div key={game} className="flex border-r border-border last:border-r-0">
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

          {/* Clear game row */}
          <div className="flex border-t border-border">
            <div className="sticky left-0 z-10 bg-background min-w-[140px] px-3 py-2 flex items-center border-r border-border">
              <span
                className="text-[0.58rem] font-semibold uppercase text-muted-foreground/55"
                style={{ letterSpacing: '0.18em' }}
              >
                Clear
              </span>
            </div>
            {games.map(game => (
              <div key={game} className="flex items-center justify-center min-w-[176px] px-2 py-1.5 border-r border-border last:border-r-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[0.7rem] text-muted-foreground hover:text-foreground hover:bg-accent h-8 px-3"
                  onClick={() => setClearAction({ type: 'game', game })}
                >
                  <Eraser className="h-3 w-3 mr-1.5" />
                  Game {game}
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
                ? 'Clear this half?'
                : `Clear both halves of Game ${clearAction?.game}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clearAction?.type === 'half'
                ? 'All assignments for this half will be removed.'
                : 'All assignments for this game will be removed.'}
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
