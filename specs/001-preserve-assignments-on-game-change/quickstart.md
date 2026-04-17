# Quickstart: Preserve Assignments When Changing Game Count

## Development

```bash
npm run dev        # http://localhost:5173
npm run build:dev  # verify TypeScript compiles
npm run lint       # must pass zero errors
```

## Manual Test Scenarios

### Increase game count with existing assignments
1. Add players, make assignments across several games
2. Change game count upward
3. Verify: no dialog appears, all previous assignments still visible, fairness stats update

### Decrease to eliminate empty tail games
1. Add players, make assignments for games 1-3 only
2. Set game count to 5 (3 remain empty)
3. Change back to 3
4. Verify: no dialog, assignments for games 1-3 intact

### Decrease with populated tail games
1. Add players, assign players to all games including game 4 and 5
2. Change game count to 3
3. Verify: dialog appears naming "Games 4 and 5"
4. Confirm
5. Verify: assignments for games 1-3 preserved, fairness recalculates for 3 games

### Cancel targeted dialog
1. Same setup as above
2. Change to 3, dialog appears
3. Cancel
4. Verify: game count still 5, all assignments unchanged

### Reload persistence
After any change, reload the page and verify localStorage preserved the correct state.
