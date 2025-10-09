import { useRotationState } from '@/hooks/useRotationState';
import { Header } from '@/components/Header';
import { PlayerManagement } from '@/components/PlayerManagement';
import { RotationGrid } from '@/components/RotationGrid';

const Index = () => {
  const {
    players,
    lastSaved,
    addPlayer,
    removePlayer,
    toggleExperience,
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
    PLAYERS_ON_FIELD,
    NUMBER_OF_GAMES,
  } = useRotationState();

  return (
    <div className="min-h-screen bg-background">
      <Header
        lastSaved={lastSaved}
        onClearAll={clearAllAssignments}
        onResetAll={resetAll}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <PlayerManagement
          players={players}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onToggleExperience={toggleExperience}
          getPlayerHalfCount={getPlayerHalfCount}
          minimumHalves={getMinimumHalves()}
          fairShare={getFairShare()}
        />

        <RotationGrid
          players={players}
          numberOfGames={NUMBER_OF_GAMES}
          playersOnField={PLAYERS_ON_FIELD}
          isAssigned={isAssigned}
          toggleAssignment={toggleAssignment}
          getHalfCount={getHalfCount}
          getExperienceBalance={getExperienceBalance}
          clearHalf={clearHalf}
          clearGame={clearGame}
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
