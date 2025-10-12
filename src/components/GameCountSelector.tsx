import React, { useState } from 'react';
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
  onChangeGames: (count: number) => boolean;
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

  const handleValueChange = (value: string) => {
    const newCount = parseInt(value, 10);
    const success = onChangeGames(newCount);
    
    if (!success) {
      // Show confirmation dialog
      setPendingChange(newCount);
    }
  };

  const confirmChange = () => {
    if (pendingChange !== null) {
      onConfirmChange(pendingChange);
      setPendingChange(null);
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
            <AlertDialogTitle>Change number of games?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the number of games will clear all current player assignments. Your player list will be kept. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange}>
              Clear Assignments and Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
