import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2, HelpCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

interface HeaderProps {
  lastSaved: Date;
  onClearAll: () => void;
  onResetAll: () => void;
  onOpenTutorial?: () => void;
}

export const Header = ({ lastSaved, onClearAll, onResetAll, onOpenTutorial }: HeaderProps) => {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <header className="bg-primary border-b-[3px] border-trojans-gold">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">
              <img
                src="/trojans_logo.png"
                alt="Trojans RFC"
                className="h-11 w-11 sm:h-13 sm:w-13 object-contain flex-shrink-0"
              />
              <div>
                <div
                  className="text-primary-foreground uppercase leading-none tracking-wide"
                  style={{
                    fontFamily: '"Big Shoulders Display", system-ui, sans-serif',
                    fontSize: 'clamp(1.3rem, 4.5vw, 1.85rem)',
                    fontWeight: 900,
                  }}
                >
                  Trojans RFC
                </div>
                <div
                  className="text-primary-foreground/50 mt-0.5 uppercase"
                  style={{
                    fontFamily: '"Big Shoulders Display", system-ui, sans-serif',
                    fontSize: '0.58rem',
                    letterSpacing: '0.22em',
                    fontWeight: 600,
                  }}
                >
                  Pitch Mate · Rota
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="hidden lg:inline text-[0.62rem] text-primary-foreground/30 tracking-wide mr-2">
                Saved {formatLastSaved(lastSaved)}
              </span>
              {onOpenTutorial && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenTutorial}
                  className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:w-auto sm:px-3"
                  title="Help"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span
                    className="hidden sm:inline ml-1.5 text-[0.7rem] uppercase tracking-wider"
                    style={{ fontFamily: '"Big Shoulders Display", system-ui, sans-serif', fontWeight: 700 }}
                  >
                    Help
                  </span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:w-auto sm:px-3"
                title="New Festival"
              >
                <RotateCcw className="h-4 w-4" />
                <span
                  className="hidden sm:inline ml-1.5 text-[0.7rem] uppercase tracking-wider"
                  style={{ fontFamily: '"Big Shoulders Display", system-ui, sans-serif', fontWeight: 700 }}
                >
                  New Festival
                </span>
              </Button>
              <Button
                size="sm"
                onClick={() => setShowResetDialog(true)}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground h-9 w-9 sm:w-auto sm:px-3"
                title="Reset All"
              >
                <Trash2 className="h-4 w-4" />
                <span
                  className="hidden sm:inline ml-1.5 text-[0.7rem] uppercase tracking-wider"
                  style={{ fontFamily: '"Big Shoulders Display", system-ui, sans-serif', fontWeight: 700 }}
                >
                  Reset
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ready for a new festival?</AlertDialogTitle>
            <AlertDialogDescription>
              All game assignments will be cleared, but your squad stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onClearAll(); setShowClearDialog(false); }}>
              Clear Assignments
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset entire app?</AlertDialogTitle>
            <AlertDialogDescription>
              All players and assignments will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onResetAll(); setShowResetDialog(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
