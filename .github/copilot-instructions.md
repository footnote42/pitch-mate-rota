# Copilot / Agent Instructions — pitch-mate-rota

Purpose: quick, actionable guidance so an AI code agent can be productive immediately in this repo.

## Quick start (commands)
- Install: `npm i`
- Dev preview: `npm run dev` (Vite, default http://localhost:5173)
- Build: `npm run build` (or `npm run build:dev` for development build)
- Lint: `npm run lint`
- Preview production build: `npm run preview`

## Big picture
- Single-page React (Vite + TypeScript) app with no backend — offline-first and data stored in browser `localStorage`.
- UI built with copied shadcn-ui components under `src/components/ui/` and Tailwind CSS tokens in `src/index.css`.
- Central business logic lives in `src/hooks/useRotationState.ts` (state, persistence, fairness rules). Components are mostly presentation and use props drilling (no Context/Redux).

## Key files you will touch
- `src/hooks/useRotationState.ts` — authoritative place for rules like fair-share, min halves, assignment logic, localStorage key `squad-rotation-state`.
- `src/components/RotationGrid.tsx`, `src/components/GridCell.tsx` — assignment UI (toggle, cell disabling when half full).
- `src/components/PlayerManagement.tsx` — add/remove/toggle experience for players (players sorted alphabetically on add).
- `src/components/ui/` and `components.json` — local shadcn-ui components (copy-based, modify in-place).
- `src/lib/utils.ts` — `cn()` helper (use for merging Tailwind classes).
- `src/index.css` — design tokens (HSL vars), tailwind setup and color system.
- `src/types/ageGroup.ts` — `AGE_GROUP_CONFIGS` controls `playersOnField` (hard limits per half).

## Project-specific conventions & behavior (do not break)
- Data model is normalized: `players: Player[]` and `assignments: Assignment[]` (assignments reference players by `playerId`).
- Player IDs use pattern `player-${Date.now()}-${Math.random()}` — changing ID format affects storage and deletes.
- LocalStorage keys: `squad-rotation-state` (main) and `squad-rotation-age-group` (age-group pref). Avoid renaming without a clear migration plan.
- `toggleAssignment(playerId, game, half)` returns `false` when the half is full (UI shows confirmation/flash). Use this return value to signal invalid actions.
- `changeNumberOfGames()` and `changeAgeGroup()` return `false` if assignments exist; components trigger confirmation dialogs (`confirmChangeNumberOfGames`/`confirmChangeAgeGroup` to proceed).
- Hard limits (players per half) come from `AGE_GROUP_CONFIGS` and are enforced in the hook.

## Styling & component patterns
- Tailwind + utility-first, color tokens defined in `src/index.css` (HSL). Use `cn()` to compose classes.
- UI components are local copies of shadcn-ui — when adding new components, place them under `src/components/ui/` and update `components.json`.
- Animated feedback (red flash, color-coded badges) is used for UX — keep visual behavior consistent when changing interactions.

## Testing & quality
- No tests exist yet. If adding tests, prioritize unit tests for `useRotationState` (fairness rules, assignment boundary cases) with Vitest + React Testing Library.
- Run `npm run lint` and `npm run build` before opening a PR.

## Good first changes for an agent
- Add unit tests around `getFairShare`, `getMinimumHalves`, `toggleAssignment` boundary behavior.
- Improve type annotations in `useRotationState` where helpful (project uses relaxed TS settings).
- Add migration logic if changing localStorage schema: include versioning and a clear migration path.

---
If anything here is unclear or you want more detail (examples or a test plan), say which section and I’ll expand it. Thanks — I can iterate on this file based on your feedback.