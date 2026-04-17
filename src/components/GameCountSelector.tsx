import React, { useState } from 'react';
import type { ChangeGamesResult } from '@/hooks/useRotationState';
import { Label } from '@/components/ui/label';
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

  const gameOptions = Array.from(
    { length: maxGames - minGames + 1 },
    (_, i) => minGames + i
  );

  return (
    <>
      <div className="flex items-center gap-3">
        <Label htmlFor="game-count" className="text-sm font-semibold text-foreground whitespace-nowrap">
          Number of Games in Festival:
        </Label>
        <Select value={numberOfGames.toString()} onValueChange={handleValueChange}>
          <SelectTrigger id="game-count" className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gameOptions.map(num => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'game' : 'games'}
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
              Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange}>
              Remove and Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
