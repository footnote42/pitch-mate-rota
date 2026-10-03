# NOW — pitch-mate-rota

## Status
DELIVERED — celebration toast fix shipped and live on main. No open issues.

## Next
Use it at the next festival; log what trips coaches up as new issues (made-up names only: repo is public).

## Context
- Obsidian: `C:/Users/kenho/Obsidian/Second Brain/Projects/pitch-mate-rota/` (vault note priority slot likely stale now it's delivered)
- Decisions: `docs/adr/`; rejected requests: `.out-of-scope/`. `DECISIONS.md` is frozen history, do not append
- Rules live in pure `src/rota/`; UI computes none (see CLAUDE.md)
- Hosting: served at /rota under the rugby hub (ADR 0003); Vercel deploys on push to main
- `polish-plan.md` is superseded by the closed issues; delete or archive it
- Phone shortcut: re-add from rugby.waynetellis.com/rota to get the H icon (old shortcuts keep their icon)

## Blocker
None

## Last session
2026-10-03 — Suppressed completion celebration toast on page refresh; now fires only when selections change. Tested and pushed to main.
