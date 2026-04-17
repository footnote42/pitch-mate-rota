# Implementation Plan: Preserve Assignments When Changing Game Count

**Branch**: `001-preserve-assignments-on-game-change` | **Date**: 2026-04-17 | **Spec**: [spec.md](spec.md)

## Summary

Replace the current "clear all assignments on game count change" behaviour with a smart strategy: increases are silent and non-destructive; decreases only show a dialog when the removed games actually have assignments, and on confirm only those specific assignments are removed. All fairness calculations update automatically since they derive from `numberOfGames`.

## Technical Context

**Language/Version**: TypeScript (relaxed config — `noImplicitAny: false`, `strictNullChecks: false`)
**Primary Dependencies**: React 18, Vite, shadcn-ui, Tailwind CSS
**Storage**: localStorage (`squad-rotation-state`)
**Testing**: No automated infrastructure; manual UAT via quickstart.md
**Target Platform**: Mobile browser (pitchside), PWA
**Performance Goals**: Assignment toggle <50ms; no new re-render paths introduced
**Constraints**: Offline-first; no schema migration needed; change is backward compatible
**Scale/Scope**: Up to 20 players, 8 games, 16 halves

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — explicit types | PASS | New `ChangeGamesResult` discriminated union type added |
| I. Code Quality — function length | PASS | Both functions stay well under 50 lines |
| II. Testing Standards | PASS | Manual UAT scenarios in quickstart.md cover all acceptance criteria |
| III. UX Consistency — AlertDialog for destructive actions | PASS | Dialog retained for lossy decrease; removed only for safe changes |
| III. UX Consistency — 44×44px touch targets | PASS | No new interactive elements |
| IV. Performance | PASS | No new state, no new renders; filter is O(n) on small arrays |
| V. Offline-First — localStorage schema backward compatible | PASS | No schema change; existing stored data works as-is |

## Project Structure

### Documentation (this feature)

```text
specs/001-preserve-assignments-on-game-change/
├── plan.md           ← this file
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/
    └── requirements.md
```

### Source Files Modified

```text
src/
├── hooks/
│   └── useRotationState.ts    # changeNumberOfGames + confirmChangeNumberOfGames
└── components/
    └── GameCountSelector.tsx  # prop type + dialog copy
```

---

## Implementation Steps

### Step 1 — Add `ChangeGamesResult` type

**File**: `src/hooks/useRotationState.ts`

Add above the hook function body:

```typescript
type ChangeGamesResult =
  | { proceed: true }
  | { proceed: false; affectedGames: number[] };
```

---

### Step 2 — Rewrite `changeNumberOfGames`

**File**: `src/hooks/useRotationState.ts` lines 191-204

Replace the current implementation with:

```typescript
const changeNumberOfGames = (newNumber: number): ChangeGamesResult => {
  if (newNumber < MIN_GAMES || newNumber > MAX_GAMES) {
    return { proceed: true };
  }
  if (newNumber === numberOfGames) {
    return { proceed: true }; // no-op
  }
  if (newNumber > numberOfGames) {
    setNumberOfGames(newNumber);
    return { proceed: true };
  }
  // Decrease: check which tail games have assignments
  const affectedGames = assignments
    .filter(a => a.game > newNumber)
    .map(a => a.game)
    .filter((g, i, arr) => arr.indexOf(g) === i)
    .sort((a, b) => a - b);

  if (affectedGames.length === 0) {
    setNumberOfGames(newNumber);
    return { proceed: true };
  }
  return { proceed: false, affectedGames };
};
```

---

### Step 3 — Rewrite `confirmChangeNumberOfGames`

**File**: `src/hooks/useRotationState.ts` lines 206-214

Replace with:

```typescript
const confirmChangeNumberOfGames = (newNumber: number) => {
  if (newNumber < MIN_GAMES || newNumber > MAX_GAMES) return;
  setAssignments(prev => prev.filter(a => a.game <= newNumber));
  setNumberOfGames(newNumber);
};
```

---

### Step 4 — Update `GameCountSelectorProps`

**File**: `src/components/GameCountSelector.tsx` line 25

Export the type from `src/hooks/useRotationState.ts` by adding `export` to the declaration:

```typescript
export type ChangeGamesResult =
  | { proceed: true }
  | { proceed: false; affectedGames: number[] };
```

Then in `src/components/GameCountSelector.tsx`, add the import:

```typescript
import type { ChangeGamesResult } from '@/hooks/useRotationState';
```

And update the prop type (line 25):

```typescript
onChangeGames: (count: number) => ChangeGamesResult;
```

---

### Step 5 — Update `handleValueChange` and component state

**File**: `src/components/GameCountSelector.tsx`

Replace the `handleValueChange` function and add `affectedGames` state:

```typescript
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
```

---

### Step 6 — Update dialog copy

**File**: `src/components/GameCountSelector.tsx` lines 82-93

Replace the `AlertDialogTitle` and `AlertDialogDescription` content:

```tsx
<AlertDialogTitle>Remove games from festival?</AlertDialogTitle>
<AlertDialogDescription>
  {affectedGames.length === 1
    ? `Game ${affectedGames[0]} has`
    : `Games ${affectedGames.join(', ')} have`}{' '}
  assignments that will be removed. All other assignments will be kept.
  Do you want to continue?
</AlertDialogDescription>
```

Update the confirm button label:

```tsx
<AlertDialogAction onClick={confirmChange}>
  Remove and Change
</AlertDialogAction>
```

---

## Verification

Follow `quickstart.md` manual test scenarios:

1. Increase with assignments — no dialog, assignments preserved, fairness updates
2. Decrease empty tail — no dialog, assignments intact
3. Decrease populated tail — targeted dialog with correct game numbers, confirm removes only tail, games 1–N preserved
4. Cancel targeted dialog — count unchanged, all assignments preserved
5. Reload page — localStorage state is consistent after each operation

TypeScript compilation (`npm run build:dev`) and lint (`npm run lint`) must pass with zero errors.
