import { useState, useEffect } from 'react';
import { useRotationState } from '@/hooks/useRotationState';
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
  const {
    players,
    lastSaved,
    numberOfGames,
    ageGroup,
    playersOnField,
    addPlayer,
    removePlayer,
    setExperienceLevel,
    toggleAssignment,
    clearHalf,
    clearGame,
    clearAllAssignments,
    resetAll,
    isAssigned,
    getHalfCount,
    getPlayerHalfCount,
    getMinimumHalves,
    getFairShare,
    getExperienceBalance,
    changeNumberOfGames,
    confirmChangeNumberOfGames,
    changeAgeGroup,
    confirmChangeAgeGroup,
    gameLabels,
    updateGameLabel,
    MIN_GAMES,
    MAX_GAMES,
    assignments,
  } = useRotationState();

  useEffect(() => {
    if (!localStorage.getItem('tutorial-completed')) setShowTutorial(true);
  }, []);

  useEffect(() => {
    const isComplete = () => {
      if (players.length === 0) return false;
      if (assignments.length < numberOfGames * 2 * playersOnField) return false;
      for (let game = 1; game <= numberOfGames; game++) {
        for (let half = 1; half <= 2; half++) {
          if (!getExperienceBalance(game, half).isBalanced) return false;
        }
      }
      return true;
    };

    const complete = isComplete();
    const key = `${numberOfGames}-${assignments.length}`;

    if (complete && celebrationShown !== key) {
      toast({ title: "Looking good, Coach!", description: "Your squad is match-ready.", duration: 4000 });
      setCelebrationShown(key);
    } else if (!complete && celebrationShown) {
      setCelebrationShown(null);
    }
  }, [assignments, numberOfGames, players, playersOnField, getExperienceBalance, celebrationShown, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Tutorial open={showTutorial} onOpenChange={setShowTutorial} />

      <Header
        lastSaved={lastSaved}
        onClearAll={clearAllAssignments}
        onResetAll={resetAll}
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
                { value: getMinimumHalves(), label: 'Min Halves' },
                { value: getFairShare(),     label: 'Target'     },
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
            onConfirmChange={confirmChangeAgeGroup}
          />
          <span className="text-border hidden sm:inline" aria-hidden="true">·</span>
          <GameCountSelector
            numberOfGames={numberOfGames}
            minGames={MIN_GAMES}
            maxGames={MAX_GAMES}
            onChangeGames={changeNumberOfGames}
            onConfirmChange={confirmChangeNumberOfGames}
          />
        </div>

        <PlayerManagement
          players={players}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onSetExperienceLevel={setExperienceLevel}
          getPlayerHalfCount={getPlayerHalfCount}
          minimumHalves={getMinimumHalves()}
          fairShare={getFairShare()}
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
          isAssigned={isAssigned}
          toggleAssignment={toggleAssignment}
          getHalfCount={getHalfCount}
          getExperienceBalance={getExperienceBalance}
          clearHalf={clearHalf}
          clearGame={clearGame}
          gameLabels={gameLabels}
          updateGameLabel={updateGameLabel}
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
