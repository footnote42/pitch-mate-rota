import { FormEvent, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Action, Assessment, gameNumbers, State, toHalves } from '@/rota';
import { ExperienceLevel, EXPERIENCE_LABELS, Player } from '@/types/rotation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FestivalSetup } from './FestivalSetup';
import { availabilityLabel } from './availability';
import { ImportSquad } from './ImportSquad';

const LEVELS: [ExperienceLevel, string][] = [[1, 'N'], [2, 'I'], [3, 'E']];
const MAX_NAME = 50;

const nameError = (name: string) =>
  !name.trim() ? 'Type a name first.' : name.trim().length > MAX_NAME ? `Keep names under ${MAX_NAME} letters.` : null;

const LevelPicker = ({ name, level, onChange }: { name: string; level: ExperienceLevel; onChange: (l: ExperienceLevel) => void }) => (
  <span className="seg" role="group" aria-label={`${name} experience`}>
    {LEVELS.map(([l, short]) => (
      <button key={l} type="button" aria-pressed={level === l} aria-label={EXPERIENCE_LABELS[l]} title={EXPERIENCE_LABELS[l]} onClick={() => onChange(l)}>
        {short}
      </button>
    ))}
  </span>
);

interface SquadTabProps {
  state: State;
  assessment: Assessment;
  dispatch: (action: Action) => void;
  preview: (action: Action) => State;
  onOpenGuide: () => void;
}

