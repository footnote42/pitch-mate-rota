# Feature Specification: Preserve Assignments When Changing Game Count

**Feature Branch**: `001-preserve-assignments-on-game-change`
**Created**: 2026-04-17
**Status**: Draft
**Input**: User description: "Preserve existing player assignments when changing the number of games, instead of clearing all data. When increasing games, retain all assignments and recalculate fairness. When decreasing games, warn if assignments exist for removed games and only clear those specific games rather than all assignments."

## Context

The current implementation clears **all** player assignments whenever the number of games is changed. This is destructive during a live festival where some games have already been played — a coach may need to add or remove a future game while retaining the completed games' data. The existing behaviour was likely the simplest implementation choice, not a deliberate design decision.

**Counter-argument for keeping the existing clear-all behaviour:**
A rotation plan built for 5 games may have been designed holistically — e.g., a player intentionally sits out games 1-2 to play all of games 3-5. Dropping to 3 games means that player has zero halves, and the plan is now incoherent. *However*, this argument only applies to pre-planned assignments that have not yet been played. Once games have been played, those assignments are historical facts and must not be deleted. The correct solution is to preserve all assignments that belong to games still within the new game count, and surgically remove only those for games that are being eliminated.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Increasing games mid-festival (Priority: P1)

A coach is running a 4-game festival. After game 2 is completed with assignments recorded, they learn a 5th game has been added to the schedule. They change the game count from 4 to 5.

**Why this priority**: This is the most common real-world scenario — late additions to a festival schedule. The coach has played games and losing that history is unacceptable.

**Independent Test**: Set up any number of assignments, increase the game count, and verify every existing assignment is still present and fairness totals update.

**Acceptance Scenarios**:

1. **Given** assignments exist across games 1-4, **When** the coach changes the count from 4 to 5, **Then** all existing assignments are preserved, game 5 has no assignments, and fairness calculations update to reflect 5 games.
2. **Given** no assignments exist, **When** the coach increases the game count, **Then** the count changes immediately with no confirmation dialog.
3. **Given** assignments exist, **When** the coach increases the game count, **Then** no confirmation dialog is shown — the change is safe and proceeds silently.

---

### User Story 2 - Decreasing games when removed games are empty (Priority: P2)

A coach planned for 5 games but only games 1-3 have any assignments. They want to drop to 3 games. Games 4 and 5 have no assignments.

**Why this priority**: Removing empty tail games should be frictionless — there is nothing to lose.

**Independent Test**: Set up assignments only for games 1-3, then reduce count from 5 to 3 and verify no dialog appears and assignments are intact.

**Acceptance Scenarios**:

1. **Given** assignments exist only for games 1-3 and none for games 4-5, **When** the coach changes count from 5 to 3, **Then** the count changes without any confirmation dialog and all assignments are preserved.
2. **Given** no assignments exist at all, **When** the coach decreases the game count, **Then** the change happens immediately with no dialog.

---

### User Story 3 - Decreasing games when removed games have assignments (Priority: P1)

A coach needs to drop from 5 to 3 games, but games 4 and 5 already have player assignments recorded (e.g., from advance planning).

**Why this priority**: This is the high-risk scenario — data loss is possible and requires explicit confirmation.

**Independent Test**: Set up assignments for all 5 games, reduce to 3, verify the targeted warning dialog appears, confirm, and verify only games 4-5 assignments are removed while games 1-3 are preserved.

**Acceptance Scenarios**:

1. **Given** assignments exist for games 4 and 5, **When** the coach changes count to 3, **Then** a confirmation dialog appears naming the specific games that will lose assignments (e.g., "Games 4 and 5 have assignments that will be lost").
2. **Given** the targeted confirmation dialog is shown, **When** the coach confirms, **Then** only assignments for games 4-5 are deleted; games 1-3 assignments are preserved and fairness recalculates.
3. **Given** the targeted confirmation dialog is shown, **When** the coach cancels, **Then** the game count remains unchanged and no assignments are modified.
4. **Given** assignments exist for games 4 and 5, **When** a confirmation dialog is shown, **Then** the dialog names the specific games that will lose data and states that all other assignments will be kept.

---

### Edge Cases

- What happens if the coach changes to the same number (no-op)? No dialog, no change.
- Decreasing by more than one step (e.g., 5 to 2) where multiple games have assignments — all affected games are listed in the warning dialog.
- Increasing then decreasing back: assignments created for the intermediate higher count follow the standard decrease logic.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the game count is increased, the system MUST preserve all existing assignments without requiring confirmation.
- **FR-002**: When the game count is decreased and the removed games have no assignments, the system MUST reduce the count immediately without showing a confirmation dialog.
- **FR-003**: When the game count is decreased and one or more removed games have assignments, the system MUST show a confirmation dialog that names the specific games whose assignments will be lost.
- **FR-004**: When a decrease is confirmed, the system MUST delete only the assignments belonging to games beyond the new count; all other assignments MUST be preserved.
- **FR-005**: After any game count change, fairness calculations (fair share, minimum halves, experience balance) MUST automatically reflect the new game count.
- **FR-006**: The confirmation dialog for a lossy decrease MUST clearly communicate which games retain their data and which will lose it.
- **FR-007**: Cancelling a lossy-decrease dialog MUST leave both the game count and all assignments unchanged.

### Key Entities

- **Assignment**: Links one player to one half of one specific game (by game number). Assignments with a game number greater than the new count are the only ones eligible for removal.
- **Game Count**: The number of games in the festival. Determines the scope of fairness calculations and the number of columns in the rotation grid.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A coach can increase the game count during a live festival without losing any previously recorded assignments.
- **SC-002**: A coach can decrease the game count when future games are empty without being interrupted by a confirmation dialog.
- **SC-003**: When a decrease would cause data loss, the coach is given a targeted warning that identifies exactly which games will be affected before any data is removed.
- **SC-004**: After changing the game count in either direction, all displayed fairness metrics update immediately to reflect the new total without requiring a page reload.
- **SC-005**: Zero assignments from games within the retained range are ever deleted as a side-effect of a game count change.

---

## Assumptions

- The game count range (MIN_GAMES=3, MAX_GAMES=8) remains unchanged.
- The data model (assignments referenced by game number) does not need to change — filtering by game number is sufficient to identify removable assignments.
- "Completed" games are not tracked as a separate status; the coach's judgment determines which games are complete. The system preserves assignments based on game number position, not a played/unplayed flag.
