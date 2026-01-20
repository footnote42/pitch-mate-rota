# Design Decisions

This document captures key architectural and design choices made during development, along with the rationale behind them.

## Interface Design

### Grid Layout vs Game-by-Game Workflow

**Decision**: Implemented a single-page grid showing all games and halves simultaneously.

**Alternative Considered**: Game-by-game workflow where coaches navigate through individual games sequentially.

**Rationale**:
- Matches existing mental model (coaches currently use paper grids)
- Allows pattern recognition across entire festival at a glance
- Makes it easier to balance playing time across all games
- Reduces cognitive load of remembering previous assignments
- Better supports the "festival planning" use case vs "real-time tracking"

**Trade-off**: Requires horizontal scrolling on mobile, but testing showed this was acceptable.

---

## Player Assignment Logic

### Allowing Players in Both Halves of Same Game

**Decision**: Players CAN be assigned to both halves of a single game.

**Rationale**:
- Reflects reality: rarely possible to substitute entire team at half-time
- Coaches need flexibility for core players who play most/all of game
- RFU rules focus on total playing time, not per-game substitutions
- Simpler logic than enforcing substitution rules

**Implementation Note**: System tracks total halves played, not "games played," for fairness calculations.

---

## Validation Approach

### Hard Limit vs Soft Warning for 8-Player Maximum

**Decision**: Implemented hard block preventing more than 8 players per half.

**Alternative Considered**: Allow over-assignment with visual warning.

**Rationale**:
- RFU rules are strict: exactly 8 players on field for U10
- Preventing invalid rotas is better than allowing and fixing later
- Visual counter (6/8, 7/8, 8/8) provides clear feedback
- Error prevention > error recovery in time-pressured festival environment

---

## Experience Balancing

### Relative Balance Indicator vs Fixed Thresholds

**Decision**: Show balance as relative scale/score rather than pass/fail threshold.

**Alternative Considered**: Red/amber/green based on "minimum 3 experienced players" rule.

**Rationale**:
- Coaching judgment varies by opponent and game situation
- Provides information without being prescriptive
- Allows coaches to make informed trade-offs
- More flexible as squad composition varies

**Future Enhancement**: May add configurable thresholds in Phase 2.

---

## Data Persistence

### Browser LocalStorage vs Cloud Database

**Decision**: Use browser LocalStorage for MVP.

**Alternative Considered**: Cloud-based storage with user accounts.

**Rationale**:
- **Simplicity**: No authentication, no server costs, no data privacy concerns
- **Offline-first**: Works without internet (critical for pitchside use)
- **Speed**: Instant save/load with no network latency
- **Scope**: Single-coach, single-device use case for MVP

**Trade-off**: Data is device-specific, can't sync across devices.

**Future Consideration**: Phase 2 may add optional cloud sync if multi-device access proves important.

---

## Mobile-First Design

### Why Mobile Over Desktop

**Decision**: Optimized primarily for mobile phone usage.

**Rationale**:
- Primary use case is pitchside during festivals
- Coaches are unlikely to bring laptops/tablets to muddy rugby pitches
- Modern mobile devices have sufficient screen space for grid interface
- Responsive design means it still works on larger screens

**Design Implications**:
- Touch-friendly target sizes (minimum 44×44px)
- Horizontal scrolling for game columns
- Simplified controls optimized for one-handed use
- High contrast for outdoor visibility

---

## Technology Stack

### Why React + TypeScript

**Decision**: Built React/TypeScript application with AI-assisted development tools.

**Alternatives Considered**:
1. Hand-coded vanilla JavaScript/HTML
2. Python-based web framework (Flask/Django)
3. No-code tools (Airtable, Google Sheets with Apps Script)

**Rationale**:

**AI-assisted development chosen because**:
- Rapid prototyping for hobbyist with limited time
- Generates modern, maintainable code
- Natural language iteration reduces coding barrier
- Still produces real code (not proprietary platform lock-in)

**React/TypeScript benefits**:
- Component-based architecture aids future enhancements
- Strong typing reduces bugs
- Industry-standard skills (transferable learning)
- Rich ecosystem for future features

**Trade-offs**:
- More complex than vanilla JavaScript
- Requires Node.js environment for local development
- Steeper learning curve for modifications

---

## Version Control

### GitHub for Solo Project

**Decision**: Use GitHub from project inception, even as solo developer.

**Rationale**:
- **Learning**: Professional development practice
- **Safety**: Easy rollback if changes break things
- **Documentation**: Commit history shows evolution of thinking
- **Future-proofing**: Enables collaboration if other coaches want to contribute
- **Backup**: Cloud-based code protection

**Implementation**: Using GitHub for version control and collaboration, VS Code for development and documentation.

---

## Scope Management

### Fixed Configuration for MVP

**Decision**: Hardcode 13 players, 8 on field, 5 games for initial release.

**Rationale**:
- Matches most common U10 festival scenario
- Reduces complexity for first iteration
- Proves core concept before adding configurability
- Faster development = sooner to real-world testing

**Planned Evolution**: Phase 2 will make these values configurable via settings.

---

## Fairness Calculations

### Two-Tier System: Minimum + Equity

**Decision**: Track both "RFU minimum met" and "equitable distribution" separately.

**Rationale**:
- RFU half-game rule is non-negotiable (regulatory compliance)
- Equity is desirable but flexible (coaching discretion)
- Separating them clarifies priorities during festival
- Different visual treatments (amber warning vs info indicator)

**Implementation**: 
- Minimum = total halves ÷ 2 (must meet)
- Equity = total halves ÷ number of players (should aim for)

---

## Documentation Strategy

### Separate ABOUT, REQUIREMENTS, DECISIONS Files

**Decision**: Split documentation into multiple focused markdown files.

**Alternative Considered**: Single comprehensive README.

**Rationale**:
- **README.md**: Technical quick-start and setup instructions
- **ABOUT.md**: Project context for non-technical readers
- **REQUIREMENTS.md**: Detailed specification for development reference
- **DECISIONS.md**: Rationale capture for future decisions

**Benefits**:
- Easier to navigate and maintain
- Appropriate detail level for different audiences
- Avoids README bloat
- Clear separation between "what" and "why"

---

## Future Decision Points

Issues requiring future decisions (currently tracked in GitHub Issues):

1. **Multi-level experience scale**: 1-5 rating vs binary (Issue #4)
2. **Festival history storage**: LocalStorage vs cloud database (Issue #5)
3. **Export format**: Text, image, or structured data (Issue #6)
4. **Master squad database**: Architecture and data model (Issue #10)

---

*This document should be updated whenever significant design decisions are made. It serves as institutional memory for the project.*