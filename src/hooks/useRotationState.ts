import { useEffect, useReducer, useState } from 'react';
import { Action, addedPicks, Pick, reduce, State } from '@/rota';
import { BACKUP_KEY, deserialize, LEGACY_KEYS, serialize, STORAGE_KEY } from '@/rota/storage';

interface History {
  state: State;
  previous: State | null;
  filled: Pick[] | null; // picks the last auto-fill added, until the next change
}

type HistoryAction = Action | { type: 'undo' };

function historyReducer(history: History, action: HistoryAction): History {
  if (action.type === 'undo') {
    return history.previous ? { state: history.previous, previous: null, filled: null } : history;
  }
  const next = reduce(history.state, action);
  if (next === history.state) return history;
  return { state: next, previous: history.state, filled: action.type === 'autoFill' ? addedPicks(history.state, next) : null };
}

function load(): { history: History; recovered: boolean } {
  const { state, backup } = deserialize(key => localStorage.getItem(key));
  if (backup !== null) localStorage.setItem(BACKUP_KEY, backup);
  return { history: { state, previous: null, filled: null }, recovered: backup !== null };
}

const newSeed = () => 1 + Math.floor(Math.random() * 2 ** 30);

// React glue for the rota module: state, localStorage and one-step undo.
export const useRotationState = () => {
  const [loaded] = useState(load);
  const [history, dispatch] = useReducer(historyReducer, loaded.history);
  const [lastSaved, setLastSaved] = useState(new Date());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serialize(history.state));
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    setLastSaved(new Date());
  }, [history.state]);

  return {
    state: history.state,
    dispatch: dispatch as (action: Action) => void,
    // Dry run: what the state would be, without committing it.
    preview: (action: Action) => reduce(history.state, action),
    undo: () => dispatch({ type: 'undo' }),
    canUndo: history.previous !== null,
    autoFill: () => dispatch({ type: 'autoFill', seed: 0 }), // seed 0: ties go to squad order
    // Shuffle: undo the fill, then fill the same empty places with a new seed.
    shuffle: () => {
      dispatch({ type: 'undo' });
      dispatch({ type: 'autoFill', seed: newSeed() });
    },
    filled: history.filled,
    recovered: loaded.recovered, // saved data was unreadable and kept under BACKUP_KEY
    lastSaved,
  };
};
