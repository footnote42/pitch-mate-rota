# Data Model: Preserve Assignments When Changing Game Count

## Entities (unchanged)

No data model changes are required. The existing `Assignment` type is sufficient.

```typescript
// src/types/rotation.ts — no changes
interface Assignment {
  playerId: string;  // references Player.id
  game: number;      // 1-indexed game number
  half: number;      // 1 or 2
}
```

## Changed Interface: ChangeGamesResult

A new return type is introduced for `changeNumberOfGames` in `useRotationState.ts`:

```typescript
type ChangeGamesResult =
  | { proceed: true }
  | { proceed: false; affectedGames: number[] };
```

**Fields:**
- `proceed: true` — change was applied immediately; no dialog needed
- `proceed: false; affectedGames: number[]` — change requires confirmation; lists game numbers (1-indexed) whose assignments would be deleted

**Used by**: `GameCountSelector` component to decide whether to show a dialog and, if so, which game numbers to name.

## State Transitions

| Scenario | `changeNumberOfGames` result | `confirmChangeNumberOfGames` effect |
|----------|------------------------------|-------------------------------------|
| Increase | `{ proceed: true }` | N/A — applied immediately |
| Decrease, no tail assignments | `{ proceed: true }` | N/A — applied immediately |
| Decrease, tail has assignments | `{ proceed: false, affectedGames: [n...] }` | Filter assignments to `game <= newNumber`, then set `numberOfGames` |
| Same number | `{ proceed: true }` | N/A — no-op |
