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
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">Your Squad Planner</h1>
              <p className="text-sm text-primary-foreground/80 mt-0.5">
                Last saved: {formatLastSaved(lastSaved)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <img
                src="/trojans-badge.png"
                alt="Trojans FC Badge"
                className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain"
                title="Trojans FC"
              />
              <div className="flex gap-2">
                {onOpenTutorial && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenTutorial}
                    className="bg-primary-foreground/10 hover:bg-primary-foreground/20"
                    title="Show Tutorial"
                  >
                    <HelpCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Help</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowClearDialog(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Festival</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowResetDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Reset All</span>
                </Button>
              </div>
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
