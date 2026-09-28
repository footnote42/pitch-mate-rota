import { useState, useEffect } from 'react';
import { useRotationState } from '@/hooks/useRotationState';
import { assess } from '@/rota';
import { AGE_GROUP_CONFIGS } from '@/types/ageGroup';
import { AppHeader } from '@/components/AppHeader';
import { TabBar, Tab } from '@/components/TabBar';
import { SquadTab } from '@/components/SquadTab';
import { PlanTab } from '@/components/PlanTab';
import { RecordTab } from '@/components/RecordTab';
import { GuideTab } from '@/components/GuideTab';
import { UpdateBar } from '@/components/UpdateBar';
import { useToast } from '@/hooks/use-toast';

const readDark = () => document.documentElement.dataset.theme === 'dark';

const Index = () => {
  const [tab, setTab] = useState<Tab>('squad');
  const [dark, setDark] = useState(readDark);
  const [celebrationShown, setCelebrationShown] = useState<string | null>(null);
  const { toast } = useToast();
  const { state, dispatch, preview, undo, canUndo, autoFill, shuffle, filled, recovered } = useRotationState();
  const { festival } = state;
  const { games: numberOfGames, ageGroup, picks: assignments } = festival;
  const assessment = assess(state);
  const playersOnField = AGE_GROUP_CONFIGS[ageGroup].playersOnField;

  useEffect(() => {
    if (recovered) {
      toast({
        title: 'Saved data could not be read',
        description: 'Starting fresh. A copy of the old data was kept on this phone.',
      });
    }
  }, [recovered, toast]);

  useEffect(() => {
    const key = `${numberOfGames}-${assignments.length}`;
    if (assessment.complete && celebrationShown !== key) {
      toast({ title: 'Looking good, Coach!', description: 'Your squad is match-ready.', duration: 4000 });
      setCelebrationShown(key);
    } else if (!assessment.complete && celebrationShown) {
      setCelebrationShown(null);
    }
  }, [assessment.complete, numberOfGames, assignments.length, celebrationShown, toast]);

  const toggleDark = () => {
    const next = !dark;
    if (next) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* storage blocked: theme lasts this visit only */
    }
    setDark(next);
  };

  const minutes = festival.halfLength ? ` · ${festival.halfLength}-min halves` : '';

  return (
    <div className="shell">
      <AppHeader
        title={`${ageGroup} festival`}
        detail={`${numberOfGames} games · ${playersOnField} a side${minutes}`}
        dark={dark}
        onToggleDark={toggleDark}
        onNewFestival={keepSquad => dispatch({ type: 'newFestival', keepSquad })}
      />

      <main className="main" key={tab}>
        {tab === 'squad' && (
          <SquadTab state={state} assessment={assessment} dispatch={dispatch} preview={preview} onOpenGuide={() => setTab('guide')} />
        )}

        {tab === 'plan' && (
          <PlanTab state={state} assessment={assessment} dispatch={dispatch} undo={undo} canUndo={canUndo} autoFill={autoFill} shuffle={shuffle} filled={filled} onGoTo={setTab} />
        )}

        {tab === 'record' && <RecordTab state={state} assessment={assessment} dispatch={dispatch} onGoTo={setTab} />}

        {tab === 'guide' && <GuideTab />}
      </main>

      <UpdateBar />
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
};

export default Index;
