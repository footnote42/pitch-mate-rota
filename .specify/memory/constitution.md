<!--
SYNC IMPACT REPORT
Version Change: 1.0.0 → 1.0.0 (Initial ratification)
Modified Principles: N/A (initial creation)
Added Sections:
  - Core Principles (5 principles: Code Quality, Testing Standards, User Experience Consistency, Performance Requirements, Offline-First Architecture)
  - Technical Standards
  - Quality Gates
  - Governance
Removed Sections: N/A
Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section references this file
  ✅ spec-template.md - Requirements align with UX principles
  ✅ tasks-template.md - Task organization reflects quality standards
Follow-up TODOs: None
-->

# Pitch-Mate-Rota Constitution

## Core Principles

### I. Code Quality

**Declarative Requirements**:
- All TypeScript code MUST use explicit type annotations for function parameters and return values
- Component props MUST be typed with interface declarations (no inline types)
- No `any` types except where explicitly justified and documented with rationale comment
- All React components MUST use functional components with hooks (no class components)
- Custom hooks MUST follow `use[Name]` naming convention and be extracted when logic exceeds 20 lines
- File organization MUST follow single responsibility: one primary component/hook/type per file
- Props drilling MUST NOT exceed 3 levels; refactor to context or state management when exceeded
- All functions exceeding 50 lines MUST be refactored into smaller, focused units

**Rationale**: Maintaining explicit typing and clear component boundaries ensures long-term maintainability for a pitchside coaching tool that must be reliable under pressure. The existing codebase uses relaxed TypeScript config for rapid iteration, but all new code should maintain strong typing discipline.

### II. Testing Standards

**Declarative Requirements**:
- All new features MUST include acceptance tests covering happy path scenarios
- Edge cases identified in specifications MUST have corresponding test cases
- Destructive actions (clear, delete, reset) MUST be tested for data integrity
- localStorage persistence MUST be validated in integration tests
- Performance-critical paths (grid rendering, assignment toggles) MUST have performance benchmarks
- Browser compatibility tests MUST validate on Chrome, Safari, and mobile browsers
- Test coverage MUST NOT fall below current baseline (establish baseline before enforcing)

**Testing Framework Adoption**:
- Vitest MUST be used for unit and integration testing (compatible with Vite)
- React Testing Library MUST be used for component testing
- Lighthouse MUST be used for performance auditing
- Manual UAT checklist MUST be maintained for pitchside scenarios (offline, touch events, battery drain)

**Rationale**: While no testing infrastructure currently exists, establishing standards ensures quality as the project scales. Testing destructive actions and persistence is critical for a tool coaches rely on during live games.

### III. User Experience Consistency

**Declarative Requirements**:
- All interactive elements MUST meet 44×44px minimum touch target size (mobile-first design)
- All destructive actions MUST require AlertDialog confirmation (already enforced; maintain)
- All state changes MUST provide visual feedback within 100ms (hover effects, loading states, animations)
- All error states MUST display user-friendly messages (no stack traces or technical jargon)
- Empty states MUST include helpful guidance and next actions (already implemented; maintain)
- All forms MUST validate on blur and display inline error messages
- Keyboard navigation MUST work for all interactive elements (accessibility requirement)
- Color contrast MUST meet WCAG AA standards for outdoor readability

**Component Library Standards**:
- shadcn-ui components MUST be preferred over custom implementations
- New UI patterns MUST reuse existing components from `src/components/ui/`
- Tailwind utility classes MUST be used exclusively (no CSS modules or styled-components)
- `cn()` utility from `lib/utils.ts` MUST be used for conditional className merging

**Rationale**: Coaches use this tool outdoors, often in bright sunlight with gloves on. Consistency in UX patterns reduces cognitive load during high-pressure game management.

### IV. Performance Requirements

**Declarative Requirements**:
- Initial page load MUST complete in under 2 seconds on 3G networks
- Grid rendering MUST handle 20 players × 16 halves (8 games) without visible lag
- Assignment toggle interactions MUST respond within 50ms
- localStorage read/write operations MUST NOT block UI thread
- Bundle size MUST remain under 500KB gzipped
- Lighthouse Performance score MUST remain above 90
- Time to Interactive (TTI) MUST be under 3 seconds
- No component re-renders on unrelated state changes (React.memo where appropriate)

**Optimization Techniques**:
- Lazy loading MUST be implemented for non-critical routes (e.g., tutorial, help dialogs)
- Images MUST be optimized and served in WebP format with PNG fallback
- Large lists (player management) MUST use virtualization if exceeding 50 items
- Debouncing MUST be applied to rapid user inputs (e.g., search/filter)

**Rationale**: Coaches need instant responsiveness during games. Performance degradation leads to frustration and potential errors in player assignments.

### V. Offline-First Architecture

