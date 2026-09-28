import { useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Info, Undo2 } from 'lucide-react';
import { Action, Assessment, Half, halfKey, MAX_RUN, PlayerAssessment, State, toHalves } from '@/rota';
import { SharePlan } from './SharePlan';
import { presenceLabel } from './presence';

const LEVEL = { 1: 'N', 2: 'I', 3: 'E' } as const;
const HALVES: Half[] = [1, 2];
const halfName = (h: Half) => (h === 1 ? '1st' : '2nd');

const watchLabel = (p: PlayerAssessment) => (p.status === 'impossible' ? 'Short' : p.status === 'tight' ? 'Tight' : null);

const Flag = ({ children }: { children: React.ReactNode }) => <span className="flag">{children}</span>;

// One tick per half of the minimum planned, "+n" beyond it.
const Ticks = ({ planned, minimum }: { planned: number; minimum: number }) => (
  <span className="ticks" title={`${planned} of ${minimum} halves`}>
    {Array.from({ length: minimum }, (_, i) => (
      <i key={i} className={i < planned ? 'f' : undefined} />
    ))}
    {planned > minimum && <span>+{planned - minimum}</span>}
  </span>
);

interface PlanTabProps {
  state: State;
  assessment: Assessment;
  dispatch: (action: Action) => void;
  undo: () => void;
  canUndo: boolean;
  onGoTo: (tab: 'squad' | 'guide') => void;
}

