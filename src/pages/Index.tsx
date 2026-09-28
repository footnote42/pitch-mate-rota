import { useState, useEffect } from 'react';
import { useRotationState } from '@/hooks/useRotationState';
import { assess, halfKey, toHalves, Half, MIN_GAMES, MAX_GAMES } from '@/rota';
import { AgeGroup } from '@/types/ageGroup';
import { ExperienceLevel } from '@/types/rotation';
import { Header } from '@/components/Header';
import { PlayerManagement } from '@/components/PlayerManagement';
import { RotationGrid } from '@/components/RotationGrid';
import { GameCountSelector } from '@/components/GameCountSelector';
import { AgeGroupSelector } from '@/components/AgeGroupSelector';
import { Tutorial } from '@/components/Tutorial';
import { ShareToWhatsApp } from '@/components/ShareToWhatsApp';
import { useToast } from '@/hooks/use-toast';

const displayFont = '"Big Shoulders Display", system-ui, sans-serif';

const Index = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState<string | null>(null);
  const { toast } = useToast();
  const { state, dispatch, preview, recovered, lastSaved } = useRotationState();
  const { squad: players, festival } = state;
  const { games: numberOfGames, ageGroup, labels: gameLabels, picks: assignments } = festival;
  const assessment = assess(state);
  const half = (game: number, h: Half) => assessment.halves[halfKey(game, h)];

  useEffect(() => {
    if (!localStorage.getItem('tutorial-completed')) setShowTutorial(true);
  }, []);

  useEffect(() => {
    if (recovered) {
      toast({
        title: 'Saved data could not be read',
        description: 'Starting fresh. A copy of the old data was kept on this phone.',
        variant: 'destructive',
      });
    }
  }, [recovered, toast]);

  useEffect(() => {
    const key = `${numberOfGames}-${assignments.length}`;
    if (assessment.complete && celebrationShown !== key) {
      toast({ title: "Looking good, Coach!", description: "Your squad is match-ready.", duration: 4000 });
      setCelebrationShown(key);
    } else if (!assessment.complete && celebrationShown) {
      setCelebrationShown(null);
    }
  }, [assessment.complete, numberOfGames, assignments.length, celebrationShown, toast]);

  // Confirmation dialogs get their wording from a dry run of the change.
  const changeNumberOfGames = (games: number): number[] => {
    const kept = preview({ type: 'setGames', games }).festival.picks;
    const dropped = assignments.filter(p => !kept.includes(p)).map(p => p.game);
    const affected = [...new Set(dropped)].sort((a, b) => a - b);
    if (affected.length === 0) dispatch({ type: 'setGames', games });
    return affected;
  };

  const changeAgeGroup = (next: AgeGroup): boolean => {
    if (preview({ type: 'setAgeGroup', ageGroup: next }).festival.picks.length < assignments.length) return false;
    dispatch({ type: 'setAgeGroup', ageGroup: next });
    return true;
  };

  const playersOnField = half(1, 1).capacity;
  const minimumHalves = toHalves(assessment.minimum);

  return (
    <div className="min-h-screen bg-background">
      <Tutorial open={showTutorial} onOpenChange={setShowTutorial} />

      <Header
        lastSaved={lastSaved}
        onClearAll={() => dispatch({ type: 'newFestival', keepSquad: true })}
        onResetAll={() => dispatch({ type: 'newFestival', keepSquad: false })}
        onOpenTutorial={() => setShowTutorial(true)}
      />

      {/* Sticky scoreboard strip */}
      {players.length > 0 && (
        <div
          className="sticky top-0 z-30 bg-primary shadow-md"
          style={{ borderBottom: '1px solid hsl(var(--primary-foreground) / 0.12)' }}
        >
          <div className="container mx-auto px-4">
            <div
              className="flex items-stretch text-primary-foreground"
              style={{ borderLeft: '1px solid hsl(var(--primary-foreground) / 0.12)' }}
            >
              {[
                { value: players.length,     label: 'Squad'      },
                { value: minimumHalves,      label: 'Min Halves' },
                { value: assessment.fairShare, label: 'Target'   },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center py-2 px-4 sm:px-6"
                  style={{ borderRight: '1px solid hsl(var(--primary-foreground) / 0.12)', minWidth: '80px' }}
                >
                  <span
                    className="text-primary-foreground leading-none"
                    style={{ fontFamily: displayFont, fontSize: '1.6rem', fontWeight: 900 }}
                  >
                    {value}
                  </span>
                  <span
                    className="text-primary-foreground/50 mt-0.5 uppercase"
                    style={{ fontFamily: displayFont, fontSize: '0.56rem', letterSpacing: '0.16em', fontWeight: 600 }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-5 space-y-6">

        {/* Festival config toolbar */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-4 border-b border-border">
          <AgeGroupSelector
            ageGroup={ageGroup}
            onChangeAgeGroup={changeAgeGroup}
            onConfirmChange={(next) => dispatch({ type: 'setAgeGroup', ageGroup: next })}
          />
          <span className="text-border hidden sm:inline" aria-hidden="true">·</span>
          <GameCountSelector
            numberOfGames={numberOfGames}
            minGames={MIN_GAMES}
            maxGames={MAX_GAMES}
            onChangeGames={changeNumberOfGames}
            onConfirmChange={(games) => dispatch({ type: 'setGames', games })}
          />
        </div>

        <PlayerManagement
          players={players}
          onAddPlayer={(name: string, experienceLevel: ExperienceLevel) =>
            dispatch({ type: 'addPlayer', id: crypto.randomUUID(), name, experienceLevel })}
          onRemovePlayer={(playerId) => dispatch({ type: 'removePlayer', playerId })}
          onSetExperienceLevel={(playerId, level) => dispatch({ type: 'setExperienceLevel', playerId, level })}
          getPlayerHalfCount={(playerId) => toHalves(assessment.players[playerId]?.planned ?? 0)}
          minimumHalves={minimumHalves}
          fairShare={assessment.fairShare}
        />

        {/* Rotation grid heading */}
        {players.length > 0 && (
          <h2
            className="text-foreground uppercase leading-none -mb-2"
            style={{ fontFamily: displayFont, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.04em' }}
          >
            Rotation Grid
          </h2>
        )}

        <RotationGrid
          players={players}
          numberOfGames={numberOfGames}
          playersOnField={playersOnField}
          isAssigned={(playerId, game, h) => assignments.some(p => p.playerId === playerId && p.game === game && p.half === h)}
          toggleAssignment={(playerId, game, h) => dispatch({ type: 'togglePick', playerId, game, half: h })}
          getHalfCount={(game, h) => half(game, h).count}
          getExperienceBalance={(game, h) => {
            const { count, balance } = half(game, h);
            return { totalPoints: balance.total, playerCount: count, isBalanced: balance.balanced, targetPoints: balance.target };
          }}
          clearHalf={(game, h) => dispatch({ type: 'clearHalf', game, half: h })}
          clearGame={(game) => dispatch({ type: 'clearGame', game })}
          gameLabels={gameLabels}
          updateGameLabel={(game, label) => dispatch({ type: 'setLabel', game, label })}
        />

        {players.length > 0 && assignments.length > 0 && (
          <ShareToWhatsApp
            players={players}
            assignments={assignments}
            numberOfGames={numberOfGames}
            ageGroup={ageGroup}
            gameLabels={gameLabels}
            playersOnField={playersOnField}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
