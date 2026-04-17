# Tasks: Preserve Assignments When Changing Game Count

**Input**: Design documents from `/specs/001-preserve-assignments-on-game-change/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: One Vitest unit test file for hook logic (T011). Manual UAT scenarios in quickstart.md cover all success criteria.

**Organization**: Tasks grouped by user story. US1 and US3 are both P1; US2 is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add and export the new type that both changed files will depend on.

- [x] T001 Add and export `ChangeGamesResult` discriminated union type in `src/hooks/useRotationState.ts` (above the hook body): `export type ChangeGamesResult = { proceed: true } | { proceed: false; affectedGames: number[] }`

**Checkpoint**: Type is exported; TypeScript compilation passes.

---

## Phase 2: Foundational (Hook Logic — Blocking Prerequisite)

**Purpose**: Rewrite the two hook functions that both the component and the feature depend on. Must be complete before any component work begins.

- [x] T002 Rewrite `changeNumberOfGames` in `src/hooks/useRotationState.ts` (lines 191-204) — same-number returns immediately (no-op); increase applies silently; decrease checks tail assignments and returns `{ proceed: false, affectedGames }` only when data would be lost
- [x] T003 Rewrite `confirmChangeNumberOfGames` in `src/hooks/useRotationState.ts` (lines 206-214) — replace `setAssignments([])` with `setAssignments(prev => prev.filter(a => a.game <= newNumber))`

**Checkpoint**: Hook logic correct. No dialog fires on increase; `affectedGames` array is accurate on decrease; same-number is a no-op.

---

## Phase 3: User Story 1 — Increasing games mid-festival (Priority: P1) 🎯 MVP

**Goal**: Coach increases the game count during a live festival without losing any assignments and without seeing a dialog.

**Independent Test**: Set up assignments, increase game count — no dialog appears, all assignments remain, fairness stats reflect the new count.

- [x] T004 [US1] Import `ChangeGamesResult` from `@/hooks/useRotationState` at the top of `src/components/GameCountSelector.tsx`
- [x] T005 [US1] Update `onChangeGames` prop type in `src/components/GameCountSelector.tsx` (line 25) from `(count: number) => boolean` to `(count: number) => ChangeGamesResult`
- [x] T006 [US1] Update `handleValueChange` in `src/components/GameCountSelector.tsx` to use the new return type — replace the `if (!success)` branch with `if (!result.proceed)`
- [x] T007 [US1] Add `affectedGames` state (`useState<number[]>([])`) to `GameCountSelector` and populate it in `handleValueChange` when `result.proceed === false`
- [x] T008 [US1] Update `confirmChange` in `src/components/GameCountSelector.tsx` to reset `affectedGames` state after confirmation

**Checkpoint**: US1 complete. Increase game count with assignments present — no dialog, assignments preserved, fairness updates.

---

## Phase 4: User Story 2 — Decreasing to empty tail games (Priority: P2)

**Goal**: Coach drops game count when tail games are empty — change is instant with no dialog.

**Independent Test**: Assign players to games 1-3 only, set count to 5, reduce back to 3 — no dialog, assignments for games 1-3 intact.

*No additional code changes needed beyond Phase 2. The rewritten `changeNumberOfGames` already handles this case — when tail games have no assignments it returns `{ proceed: true }` and applies immediately.*

**Checkpoint**: US2 works as a side-effect of Phase 2. Verify manually per the Independent Test above.

---

## Phase 5: User Story 3 — Decreasing with populated tail games (Priority: P1)

**Goal**: Coach sees a targeted dialog naming exactly which games will lose data; on confirm, only those assignments are removed.

**Independent Test**: Assign players to all games including 4 and 5. Reduce count to 3. Dialog names games 4 and 5. Confirm — games 1-3 intact. Cancel from a fresh attempt — count unchanged, all assignments preserved.

- [x] T009 [US3] Update `AlertDialogTitle` in `src/components/GameCountSelector.tsx` (line 83) from "Change number of games?" to "Remove games from festival?"
- [x] T010 [US3] Update `AlertDialogDescription` in `src/components/GameCountSelector.tsx` (lines 84-85) to reference `affectedGames` — format: "Game X has..." for one game, "Games X, Y have..." for multiple, followed by "All other assignments will be kept. Do you want to continue?"
- [x] T011 [US3] Update `AlertDialogAction` button label in `src/components/GameCountSelector.tsx` (line 90) from "Clear Assignments and Change" to "Remove and Change"

**Checkpoint**: US3 complete. Dialog shows correct game numbers, confirm removes only tail assignments, cancel leaves everything unchanged.

---

## Phase 6: Polish & Verification

- [x] T012 Create `src/hooks/__tests__/useRotationState.gameCount.test.ts` with three unit tests for `changeNumberOfGames`: (1) increase returns `{ proceed: true }` and preserves assignments; (2) decrease with no tail assignments returns `{ proceed: true }`; (3) decrease with tail assignments returns `{ proceed: false, affectedGames: [n] }`
- [x] T013 Run `npm run build:dev` — TypeScript compilation must pass with zero errors
- [x] T014 Run `npm run lint` — ESLint must pass with zero errors (pre-existing warnings/errors in shadcn-ui files and useRotationState migration code are not introduced by this feature)
- [ ] T015 Run all 5 manual UAT scenarios from `specs/001-preserve-assignments-on-game-change/quickstart.md` including the localStorage reload check (scenario 1 specifically validates FR-005 — confirm fairness stats update after game count change)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately — no dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks** Phases 3 and 5
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 only — US2 is satisfied by Phase 2 code, no new tasks
- **Phase 5 (US3)**: Depends on Phases 2 and 3 (needs `affectedGames` state from Phase 3)
- **Phase 6 (Polish)**: Depends on all prior phases

### User Story Dependencies

- **US1 (P1)**: Phases 1-3
- **US2 (P2)**: Phases 1-2 (no dedicated phase)
- **US3 (P1)**: Phases 1-3 and 5

### Parallel Opportunities

T002 and T003 operate on different functions in the same file — write sequentially to avoid conflicts. T004-T011 all touch `GameCountSelector.tsx` or its type dependency — write sequentially within each phase.

---

## Implementation Strategy

### MVP First (US1 — the most common real-world scenario)

1. T001 — add and export type
2. T002, T003 — rewrite hook functions
3. T004-T008 — update component
4. **STOP and VALIDATE**: increase game count mid-session works silently

### Full Delivery (add US3 for the decrease scenario)

5. T009-T011 — targeted dialog copy
6. **VALIDATE**: decrease dialog names specific games, confirm removes only tail

### US2 is free

US2 requires no code beyond Phase 2 — validate it as a checkpoint after T003.

---

## Notes

- Total tasks: 15 (12 implementation, 3 verification)
- No new production files — all changes are in-place edits to 2 existing files
- One new test file: `src/hooks/__tests__/useRotationState.gameCount.test.ts`
- All implementation tasks touch shared files — run sequentially within each phase
