# Research: Preserve Assignments When Changing Game Count

## Phase 0 Findings

No external research required. All decisions are based on analysis of the existing codebase.

---

### Decision 1: Return type change for `changeNumberOfGames`

**Current**: Returns `boolean` — `true` if change succeeded silently, `false` to trigger dialog.

**Decision**: Change to a discriminated union: `{ proceed: true } | { proceed: false; affectedGames: number[] }`

**Rationale**: The component needs to know *which* games will lose data to display a targeted dialog message. Returning the affected game numbers from the hook keeps business logic in the right place and avoids adding a second query function to the component.

**Alternatives considered**:
- Separate `getAffectedGames(newNumber)` query on the hook — rejected because it duplicates the same filter logic and requires two calls.
- Passing the affected games via a separate React state in Index.tsx — rejected as unnecessary complexity for a contained change.

---

### Decision 2: Increase game count — no dialog, no confirmation

**Decision**: When `newNumber > numberOfGames`, always apply immediately and return `{ proceed: true }`.

**Rationale**: Adding games cannot remove any existing data. No confirmation is needed. The fairness functions (`getTotalHalves`, `getFairShare`, `getMinimumHalves`) are derived from `numberOfGames` directly and update automatically on re-render.

---

### Decision 3: Decrease with empty tail — no dialog

**Decision**: When `newNumber < numberOfGames` and no assignments have `game > newNumber`, apply immediately and return `{ proceed: true }`.

**Rationale**: There is nothing to lose. Interrupting the coach with a dialog when no data is at risk is unnecessary friction, especially pitchside.

---

### Decision 4: `confirmChangeNumberOfGames` — filter, not clear

**Decision**: Replace `setAssignments([])` with `setAssignments(prev => prev.filter(a => a.game <= newNumber))`.

**Rationale**: Only assignments beyond the new game count should be removed. This directly satisfies FR-004 and SC-005.

---

### Decision 5: Fairness calculations — no change required

**Decision**: `getTotalHalves`, `getMinimumHalves`, `getFairShare`, and `getExperienceBalance` require no modification.

**Rationale**: All are computed from `numberOfGames` (a React state value) on every render. Setting `numberOfGames` to the new value is sufficient — derived values update automatically. This satisfies FR-005 and SC-004 without any additional work.

---

### Decision 6: No localStorage schema migration needed

**Decision**: The `Assignment` type (`{ playerId, game, half }`) is unchanged. No migration required.

**Rationale**: We are only adding smarter filtering logic. The data shape is identical. Existing persisted data is fully compatible.