**Declarative Requirements**:
- All features MUST function without network connectivity (already enforced; maintain)
- localStorage MUST be the single source of truth for all application state
- No API calls except for future optional cloud sync (clearly marked as optional enhancement)
- Service Worker MUST cache all static assets for offline access
- Network failures MUST NOT display error states (app is offline-first, not network-dependent)
- Data migrations for localStorage schema changes MUST be backward compatible
- Export/import functionality MUST allow data portability (WhatsApp share exists; maintain)

**Data Integrity Standards**:
- Auto-save MUST occur on every state mutation (already implemented; maintain)
- No manual save buttons required (implicit persistence)
- Corrupted localStorage data MUST trigger graceful degradation with recovery options
- Browser storage quota exceeded MUST display actionable guidance

**Rationale**: Rugby festivals often occur in remote fields with poor connectivity. The app must be 100% reliable offline, which is already a core architectural decision.

## Technical Standards

### Browser Compatibility
- **Primary Targets**: Latest 2 versions of Chrome, Safari, Firefox on iOS/Android
- **Minimum Support**: Chrome 90+, Safari 14+, Firefox 88+
- **Mobile Priority**: Touch events, viewport handling, and battery efficiency prioritized

### Dependency Management
- **Lock File**: `package-lock.json` MUST be committed to ensure reproducible builds
- **Version Pinning**: Direct dependencies MUST use exact versions (no `^` or `~` in package.json)
- **Security**: `npm audit` MUST report zero high/critical vulnerabilities before releases
- **Bundle Analysis**: Dependency additions exceeding 50KB MUST be justified with alternatives analysis

### Code Style
- **Linting**: ESLint MUST pass with zero errors before commits
- **Formatting**: Code MUST be formatted with Prettier (if configured) or consistent manual style
- **Naming Conventions**:
  - Components: PascalCase (e.g., `PlayerManagement.tsx`)
  - Hooks: camelCase with `use` prefix (e.g., `useRotationState.ts`)
  - Utilities: camelCase (e.g., `utils.ts`)
  - Constants: SCREAMING_SNAKE_CASE (e.g., `PLAYERS_ON_FIELD`)
  - Types/Interfaces: PascalCase (e.g., `Player`, `Assignment`)

### Git Workflow
- **Commits**: Semantic commit messages (e.g., `feat:`, `fix:`, `docs:`, `refactor:`)
- **Branches**: Feature branches named `feature/[description]` or `fix/[issue]`
- **Pull Requests**: MUST include description, screenshots for UI changes, and testing notes
- **Deployment**: Pushes to `main` auto-deploy via Lovable (existing workflow; maintain)

## Quality Gates

### Pre-Commit
- [ ] ESLint passes with zero errors
- [ ] TypeScript compilation succeeds (`npm run build:dev`)
- [ ] No console.log statements in production code (use proper logging)
- [ ] All new components have defined props interfaces

### Pre-PR
- [ ] All acceptance criteria from specification met
- [ ] Manual testing completed on mobile device
- [ ] No performance regressions (subjective until benchmarks established)
- [ ] Screenshots included for UI changes
- [ ] localStorage data migrations tested (if schema changed)

### Pre-Release
- [ ] Full UAT checklist completed (to be created based on Tutorial steps)
- [ ] Lighthouse audit scores: Performance >90, Accessibility >95, Best Practices >90
- [ ] Cross-browser testing on Chrome (desktop), Safari (iOS), Chrome (Android)
- [ ] Offline functionality validated (disconnect network, test all features)
- [ ] WhatsApp share tested on actual device (if changes affect sharing)

## Governance

### Amendment Process
1. Proposals MUST be documented in `.specify/memory/` with rationale
2. Breaking changes to principles MUST increment MAJOR version
3. New principles or expanded guidance MUST increment MINOR version
4. Clarifications and typo fixes MUST increment PATCH version
5. All amendments MUST update dependent templates in `.specify/templates/`

### Compliance Review
- All specifications (`spec.md`) MUST reference relevant constitution principles
- All implementation plans (`plan.md`) MUST include Constitution Check section
- All pull requests MUST verify compliance with applicable principles
- Violations MUST be justified in "Complexity Tracking" table with simpler alternatives documented

### Enforcement
- This constitution supersedes conflicting guidance in other documents
- CLAUDE.md provides development workflow guidance; this constitution defines quality standards
- When tension exists between rapid iteration (CLAUDE.md philosophy) and quality standards (this constitution), quality standards take precedence for user-facing features
- Internal tooling and prototypes MAY relax standards with explicit justification

### Living Document Philosophy
- This constitution is a living document, expected to evolve as the project matures
- Principles should be challenged when they hinder legitimate progress
- Governance exists to ensure thoughtful change, not to prevent necessary adaptation
- Feedback from actual pitchside usage MUST inform principle refinements

**Version**: 1.0.0 | **Ratified**: 2026-01-20 | **Last Amended**: 2026-01-20
