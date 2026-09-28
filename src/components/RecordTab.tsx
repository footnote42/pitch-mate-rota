import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  absence, Action, Assessment, canTick, gameNumbers, halfOf, isRecorded, Quarter, QUARTERS, REMOVAL_REASONS, RemovalReason, State,
} from '@/rota';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pager, useGamePager } from './GamePager';
import { HalfGameRule } from './HalfGameRule';
import { ABSENCE_LABEL } from './availability';

const REASON_LABEL: Record<RemovalReason, string> = { injury: 'Injury', risk: 'Risk of injury', redCard: 'Red card' };

interface RecordTabProps {
  state: State;
  assessment: Assessment;
  dispatch: (action: Action) => void;
  onGoTo: (tab: 'squad' | 'plan') => void;
}

export const RecordTab = ({ state, assessment, dispatch, onGoTo }: RecordTabProps) => {
  const { squad, festival } = state;
  const games = gameNumbers(festival);
  // Opens on the first game not yet recorded.
  const [first] = useState(() => games.find(g => !isRecorded(festival, g)) ?? festival.games);
  const { game, carousel, goTo, onScroll, restore } = useGamePager(first);
  const [outFor, setOutFor] = useState<{ playerId: string; game: number } | null>(null);
  useEffect(() => {
    if (first > 1) restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on opening
  }, []);

  if (squad.length === 0) {
    return (
      <div className="page">
        <div className="head"><h1>Record</h1></div>
        <div className="empty">
          <h2>Add your squad first</h2>
          <p>Between games, you record who actually played each quarter here, starting from the plan.</p>
          <button className="go" onClick={() => onGoTo('squad')}>Go to Squad</button>
        </div>
      </div>
    );
  }

  const cap = assessment.capacity;
  const recorded = (g: number) => isRecorded(festival, g);
  const planned = (playerId: string, g: number, q: Quarter) =>
    festival.picks.some(k => k.playerId === playerId && k.game === g && k.half === halfOf(q));

  return (
    <>
      <div className="bar">
        <HalfGameRule assessment={assessment} players={squad.length} />
        <Pager festival={festival} game={game} goTo={goTo} recorded={recorded} />
      </div>

      <div className="carousel" ref={carousel} onScroll={onScroll}>
        {games.map(g => {
          const record = assessment.record[g];
          const inQuarter = (q: Quarter) => assessment.quarterCounts[g][q];
          const played = (playerId: string, q: Quarter) => record.some(r => r.playerId === playerId && r.quarter === q);
          return (
            <section key={g} className="gpage" aria-label={`Game ${g} record`}>
              <div className="qhead" aria-hidden="true">
                <span />
                {QUARTERS.map(q => (
                  <span key={q}>
                    Q{q}
                    <small className={inQuarter(q) < cap ? 'short' : undefined}>{inQuarter(q)}/{cap}</small>
                  </span>
                ))}
              </div>
              <ul className="list">
                {squad.map(p => {
                  const a = assessment.players[p.id];
                  const out = festival.removals[p.id];
                  const absent = absence(festival, p.id, g);
                  return (
                    <li key={p.id} className="row rrow">
                      <button className="who" onClick={() => setOutFor({ playerId: p.id, game: g })} aria-label={`${p.name}: out for the day`}>
                        <span>{a.displayName}</span>
                      </button>
                      <span className="when">
                        {out ? `Out: ${REASON_LABEL[out.reason].toLowerCase()}, game ${out.game} Q${out.quarter}` : absent ? ABSENCE_LABEL[absent] : ''}
                      </span>
                      <span className="quarters">
                        {QUARTERS.map(q => {
                          const on = played(p.id, q);
                          const plan = planned(p.id, g, q);
                          const cls = ['q', on && !plan ? 'extra' : '', !on && plan ? 'missed' : ''].filter(Boolean).join(' ');
                          return (
                            <button
                              key={q}
                              className={cls}
                              aria-pressed={on}
                              disabled={!on && !canTick(state, p.id, g, q)}
                              aria-label={`${p.name}, game ${g} quarter ${q}${plan ? ', planned' : ''}`}
                              onClick={() => dispatch({ type: 'toggleQuarter', playerId: p.id, game: g, quarter: q })}
                            />
                          );
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="key">
                <span><span className="q-key on" />Played</span>
                <span><span className="q-key on extra" />Not planned</span>
                <span><span className="q-key missed" />Planned, didn't play</span>
              </div>
              {recorded(g) ? (
                <div className="played">
                  <span className="ok"><Check size={16} strokeWidth={2.6} aria-hidden="true" />Game {g} played: time counts from this record</span>
                  <button className="linkish" onClick={() => dispatch({ type: 'setPlayed', game: g, played: false })}>Not played yet</button>
                </div>
              ) : (
                <>
                  <button className="go" onClick={() => dispatch({ type: 'setPlayed', game: g, played: true })}>Game {g} played</button>
                  <p className="hint">Ticked from the plan. Tap a quarter to change who actually played. The plan never changes.</p>
                </>
              )}
            </section>
          );
        })}
      </div>

      <OutForTheDay state={state} target={outFor} onClose={() => setOutFor(null)} dispatch={dispatch} />
    </>
  );
};

interface OutProps {
  state: State;
  target: { playerId: string; game: number } | null;
  onClose: () => void;
  dispatch: (action: Action) => void;
}

// Permanent removal: injury, risk of injury or a red card waives the Half Game Rule (Reg 15.13(5)).
const OutForTheDay = ({ state, target, onClose, dispatch }: OutProps) => {
  const [reason, setReason] = useState<RemovalReason>('injury');
  const [quarter, setQuarter] = useState<Quarter>(1);
  const player = target && state.squad.find(p => p.id === target.playerId);
  const current = player && state.festival.removals[player.id];

  const confirm = () => {
    if (player) dispatch({ type: 'removeForDay', playerId: player.id, reason, game: target.game, quarter });
    onClose();
  };

  return (
    <Dialog open={!!player} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-md rounded-xl">
        {current ? (
          <>
            <DialogHeader className="text-left">
              <DialogTitle>{player?.name} is out for the day</DialogTitle>
              <DialogDescription>
                {REASON_LABEL[current.reason]} in game {current.game}, quarter {current.quarter}. Their minimum is waived. To take
                it back straight away, use Undo.
              </DialogDescription>
            </DialogHeader>
            <div className="sheet-actions">
              <button
                className="ghost"
                onClick={() => {
                  dispatch({ type: 'cancelRemoval', playerId: player.id });
                  onClose();
                }}
              >
                Back in for later games
              </button>
              <p className="hint">Their minimum applies again. Picks and quarters already cleared stay cleared; add them back by hand.</p>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-left">
              <DialogTitle>{player?.name}: out for the day?</DialogTitle>
              <DialogDescription>
                For injury, risk of injury or a red card. Their later quarters and picks are cleared and the Half Game
                Rule no longer applies to them.
              </DialogDescription>
            </DialogHeader>
            <div className="label">
              Why
              <span className="seg wide" role="group" aria-label="Reason">
                {REMOVAL_REASONS.map(r => (
                  <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)}>{REASON_LABEL[r]}</button>
                ))}
              </span>
            </div>
            <div className="label">
              When, in game {target?.game}
              <span className="seg wide" role="group" aria-label="Quarter">
                {QUARTERS.map(q => (
                  <button key={q} type="button" aria-pressed={quarter === q} onClick={() => setQuarter(q)}>Q{q}</button>
                ))}
              </span>
            </div>
            <div className="sheet-actions">
              <button className="go" onClick={confirm}>Out for the day</button>
              <button className="ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
