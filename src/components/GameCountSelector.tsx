import React, { useState } from 'react';
import type { ChangeGamesResult } from '@/hooks/useRotationState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface GameCountSelectorProps {
  numberOfGames: number;
  minGames: number;
  maxGames: number;
  onChangeGames: (count: number) => ChangeGamesResult;
  onConfirmChange: (count: number) => void;
}

const displayFont = '"Big Shoulders Display", system-ui, sans-serif';

export const GameCountSelector = ({
  numberOfGames,
  minGames,
  maxGames,
  onChangeGames,
  onConfirmChange,
}: GameCountSelectorProps) => {
  const [pendingChange, setPendingChange] = useState<number | null>(null);
  const [affectedGames, setAffectedGames] = useState<number[]>([]);

  const handleValueChange = (value: string) => {
    const newCount = parseInt(value, 10);
    const result = onChangeGames(newCount);
    if (!result.proceed) {
      setAffectedGames(result.affectedGames);
      setPendingChange(newCount);
    }
  };

  const confirmChange = () => {
    if (pendingChange !== null) {
      onConfirmChange(pendingChange);
      setPendingChange(null);
      setAffectedGames([]);
    }
  };

  const gameOptions = Array.from({ length: maxGames - minGames + 1 }, (_, i) => minGames + i);

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className="text-[0.62rem] font-semibold uppercase text-muted-foreground whitespace-nowrap"
          style={{ letterSpacing: '0.15em', fontFamily: displayFont }}
        >
          Games in Festival
        </span>
        <Select value={numberOfGames.toString()} onValueChange={handleValueChange}>
          <SelectTrigger id="game-count" className="w-[90px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gameOptions.map(num => (
              <SelectItem key={num} value={num.toString()}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={pendingChange !== null} onOpenChange={(open) => !open && setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove games from festival?</AlertDialogTitle>
            <AlertDialogDescription>
              {affectedGames.length === 1
                ? `Game ${affectedGames[0]} has`
                : `Games ${affectedGames.join(', ')} have`}{' '}
              assignments that will be removed. All other assignments will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange}>Remove and Change</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
