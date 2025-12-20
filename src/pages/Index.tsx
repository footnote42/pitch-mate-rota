import { useRotationState } from '@/hooks/useRotationState';
import { Header } from '@/components/Header';
import { PlayerManagement } from '@/components/PlayerManagement';
import { RotationGrid } from '@/components/RotationGrid';
import { GameCountSelector } from '@/components/GameCountSelector';
import { AgeGroupSelector } from '@/components/AgeGroupSelector';

const Index = () => {
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
  } = useRotationState();

  return (
    <div className="min-h-screen bg-background">
      <Header
        lastSaved={lastSaved}
        onClearAll={clearAllAssignments}
        onResetAll={resetAll}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <AgeGroupSelector
            ageGroup={ageGroup}
            onChangeAgeGroup={changeAgeGroup}
            onConfirmChange={confirmChangeAgeGroup}
          />
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

        {players.length > 0 && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Festival Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Players:</span>
                <span className="ml-2 font-medium text-foreground">{players.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Minimum Halves:</span>
                <span className="ml-2 font-medium text-foreground">{getMinimumHalves()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fair Share:</span>
                <span className="ml-2 font-medium text-foreground">{getFairShare()} halves</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
