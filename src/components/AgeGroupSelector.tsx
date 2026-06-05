import { useState } from 'react';
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
import { AgeGroup, AGE_GROUP_CONFIGS } from '@/types/ageGroup';

interface AgeGroupSelectorProps {
  ageGroup: AgeGroup;
  onChangeAgeGroup: (ageGroup: AgeGroup) => boolean;
  onConfirmChange: (ageGroup: AgeGroup) => void;
}

const displayFont = '"Big Shoulders Display", system-ui, sans-serif';

export const AgeGroupSelector = ({
  ageGroup,
  onChangeAgeGroup,
  onConfirmChange,
}: AgeGroupSelectorProps) => {
  const [pendingChange, setPendingChange] = useState<AgeGroup | null>(null);

  const handleValueChange = (value: string) => {
    const newAgeGroup = value as AgeGroup;
    const success = onChangeAgeGroup(newAgeGroup);
    if (!success) setPendingChange(newAgeGroup);
  };

  const confirmChange = () => {
    if (pendingChange !== null) {
      onConfirmChange(pendingChange);
      setPendingChange(null);
    }
  };

  const ageGroups: AgeGroup[] = ['U7', 'U8', 'U9', 'U10', 'U11', 'U12'];

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className="text-[0.62rem] font-semibold uppercase text-muted-foreground whitespace-nowrap"
          style={{ letterSpacing: '0.15em', fontFamily: displayFont }}
        >
          Age Group
        </span>
        <Select value={ageGroup} onValueChange={handleValueChange}>
          <SelectTrigger id="age-group" className="w-[130px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ageGroups.map(ag => (
              <SelectItem key={ag} value={ag}>
                {AGE_GROUP_CONFIGS[ag].displayLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={pendingChange !== null} onOpenChange={(open) => !open && setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change age group?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the number of players on field will clear all current player assignments.
              Your player list and team/time labels will be kept.
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
