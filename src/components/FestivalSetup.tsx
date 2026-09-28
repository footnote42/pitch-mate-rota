import { useState } from 'react';
import { Info } from 'lucide-react';
import { Action, Assessment, MAX_GAMES, MIN_GAMES, State } from '@/rota';
import { AgeGroup, AGE_GROUP_CONFIGS } from '@/types/ageGroup';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AGE_GROUPS = Object.keys(AGE_GROUP_CONFIGS) as AgeGroup[];
const GAME_COUNTS = Array.from({ length: MAX_GAMES - MIN_GAMES + 1 }, (_, i) => MIN_GAMES + i);

interface FestivalSetupProps {
  state: State;
  assessment: Assessment;
  dispatch: (action: Action) => void;
  preview: (action: Action) => State;
}

export const FestivalSetup = ({ state, assessment, dispatch, preview }: FestivalSetupProps) => {
  const { festival } = state;
  const config = AGE_GROUP_CONFIGS[festival.ageGroup];
  const [pending, setPending] = useState<{ action: Action; title: string; body: string } | null>(null);
  const [minutes, setMinutes] = useState(festival.halfLength?.toString() ?? '');
  // Keep the box in step when a new festival clears the half length.
  if (festival.halfLength === null && minutes !== '' && Number(minutes) > 0) setMinutes('');

  // Dry run the change; confirm first if it would drop picks.
  const change = (action: Action, title: string, describe: (droppedGames: number[]) => string) => {
    const kept = preview(action).festival.picks;
    const dropped = festival.picks.filter(p => !kept.includes(p));
    if (dropped.length === 0) return dispatch(action);
    const games = [...new Set(dropped.map(p => p.game))].sort((a, b) => a - b);
    setPending({ action, title, body: describe(games) });
  };

  const setAgeGroup = (ageGroup: AgeGroup) =>
    change({ type: 'setAgeGroup', ageGroup }, `Change to ${ageGroup}?`, () =>
      `${ageGroup} plays ${AGE_GROUP_CONFIGS[ageGroup].playersOnField} a side, so the plan is cleared. The squad and game labels stay.`);

  const setGames = (games: number) =>
    change({ type: 'setGames', games }, `Change to ${games} games?`, dropped =>
      `${dropped.length === 1 ? `Game ${dropped[0]} has` : `Games ${dropped.join(', ')} have`} picks that will be removed. Every other pick stays.`);

  const commitMinutes = (text: string) => {
    setMinutes(text);
    const n = Number(text);
    dispatch({ type: 'setHalfLength', minutes: text.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : null });
  };

  const capFlags = assessment.flags.filter(f => f.kind === 'halfOverCap' || f.kind === 'dayOverCap');

  return (
    <section className="form" aria-labelledby="festival-title">
      <h2 className="section-title" id="festival-title">Festival</h2>

      <div className="pair">
        <label className="label">
          Age group
          <select className="field" value={festival.ageGroup} onChange={e => setAgeGroup(e.target.value as AgeGroup)}>
            {AGE_GROUPS.map(ag => (
              <option key={ag} value={ag}>
                {ag} · {AGE_GROUP_CONFIGS[ag].playersOnField} a side
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Games
          <select className="field" value={festival.games} onChange={e => setGames(Number(e.target.value))}>
            {GAME_COUNTS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="label">
        Minutes per half <small>Optional. {festival.ageGroup} maximum: {config.halfCapMinutes} a half, {config.dayCapMinutes} a day.</small>
        <input
          className="field"
          type="number"
          inputMode="numeric"
          min={1}
          max={40}
          placeholder={`Up to ${config.halfCapMinutes}`}
          value={minutes}
          onChange={e => commitMinutes(e.target.value)}
        />
      </label>

      {capFlags.length > 0 && (
        <div className="note" role="status">
          <Info size={20} strokeWidth={2} aria-hidden="true" />
          <span>
            <strong>Worth a look:</strong>{' '}
            {capFlags.map(f => (
              <span key={f.kind} className="block">
                {f.kind === 'halfOverCap'
                  ? `${f.halfLength}-minute halves are over the ${festival.ageGroup} maximum of ${f.cap}.`
                  : `${festival.games} games of ${festival.halfLength}-minute halves make ${f.totalMinutes} minutes, over the ${festival.ageGroup} day maximum of ${f.cap}.`}
              </span>
            ))}
            <span className="block">Check with the organiser.</span>
          </span>
        </div>
      )}

      <div className="labels" role="group" aria-label="Game labels">
        <span className="label">Opponent or kick-off <small>Shown on the plan and the shared message.</small></span>
        {Array.from({ length: festival.games }, (_, i) => i + 1).map(game => (
          <label key={game}>
            Game {game}
            <input
              className="field"
              value={festival.labels[game] ?? ''}
              onChange={e => dispatch({ type: 'setLabel', game, label: e.target.value })}
              placeholder="e.g. Tigers 10:00"
              autoComplete="off"
            />
          </label>
        ))}
      </div>

      <AlertDialog open={!!pending} onOpenChange={o => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pending?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[48px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[48px]"
              onClick={() => {
                if (pending) dispatch(pending.action);
                setPending(null);
              }}
            >
              Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
