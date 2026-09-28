import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { State } from '@/rota';
import { planMessage } from '@/rota/share';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// Read-only preview of the parents' message, copied to the clipboard. Names never go in a URL.
export const SharePlan = ({ state }: { state: State }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const message = open ? planMessage(state) : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast({ title: 'Copied', description: 'Paste it into the WhatsApp group.', duration: 3000 });
      setOpen(false);
    } catch {
      toast({ title: 'Could not copy', description: 'Press and hold the message to copy it instead.' });
    }
  };

  return (
    <>
      <button className="iconbtn" onClick={() => setOpen(true)} aria-label="Share the plan" title="Share">
        <Share2 size={22} strokeWidth={2} aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-md rounded-xl">
          <DialogHeader className="text-left">
            <DialogTitle>Share the plan</DialogTitle>
            <DialogDescription>For the parents' WhatsApp group. Edit it there if you need to.</DialogDescription>
          </DialogHeader>
          <pre className="message">{message}</pre>
          <div className="sheet-actions">
            <button className="go" onClick={copy}>Copy for WhatsApp</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