export const SquadTab = ({ state, assessment, dispatch, preview, onOpenGuide }: SquadTabProps) => {
  const { squad } = state;
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Player | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const add = (e: FormEvent) => {
    e.preventDefault();
    const problem = nameError(name);
    setError(problem);
    if (problem) return;
    dispatch({ type: 'addPlayer', id: crypto.randomUUID(), name, experienceLevel: 2 });
    setName('');
    input.current?.focus();
  };

  const minimum = toHalves(assessment.minimum);

  return (
    <div className="page">
      <div className="head">
        <h1>Squad</h1>
        <span>{squad.length === 1 ? '1 player' : `${squad.length} players`}</span>
      </div>

      <form className="add" onSubmit={add} noValidate>
        <input
          ref={input}
          className="field"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Player name"
          aria-label="Player name"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'name-error' : undefined}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
        />
        <button className="go" type="submit">Add</button>
      </form>
      {error && <p className="error" id="name-error" role="alert">{error}</p>}
      <ImportSquad squad={squad} dispatch={dispatch} />

      {squad.length === 0 ? (
        <div className="empty">
          <h2>Add your players</h2>
          <p>
            Type each name and tap Add, or paste the squad message. Then set each player as Novice, Intermediate or
            Experienced, so every half gets a fair mix.
          </p>
          <button className="linkish" onClick={onOpenGuide}>How a festival day works</button>
        </div>
      ) : (
        <>
          <p className="legend">Novice · Intermediate · Experienced</p>
          <ul className="list">
            {squad.map(p => {
              const a = assessment.players[p.id];
              const counted = toHalves(a?.counted ?? 0);
              const away = a && availabilityLabel(a, state.festival.games);
              return (
                <li key={p.id} className="row">
                  <button className="who" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                    <span>{p.name}</span>
                    <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <span className="when">{counted} of {minimum} halves</span>
                  {away && <span className="when away">{away}</span>}
                  <LevelPicker
                    name={p.name}
                    level={p.experienceLevel}
                    onChange={level => dispatch({ type: 'setExperienceLevel', playerId: p.id, level })}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}

      <FestivalSetup state={state} assessment={assessment} dispatch={dispatch} preview={preview} />

      <EditPlayer
        player={editing}
        state={state}
        onClose={() => setEditing(null)}
        dispatch={dispatch}
        preview={preview}
      />
    </div>
  );
};

interface EditPlayerProps {
  player: Player | null;
  state: State;
  onClose: () => void;
  dispatch: (action: Action) => void;
  preview: (action: Action) => State;
}

const EditPlayer = ({ player, state, onClose, dispatch, preview }: EditPlayerProps) => {
  const { festival } = state;
  const games = gameNumbers(festival);
  const pickCount = player ? festival.picks.filter(k => k.playerId === player.id).length : 0;
  const [name, setName] = useState('');
  const [level, setLevel] = useState<ExperienceLevel>(2);
  const [arrives, setArrives] = useState(1);
  const [leaves, setLeaves] = useState(1);
  const [removing, setRemoving] = useState(false);
  const [clearing, setClearing] = useState(false); // confirming picks outside the new availability
  const [error, setError] = useState<string | null>(null);

  const open = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };
  // Reset the form each time a player is opened.
  const [shownFor, setShownFor] = useState<string | null>(null);
  if (player && shownFor !== player.id) {
    setShownFor(player.id);
    setName(player.name);
    setLevel(player.experienceLevel);
    setArrives(festival.availability[player.id]?.arrives ?? 1);
    setLeaves(festival.availability[player.id]?.leaves ?? festival.games);
    setRemoving(false);
    setClearing(false);
    setError(null);
  }
  if (!player && shownFor !== null) setShownFor(null);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const problem = nameError(name);
    setError(problem);
    if (problem || !player) return;
    if (dropped > 0) return setClearing(true);
    commit();
  };
  const commit = () => {
    dispatch({ type: 'renamePlayer', playerId: player.id, name });
    dispatch({ type: 'setExperienceLevel', playerId: player.id, level });
    dispatch(availability);
    onClose();
  };

  const availability: Action = { type: 'setAvailability', playerId: player?.id, arrives, leaves };
  const kept = player ? preview(availability).festival.picks.filter(k => k.playerId === player.id).length : 0;
  const dropped = pickCount - kept;

  const remove = () => {
    if (player) dispatch({ type: 'removePlayer', playerId: player.id });
    onClose();
  };

  return (
    <Dialog open={!!player} onOpenChange={open}>
      <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-md rounded-xl">
        {clearing ? (
          <>
            <DialogHeader className="text-left">
              <DialogTitle>Clear {dropped === 1 ? '1 pick' : `${dropped} picks`}?</DialogTitle>
              <DialogDescription>
                {player?.name} is picked for {dropped === 1 ? 'a half' : `${dropped} halves`} outside these games. Saving
                clears {dropped === 1 ? 'it' : 'them'}.
              </DialogDescription>
            </DialogHeader>
            <div className="sheet-actions">
              <button className="go" onClick={commit}>Save and clear</button>
              <button className="ghost" onClick={() => setClearing(false)}>Back</button>
            </div>
          </>
        ) : removing ? (
          <>
            <DialogHeader className="text-left">
              <DialogTitle>Remove {player?.name}?</DialogTitle>
              <DialogDescription>
                {pickCount > 0
                  ? `They come out of the squad and the ${pickCount === 1 ? 'half' : `${pickCount} halves`} they are picked for.`
                  : 'They come out of the squad on this phone.'}
              </DialogDescription>
            </DialogHeader>
            <div className="sheet-actions">
              <button className="go" onClick={remove}>Remove</button>
              <button className="ghost" onClick={() => setRemoving(false)}>Keep {player?.name}</button>
            </div>
          </>
        ) : (
          <form className="form" onSubmit={save} noValidate>
            <DialogHeader className="text-left">
              <DialogTitle>Edit player</DialogTitle>
              <DialogDescription>Name, experience and which games they are here for.</DialogDescription>
            </DialogHeader>
            <label className="label">
              Name
              <input
                className="field"
                value={name}
                onChange={e => setName(e.target.value)}
                aria-invalid={error ? true : undefined}
                autoComplete="off"
                autoCapitalize="words"
              />
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="label">
              Experience
              <LevelPicker name={name || 'Player'} level={level} onChange={setLevel} />
            </div>
            <div className="pair">
              <label className="label">
                Arrives for
                <select
                  className="field"
                  value={arrives}
                  onChange={e => {
                    const g = Number(e.target.value);
                    setArrives(g);
                    if (leaves < g) setLeaves(g);
                  }}
                >
                  {games.map(g => <option key={g} value={g}>Game {g}</option>)}
                </select>
              </label>
              <label className="label">
                Leaves after
                <select
                  className="field"
                  value={leaves}
                  onChange={e => {
                    const g = Number(e.target.value);
                    setLeaves(g);
                    if (arrives > g) setArrives(g);
                  }}
                >
                  {games.map(g => <option key={g} value={g}>Game {g}</option>)}
                </select>
              </label>
            </div>
            {dropped > 0 && (
              <p className="hint">
                {dropped === 1 ? '1 half they are picked for is' : `${dropped} halves they are picked for are`} outside
                these games and will be cleared.
              </p>
            )}
            <div className="sheet-actions">
              <button className="go" type="submit">Save</button>
              <button className="ghost" type="button" onClick={() => setRemoving(true)}>Remove from squad</button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
