import { useState, useEffect } from 'react';
import { useRotationState } from '@/hooks/useRotationState';
import { assess } from '@/rota';
import { AGE_GROUP_CONFIGS } from '@/types/ageGroup';
import { AppHeader } from '@/components/AppHeader';
import { TabBar, Tab } from '@/components/TabBar';
import { SquadTab } from '@/components/SquadTab';
import { PlanTab } from '@/components/PlanTab';
import { useToast } from '@/hooks/use-toast';

const RFU_LINKS = [
  {
    href: 'https://rfu.widen.net/s/fcvtlrnlqb/rfu-regulation-15-2026-27',
    title: 'RFU Regulation 15: Age Grade Rugby',
    note: '2026-27 season (PDF)',
  },
  {
    href: 'https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby',
    title: 'Rules of Play for age grade rugby',
    note: '2026-27 season, U7 to U12 appendices',
  },
];

const readDark = () => document.documentElement.dataset.theme === 'dark';

const Index = () => {
  const [tab, setTab] = useState<Tab>('squad');
  const [dark, setDark] = useState(readDark);
  const [celebrationShown, setCelebrationShown] = useState<string | null>(null);
  const { toast } = useToast();
  const { state, dispatch, preview, undo, canUndo, recovered } = useRotationState();
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
          <PlanTab state={state} assessment={assessment} dispatch={dispatch} undo={undo} canUndo={canUndo} onGoTo={setTab} />
        )}

        {tab === 'record' && (
          <div className="page">
            <div className="head"><h1>Record</h1></div>
            <div className="empty">
              <h2>Record who actually played</h2>
              <p>
                Pitchside, you will mark who played each quarter, side by side with the plan. The plan itself never
                changes. Recording arrives in a later update.
              </p>
              <button className="linkish" onClick={() => setTab('plan')}>Back to the plan</button>
            </div>
          </div>
        )}

        {tab === 'guide' && (
          <div className="page">
            <div className="head"><h1>Guide</h1></div>
            <p>
              Every player must play at least half of the day's total playing time: the RFU Half Game Rule. This app
              counts it for you across every game of the festival.
            </p>
            <p className="hint">The full guide is being written. Until then, go to the source:</p>
            <ul className="links">
              {RFU_LINKS.map(l => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.title}
                  </a>
                  <small>{l.note}</small>
                </li>
              ))}
            </ul>
            <p className="hint">The RFU regulations are the authority; this app helps you follow them.</p>
          </div>
        )}
      </main>

      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
};

export default Index;
