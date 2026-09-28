import { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import { Action, matchSquad, parseSquad } from '@/rota';
import { Player } from '@/types/rotation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Paste the squad-selection message, check who it found, then merge. Nothing changes until Add.
export const ImportSquad = ({ squad, dispatch }: { squad: Player[]; dispatch: (action: Action) => void }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const { fresh, existing } = matchSquad(squad, parseSquad(text));

  const close = () => {
    setOpen(false);
    setText('');
  };
  const add = () => {
    dispatch({ type: 'addPlayers', players: fresh.map(name => ({ id: crypto.randomUUID(), name })) });
    close();
  };

  return (
    <>
      <button className="ghost" onClick={() => setOpen(true)}>
        <ClipboardPaste size={18} strokeWidth={2} aria-hidden="true" />
        Paste a squad message
      </button>
      <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : close())}>
        <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-md rounded-xl">
          <DialogHeader className="text-left">
            <DialogTitle>Paste a squad message</DialogTitle>
            <DialogDescription>One name per line, straight from WhatsApp. Headers, numbers and emoji are skipped.</DialogDescription>
          </DialogHeader>
          <textarea
            className="field paste"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={'Alfie Hill\nAva Jones\nBen Cole'}
            aria-label="Squad message"
            rows={6}
          />
          {text.trim() && (
            <div className="found" aria-live="polite">
              {fresh.length > 0 ? (
                <p><b>{fresh.length} new:</b> {fresh.join(', ')}</p>
              ) : (
                <p>No new names found.</p>
              )}
              {existing.length > 0 && <p className="hint">Already in the squad: {existing.join(', ')}</p>}
            </div>
          )}
          <div className="sheet-actions">
            <button className="go" onClick={add} disabled={fresh.length === 0}>
              {fresh.length > 0 ? `Add ${fresh.length} ${fresh.length === 1 ? 'player' : 'players'}` : 'Add players'}
            </button>
            <p className="hint">New players start as Intermediate; change their level in the list.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
