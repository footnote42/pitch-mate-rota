import { useState } from 'react';
import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Front-on H-posts, the rugby hub's mark, with hooped pads in club colours.
export const PostsMark = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <path d="M9 3v26M23 3v26M9 17h14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M9 22.5v2.2M23 22.5v2.2" stroke="var(--scarlet)" strokeWidth="5" />
    <path d="M9 24.7v2.2M23 24.7v2.2" stroke="var(--pad-blue)" strokeWidth="5" />
    <path d="M9 26.9v2.2M23 26.9v2.2" stroke="var(--gold)" strokeWidth="5" />
  </svg>
);

interface AppHeaderProps {
  title: string;
  detail: string;
  dark: boolean;
  onToggleDark: () => void;
  onNewFestival: (keepSquad: boolean) => void;
}

export const AppHeader = ({ title, detail, dark, onToggleDark, onNewFestival }: AppHeaderProps) => {
  const [confirming, setConfirming] = useState(false);

  const start = (keepSquad: boolean) => {
    onNewFestival(keepSquad);
    setConfirming(false);
  };

  return (
    <header className="top">
      <div className="brand">
        <PostsMark />
        <b>Rota</b>
      </div>
      <div className="fest">
        <strong>{title}</strong>
        {detail}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="iconbtn" aria-label="Festival menu">
          <Menu size={24} strokeWidth={1.8} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuItem className="min-h-[44px] text-base" onSelect={() => setConfirming(true)}>
            New festival
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-[44px] text-base" onSelect={onToggleDark}>
            {dark ? 'Light mode' : 'Dark mode'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Start a new festival?</AlertDialogTitle>
            <AlertDialogDescription>
              The plan, game labels and minutes per half are cleared. Keep the squad for another festival with the same
              players, or clear everything to remove every name from this phone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="sheet-actions">
            <button className="go" onClick={() => start(true)}>Keep squad</button>
            <button className="ghost" onClick={() => start(false)}>Clear everything</button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[48px]">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};
