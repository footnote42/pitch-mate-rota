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

Core logic lives in `src/hooks/useRotationState.ts` with localStorage persistence. No Redux, Context API, or other state management libraries — props drilling only.

State flows from `Index.tsx` down to child components. All state updates go through functions returned by `useRotationState`, passed as props.

### Important Architectural Decisions

1. **Normalized Data Model**: Players and assignments are separate arrays. Assignments reference players by `playerId`, allowing independent clearing/filtering.

2. **No Restrictions on Consecutive Halves**: Players can play both halves of the same game. The system tracks total halves played, not games, reflecting real-world coaching flexibility.

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

- **localStorage keys**: `'squad-rotation-state'` (main state), `'tutorial-completed'` (tutorial tracking)
- **Trojans RFC branding**: Logo at `/trojans_logo.png`, primary blue color scheme
- **Players per half and RFU fairness rules** are age-group dependent and computed in `useRotationState.ts` — not hardcoded constants

## Testing

No testing infrastructure is currently set up. When adding tests:
- Vitest for unit tests (already compatible with Vite)
- React Testing Library for component tests
- Focus on `useRotationState` hook logic (business rules)
