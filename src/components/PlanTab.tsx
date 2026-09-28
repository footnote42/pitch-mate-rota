import { useState } from 'react';
import { Check, Info, Shuffle, Undo2, Wand2 } from 'lucide-react';
import { Action, Assessment, canPlayHalf, gameRecord, Half, halfKey, halfOf, isRecorded, MAX_RUN, Pick, PlayerAssessment, State, toHalves } from '@/rota';
import { SharePlan } from './SharePlan';
import { presenceLabel } from './presence';
import { Flag, HalfGameRule, Pager, useGamePager } from './GamePager';

const LEVEL = { 1: 'N', 2: 'I', 3: 'E' } as const;
const HALVES: Half[] = [1, 2];
const halfName = (h: Half) => (h === 1 ? '1st' : '2nd');

const watchLabel = (p: PlayerAssessment) => (p.status === 'impossible' ? 'Short' : p.status === 'tight' ? 'Tight' : null);

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
  autoFill: () => void;
  shuffle: () => void;
  filled: Pick[] | null; // picks the last auto-fill added, outlined until the next change
  onGoTo: (tab: 'squad' | 'guide') => void;
}

export const PlanTab = ({ state, assessment, dispatch, undo, canUndo, autoFill, shuffle, filled, onGoTo }: PlanTabProps) => {
  const { squad, festival } = state;
  const [view, setView] = useState<'game' | 'overview'>('game');
  const { game, carousel, goTo, onScroll, restore } = useGamePager();

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
  const isPicked = (playerId: string, g: number, h: Half) =>
    festival.picks.some(k => k.playerId === playerId && k.game === g && k.half === h);
  const games = Array.from({ length: festival.games }, (_, i) => i + 1);
  const isNew = (playerId: string, g: number, h: Half) =>
    !!filled?.some(k => k.playerId === playerId && k.game === g && k.half === h);
  const allHalves = Object.values(assessment.halves).filter(h => !h.recorded); // recorded games are not planned into
  const openPlaces = allHalves.reduce((n, h) => n + h.capacity - h.count, 0);
  const toWatch =
    assessment.flags.filter(f => (f.kind === 'belowMinimum' && f.impossible) || f.kind === 'unbalanced' || f.kind === 'consecutive').length +
    allHalves.filter(h => !h.full).length;

  const showView = (v: 'game' | 'overview') => {
    setView(v);
    if (v === 'game') restore();
  };
  const recorded = (g: number) => isRecorded(festival, g);
  // Quarters a player played in a half of a recorded game (0-2).
  const playedIn = (playerId: string, g: number, h: Half) =>
    gameRecord(state, g).filter(q => q.playerId === playerId && halfOf(q.quarter) === h).length;

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
        <HalfGameRule assessment={assessment} players={squad.length} />
        {filled ? (
          <div className="fillbar" role="status">
            <span>
              <span>Filled <b>{filled.length}</b> {filled.length === 1 ? 'place' : 'places'}</span>
              {toWatch > 0 && <Flag>{toWatch} to watch</Flag>}
            </span>
            <button className="ghost" onClick={shuffle}>
              <Shuffle size={18} strokeWidth={2} aria-hidden="true" />Shuffle
            </button>
            <button className="ghost" onClick={undo}>Undo</button>
          </div>
        ) : (
          openPlaces > 0 && (
            <div className="fillbar">
              <span>{openPlaces} {openPlaces === 1 ? 'place' : 'places'} to fill</span>
              <button className="go" onClick={autoFill}>
                <Wand2 size={18} strokeWidth={2} aria-hidden="true" />Auto-fill
              </button>
            </div>
          )
        )}
        {view === 'game' && <Pager festival={festival} game={game} goTo={goTo} done={recorded} />}
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
              {recorded(g) && (
                <p className="hint">Game {g} is played: time counts from the record, not these picks.</p>
              )}

              <ul className="list">
                {players.map(({ player, a }) => {
                  const planned = toHalves(a.planned);
                  const label = watchLabel(a);
                  const out = festival.removals[player.id];
                  const here = g >= a.arrives && g <= a.leaves && !(out && g > out.game);
                  const away = out ? 'Out for the day' : presenceLabel(a, festival.games);
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
                              className={isNew(player.id, g, h) ? 'pick new' : 'pick'}
                              aria-pressed={on}
                              disabled={!on && (full || !canPlayHalf(festival, player.id, g, h))}
                              aria-label={`${player.name}, game ${g} ${h === 1 ? 'first' : 'second'} half`}
                              onClick={() => dispatch({ type: 'togglePick', playerId: player.id, game: g, half: h })}
                            >
                              {halfName(h)}
                            </button>
                          );
                        })}
                      </span> : <span className="picks away">{out ? 'Out' : g < a.arrives ? 'Not here yet' : 'Gone'}</span>}
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
                    <th key={g} colSpan={2} className={g > 1 ? 'g2' : undefined}>
                      G{g}
                      {recorded(g) && <Check className="done" size={13} strokeWidth={3} aria-label="played" />}
                    </th>
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
                        const q = recorded(g) ? playedIn(player.id, g, h) : 0;
                        return (
                          <td key={`${g}-${h}`} className={[g > 1 && h === 1 ? 'g2' : '', here ? '' : 'away'].join(' ').trim() || undefined}>
                            {recorded(g)
                              ? q > 0 && <span className={q === 1 ? 'c part' : 'c'} aria-label={q === 1 ? 'played a quarter' : 'played'} />
                              : isPicked(player.id, g, h) && <span className={isNew(player.id, g, h) ? 'c new' : 'c'} aria-label="planned" />}
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
            {games.some(recorded) && <span><span className="c part" />One quarter</span>}
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
