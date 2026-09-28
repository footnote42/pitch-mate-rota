import { useEffect, useReducer, useState } from 'react';
import { Action, reduce, State } from '@/rota';
import { BACKUP_KEY, deserialize, LEGACY_KEYS, serialize, STORAGE_KEY } from '@/rota/storage';

interface History {
  state: State;
  previous: State | null;
}

type HistoryAction = Action | { type: 'undo' };

function historyReducer(history: History, action: HistoryAction): History {
  if (action.type === 'undo') {
    return history.previous ? { state: history.previous, previous: null } : history;
  }
  const next = reduce(history.state, action);
  return next === history.state ? history : { state: next, previous: history.state };
}

function load(): { history: History; recovered: boolean } {
  const { state, backup } = deserialize(key => localStorage.getItem(key));
  if (backup !== null) localStorage.setItem(BACKUP_KEY, backup);
  return { history: { state, previous: null }, recovered: backup !== null };
}

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
    recovered: loaded.recovered, // saved data was unreadable and kept under BACKUP_KEY
    lastSaved,
  };
};