export const PlanTab = ({ state, assessment, dispatch, undo, canUndo, onGoTo }: PlanTabProps) => {
  const { squad, festival } = state;
  const [view, setView] = useState<'game' | 'overview'>('game');
  const [game, setGame] = useState(1);
  const carousel = useRef<HTMLDivElement>(null);

  if (squad.length === 0) {
    return (
      <div className="page">
        <div className="head"><h1>Plan</h1></div>
        <div className="empty">
          <h2>Add your squad first</h2>
          <p>Once your players are in, pick who plays each half of each game here.</p>
          <button className="go" onClick={() => onGoTo('squad')}>Go to Squad</button>
          <button className="linkish" onClick={() => onGoTo('guide')}>How a festival day works</button>
        </div>
      </div>
    );
  }

  const minimum = toHalves(assessment.minimum);
  const players = squad.map(p => ({ player: p, a: assessment.players[p.id] }));
  const watch = players.filter(({ a }) => a.status === 'tight' || a.status === 'impossible').length;
  const onTrack = squad.length - watch;
  const isPicked = (playerId: string, g: number, h: Half) =>
    festival.picks.some(k => k.playerId === playerId && k.game === g && k.half === h);
  const games = Array.from({ length: festival.games }, (_, i) => i + 1);

  const goTo = (g: number) => {
    const el = carousel.current;
    if (el) el.scrollTo({ left: (g - 1) * el.clientWidth, behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = carousel.current;
    if (!el) return;
    const g = Math.round(el.scrollLeft / el.clientWidth) + 1;
    if (g !== game) setGame(g);
  };
  const showView = (v: 'game' | 'overview') => {
    setView(v);
    // The carousel remounts at scroll 0; put it back on the current game.
    if (v === 'game') requestAnimationFrame(() => carousel.current?.scrollTo({ left: (game - 1) * carousel.current.clientWidth }));
  };

  const capFlags = assessment.flags.filter(f => f.kind === 'halfOverCap' || f.kind === 'dayOverCap');

  return (
    <>
      <div className="bar">
        <div className="bar-top">
          <div className="toggle" role="group" aria-label="Plan view">
            <button aria-pressed={view === 'game'} onClick={() => showView('game')}>Game</button>
            <button aria-pressed={view === 'overview'} onClick={() => showView('overview')}>Overview</button>
          </div>
          <button className="iconbtn undo" onClick={undo} disabled={!canUndo} aria-label="Undo last change" title="Undo">
            <Undo2 size={22} strokeWidth={2} aria-hidden="true" />
          </button>
          <SharePlan state={state} />
        </div>
        <div className="hgr">
          <span>
            Half Game Rule: <b>{onTrack}</b> of {squad.length} on track for{' '}
            <span className="nowrap">
              {minimum} halves{assessment.minimumMinutes !== null && ` (${assessment.minimumMinutes} min)`}
            </span>
          </span>
          {watch > 0 ? <Flag>{watch} to watch</Flag> : <span className="ok"><Check size={16} strokeWidth={2.6} aria-label="All on track" /></span>}
        </div>
        {view === 'game' && (
          <div className="pager">
            <button className="iconbtn" onClick={() => goTo(game - 1)} disabled={game === 1} aria-label="Previous game">
              <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <div>
              <h2>
                Game {game}
                <small>
                  {festival.labels[game] ? `${festival.labels[game]} · ` : ''}of {festival.games}
                  {game < festival.games ? ' · swipe for the next' : ''}
                </small>
              </h2>
              <div className="dots" aria-hidden="true">
                {games.map(g => <i key={g} className={g === game ? 'on' : undefined} />)}
              </div>
            </div>
            <button className="iconbtn" onClick={() => goTo(game + 1)} disabled={game === festival.games} aria-label="Next game">
              <ChevronRight size={24} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {view === 'game' ? (
        <div className="carousel" ref={carousel} onScroll={onScroll}>
          {games.map(g => (
            <section key={g} className="gpage" aria-label={`Game ${g}`}>
              <div className="halves">
                {HALVES.map(h => {
                  const { count, capacity, balance } = assessment.halves[halfKey(g, h)];
                  return (
                    <div key={h} className="half">
                      <span className="t">{halfName(h)} half</span>
                      <span className="n">
                        {count}/{capacity}
                        <small>{count < capacity ? `${capacity - count} to pick` : 'full'}</small>
                      </span>
                      <span className="mix">{balance.mix[3]} Exp · {balance.mix[2]} Int · {balance.mix[1]} Nov</span>
                      {balance.verdict === 'light' && <Flag>Light on experience</Flag>}
                      {balance.verdict === 'heavy' && <Flag>Heavy on experience</Flag>}
                      {balance.verdict === 'ok' && <span className="ok"><Check size={16} strokeWidth={2.6} aria-hidden="true" />Balanced</span>}
                    </div>
                  );
                })}
              </div>

              <ul className="list">
                {players.map(({ player, a }) => {
                  const planned = toHalves(a.planned);
                  const label = watchLabel(a);
                  const here = g >= a.arrives && g <= a.leaves;
                  const away = presenceLabel(a, festival.games);
                  return (
                    <li key={player.id} className="row">
                      <span className="pname">
                        <span className="nm">{a.displayName}</span>
                        <span className="lvl" title={`Experience: ${LEVEL[player.experienceLevel]}`}>{LEVEL[player.experienceLevel]}</span>
                      </span>
                      <span className="meta">
                        <Ticks planned={planned} minimum={minimum} />
                        {label && <Flag>{label}</Flag>}
                        {a.longestRun > MAX_RUN && <Flag>{a.longestRun} in a row</Flag>}
                        {away && <span className="nowrap">{away}</span>}
                      </span>
                      {here ? <span className="picks">
                        {HALVES.map(h => {
                          const on = isPicked(player.id, g, h);
                          const full = assessment.halves[halfKey(g, h)].full;
                          return (
                            <button
                              key={h}
                              className="pick"
                              aria-pressed={on}
                              disabled={!on && full}
                              aria-label={`${player.name}, game ${g} ${h === 1 ? 'first' : 'second'} half`}
                              onClick={() => dispatch({ type: 'togglePick', playerId: player.id, game: g, half: h })}
                            >
                              {halfName(h)}
                            </button>
                          );
                        })}
                      </span> : <span className="picks away">{g < a.arrives ? 'Not here yet' : 'Gone'}</span>}
                    </li>
                  );
                })}
              </ul>
              {festival.picks.length === 0 && g === 1 && (
                <p className="hint">
                  Tap 1st or 2nd beside a player to put them in that half.{' '}
                  <button className="linkish" onClick={() => onGoTo('guide')}>How picking works</button>
                </p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="ov">
          {capFlags.length > 0 && (
            <div className="note" role="status">
              <Info size={20} strokeWidth={2} aria-hidden="true" />
              <span>
                <strong>Worth a look:</strong>{' '}
                {capFlags.map(f => (
                  <span key={f.kind} className="block">
                    {f.kind === 'halfOverCap'
                      ? `${f.halfLength}-minute halves are over the ${festival.ageGroup} maximum of ${f.cap}.`
                      : `The day totals ${f.totalMinutes} minutes, over the ${festival.ageGroup} maximum of ${f.cap}.`}
                  </span>
                ))}
              </span>
            </div>
          )}
          <div className="table-wrap">
            <table aria-label="Festival overview">
              <thead>
                <tr>
                  <th />
                  {games.map(g => (
                    <th key={g} colSpan={2} className={g > 1 ? 'g2' : undefined}>G{g}</th>
                  ))}
                  <th />
                </tr>
                <tr>
                  <th className="nm">Player</th>
                  {games.flatMap(g => HALVES.map(h => (
                    <th key={`${g}-${h}`} className={g > 1 && h === 1 ? 'g2' : undefined}>{h}</th>
                  )))}
                  <th className="tot">Halves</th>
                </tr>
              </thead>
              <tbody>
                {players.map(({ player, a }) => {
                  const warn = a.status === 'tight' || a.status === 'impossible';
                  return (
                    <tr key={player.id}>
                      <td className="nm">{a.displayName}</td>
                      {games.flatMap(g => HALVES.map(h => {
                        const here = g >= a.arrives && g <= a.leaves;
                        return (
                          <td key={`${g}-${h}`} className={[g > 1 && h === 1 ? 'g2' : '', here ? '' : 'away'].join(' ').trim() || undefined}>
                            {isPicked(player.id, g, h) && <span className="c" aria-label="planned" />}
                            {!here && <span className="sr-only">not there</span>}
                          </td>
                        );
                      }))}
                      <td className={warn ? 'tot warn' : 'tot'}>
                        {toHalves(a.planned)}/{minimum}
                        {a.plannedMinutes !== null && <small>{a.plannedMinutes}m</small>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="nm">Picked</td>
                  {games.flatMap(g => HALVES.map(h => {
                    const { count, balance } = assessment.halves[halfKey(g, h)];
                    return (
                      <td key={`${g}-${h}`} className={[g > 1 && h === 1 ? 'g2' : '', balance.balanced ? '' : 'warn'].join(' ').trim() || undefined}>
                        {count}
                      </td>
                    );
                  }))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="key">
            <span><span className="c" />Planned</span>
            <span><span className="c away" />Not there</span>
            <span className="warn-text">Orange: worth a look</span>
          </div>
          <p>
            Read only. Tap Game to change picks. Orange totals are players who could miss {minimum} halves; orange
            counts are halves light or heavy on experience.
          </p>
        </div>
      )}

    </>
  );
};
