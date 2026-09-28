# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pitch-Mate-Rota is a rugby player rotation management tool for festival games. It helps coaches ensure fair playing time and RFU compliance when managing squad rotations across multiple games.

**Tech Stack**: React 18 + TypeScript + Vite + shadcn-ui + Tailwind CSS

## Development Commands

```bash
npm i                  # Install dependencies
npm run dev            # Start dev server (http://localhost:5173)
npm build              # Build for production
npm run build:dev      # Build with source maps
npm run lint           # Lint the codebase
npm preview            # Preview production build
```

## Architecture

### State Management

Every rule lives in the pure `src/rota/` module (no React, no storage): `reduce(state, action)` and `assess(state)`; saving, validation and migration in `src/rota/storage.ts`. `src/hooks/useRotationState.ts` is only `useReducer`, localStorage read/write and one-step undo. No Redux, Context API, or other state management libraries — props drilling only.

State flows from `Index.tsx` down to child components. All changes are `dispatch`ed actions; confirmations use a dry run (`preview(action)`) to word the dialog. The UI computes no rules itself.

### Important Architectural Decisions

1. **State shape**: `{version, squad, festival}`. The festival holds age group, games, labels, optional half length and picks; picks reference players by `playerId`. Time is counted in quarters internally.

2. **Consecutive halves are allowed**: players can play both halves of a game. The rota tracks total halves across the festival; more than three in a row is flagged, never blocked.

3. **Hard Limits vs Soft Indicators**:
   - Players per half is a **hard block** (cells disabled when full)
   - Experience balance is a **soft indicator** (informational only, coaching judgment)

4. **Offline-First Design**: All data stored in localStorage. No backend, no API calls. Designed for pitchside use without network dependency.

5. **Confirmation Dialogs**: All destructive actions (clear all, reset, remove player, change game count) require AlertDialog confirmation.

## Working with shadcn-ui

shadcn-ui components are **copied into the project** (`src/components/ui/`) — not imported from npm. Add new components via `npx shadcn-ui add <component>` rather than installing packages.

## TypeScript Configuration

The project uses a **relaxed TypeScript config** (`noImplicitAny: false`, `strictNullChecks: false`). Provide type annotations for props and function returns, but don't over-engineer strict typing.

## Styling Conventions

- Tailwind utility classes throughout; use `cn()` from `src/lib/utils.ts` to merge classNames conditionally
- Touch-friendly targets (minimum 44×44px for interactive elements)

## Important Notes

- **localStorage keys**: `'pitch-mate-rota'` (versioned state), `'pitch-mate-rota-backup'` (unreadable data kept on load), `'theme'` (`dark` when the coach chose dark mode). Old `squad-rotation-state` / `squad-rotation-age-group` keys are migrated then removed
- **Look**: Chalk & Turf with Trojans colours, from `docs/prototypes/`. Tokens and classes in `src/styles/app.css` (light default, `data-theme="dark"` for navy); shadcn tokens in `src/index.css` are mapped onto the same palette. Gold is for the one primary action, scarlet for club touches and selection, soft orange (never red) for flags. Fonts are self-hosted via @fontsource (the hub CSP blocks Google Fonts).
- **Players per half and RFU fairness rules** are age-group dependent and computed in `src/rota/` from `src/types/ageGroup.ts` — not hardcoded constants

## Status
Active. Feature 001 (preserve assignments on game change) complete.

## Active Priorities
- No current active feature — check git log and any open issues before starting work.

## Testing

Vitest + React Testing Library, configured in `vite.config.ts` (`test` block). Run `npm test`.
- Tests live in `src/rota/__tests__/`
- Test only through `reduce`, `assess` and `serialize`/`deserialize`

## Active Technologies
- TypeScript (relaxed config — `noImplicitAny: false`, `strictNullChecks: false`) + React 18, Vite, shadcn-ui, Tailwind CSS (001-preserve-assignments-on-game-change)
- localStorage (`squad-rotation-state`) (001-preserve-assignments-on-game-change)

## Recent Changes
- 001-preserve-assignments-on-game-change: Added TypeScript (relaxed config — `noImplicitAny: false`, `strictNullChecks: false`) + React 18, Vite, shadcn-ui, Tailwind CSS

## Agent skills

### Issue tracker

Issues tracked in GitHub Issues (footnote42/pitch-mate-rota) via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
