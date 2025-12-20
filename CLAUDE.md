# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pitch-Mate-Rota is a rugby player rotation management tool for festival games. It helps coaches ensure fair playing time and RFU compliance when managing squad rotations across multiple games.

**Tech Stack**: React 18 + TypeScript + Vite + shadcn-ui + Tailwind CSS

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm build

# Build for development (includes source maps)
npm run build:dev

# Lint the codebase
npm run lint

# Preview production build
npm preview
```

## Architecture

### State Management

The application uses a **custom hook pattern** (`src/hooks/useRotationState.ts`) with localStorage persistence. There is NO Redux, Context API, or other state management libraries.

**Core State Structure**:
```typescript
{
  players: Player[],           // { id, name, experienceLevel }
  assignments: Assignment[],   // { playerId, game, half }
  numberOfGames: number        // 3-8 games (default: 5)
}
```

**Key Constants**:
- `PLAYERS_ON_FIELD = 8` (hardcoded RFU standard)
- Total halves = `numberOfGames * 2`
- Minimum halves per player = `ceil(totalHalves / 2)` (RFU compliance)
- Fair share = `round((totalHalves * 8) / playerCount)` (equitable distribution)

**Persistence**:
- Auto-saves to `localStorage` key `'squad-rotation-state'` on every state change
- No debouncing or manual save required
- Loads automatically on mount

### Data Flow Pattern

The app uses **props drilling** (no Context). State flows from `Index.tsx` down to child components:

```
Index (useRotationState hook)
  ├─→ Header
  ├─→ GameCountSelector
  ├─→ PlayerManagement
  └─→ RotationGrid
       ├─→ GridCell (individual assignment cells)
       └─→ ExperienceBalance (per-half balance indicators)
```

All state updates flow through functions provided by `useRotationState`, passed as props to child components.

### Important Architectural Decisions

1. **Normalized Data Model**: Players and assignments are separate arrays. Assignments reference players by `playerId` rather than embedding player objects. This allows independent clearing/filtering of assignments.

2. **No Restrictions on Consecutive Halves**: Players can play both halves of the same game. The system tracks total halves played, not games, reflecting real-world coaching flexibility.

3. **Hard Limits vs Soft Indicators**:
   - 8 players per half is a **hard block** (cells disabled when half is full)
   - Experience balance is a **soft indicator** (informational only, coaching judgment)

4. **Offline-First Design**: All data stored in localStorage. No backend, no API calls. Designed for pitchside use without network dependency.

5. **Confirmation Dialogs**: All destructive actions (clear all, reset, remove player, change game count) require AlertDialog confirmation to prevent accidental data loss.

## Project Structure

```
src/
├── components/
│   ├── Header.tsx              # App header with save status, reset/clear
│   ├── PlayerManagement.tsx    # Add/remove players, toggle experience
│   ├── RotationGrid.tsx        # Main grid (games × halves)
│   ├── GridCell.tsx            # Individual assignment cell
│   ├── ExperienceBalance.tsx   # Experience distribution per half
│   ├── GameCountSelector.tsx   # Change number of games (3-8)
│   └── ui/                     # 50+ shadcn-ui components
├── hooks/
│   └── useRotationState.ts     # Core state management logic
├── types/
│   └── rotation.ts             # TypeScript interfaces
├── lib/
│   └── utils.ts                # cn() utility for className merging
└── pages/
    ├── Index.tsx               # Main application page
    └── NotFound.tsx            # 404 fallback
```

## Key Features

### Player Management (`PlayerManagement.tsx`)
- Add players with name + experience level (novice/experienced)
- Toggle experience level inline
- Remove players with confirmation
- Players auto-sorted alphabetically
- Real-time half count with fairness indicators (badges showing "Need X more", "Below fair", "Over-used")

### Rotation Grid (`RotationGrid.tsx`)
- Click-to-toggle assignment system
- Sticky left column (player names) for horizontal scrolling
- Hard limit: 8 players per half (cells disabled when full)
- Clear half / Clear game actions
- Experience balance row at bottom showing experienced vs novice counts

### Game Configuration (`GameCountSelector.tsx`)
- Variable number of games (3-8) via dropdown
- Smart confirmation: only prompts if assignments exist
- Clears all assignments when game count changes

### Visual Feedback
- Red flash animation on invalid actions (clicking full cells)
- Color-coded states: success (green), warning (amber), destructive (red)
- Real-time counters (e.g., "6/8 FULL" indicators)
- Badge indicators for player fairness tracking

## Working with shadcn-ui Components

This project uses shadcn-ui components extensively (in `src/components/ui/`). When adding new UI components:

1. Components are copied into the project (not imported from npm)
2. Configuration is in `components.json`
3. Style customization via Tailwind utilities and CSS variables in `src/index.css`
4. Common components: Button, Dialog, AlertDialog, Select, Badge, Separator, ScrollArea

## TypeScript Configuration

The project uses a **relaxed TypeScript config**:
- `noImplicitAny: false`
- `strictNullChecks: false`

This allows faster iteration while maintaining basic type safety. When adding new features, provide type annotations for props and function returns, but don't over-engineer strict typing.

## Styling Conventions

- **Tailwind utility classes** for all styling (no CSS modules or styled-components)
- Use `cn()` utility (from `src/lib/utils.ts`) to merge className conditionally
- Color system via HSL CSS custom properties (defined in `src/index.css`)
- Mobile-first responsive design (grid accepts horizontal scroll on small screens)
- Touch-friendly targets (minimum 44×44px for interactive elements)

## Common Development Patterns

### Adding a New Feature
1. Create component in `src/components/` (if UI-focused)
2. Add necessary types to `src/types/rotation.ts`
3. If state changes needed, extend `useRotationState` hook
4. Pass state/functions as props (maintain props drilling pattern)
5. Use shadcn-ui components for consistent UI
6. Add confirmation dialogs for destructive actions

### Working with State
```typescript
// In Index.tsx or any component using the hook
const {
  players,
  assignments,
  numberOfGames,
  addPlayer,
  removePlayer,
  toggleExperience,
  toggleAssignment,
  // ... other functions
} = useRotationState();

// Pass to children
<RotationGrid
  players={players}
  toggleAssignment={toggleAssignment}
  // ...
/>
```

### Adding Computed Values
Add calculation functions to `useRotationState` hook rather than computing in components. This keeps business logic centralized.

## Important Notes

- **Player IDs** are generated as `player-${Date.now()}-${Math.random()}`
- **localStorage key** is `'squad-rotation-state'` - changing this will reset user data
- **No API calls** - all data is local to the browser
- **RFU rules** encoded in fairness calculations (50% minimum playing time)
- This is a **Lovable-generated codebase** but fully editable/customizable

## Testing

No testing infrastructure is currently set up. When adding tests, consider:
- Vitest for unit tests (already compatible with Vite)
- React Testing Library for component tests
- Focus on `useRotationState` hook logic (business rules)
