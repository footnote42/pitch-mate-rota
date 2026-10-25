# NOW — pitch-mate-rota

## Start here (fresh agent, 2026-10-25)
1. Read this file, then `CLAUDE.md`, then this repo's open issues and PRs on GitHub.
2. The plan to 13 Nov is programme `docs/plan-2026-11.md` (agreed by Wayne 25 Oct). Three streams are active: home-lab Phase 1, Command Centre with Comms, and Holly. Nothing outside them starts without Wayne's yes.
3. Ground rules (Wayne, 22-25 Oct 2026):
   - Work through GitHub issues. Comment on an issue when you take it; never work on one another session has claimed.
   - Agents never merge PRs and never run `hl-apply`. When a PR is green, comment on the PR: `ready for Holly: <repo>#<n> <sha>`. For an on-box step, comment `hl-apply <name> needed` on the issue. Holly (the chief of staff on New Dave) scans GitHub hourly and does the merge or the apply.
   - No root. Root work goes to Holly's reviewed-script route (`hl-apply`) or to Wayne as a script.
   - The move to New Dave is Holly's: home-lab #21, #70 and anything labelled `newdave`, plus the health check. Don't touch them.
   - Comms is left to nitro and Holly on New Dave.
   - No secrets, IPs or hostnames in any file, issue or comment.
   - Wayne is not an advanced GitHub user: when he has to do something, give him the exact clicks or commands.

## Status
DELIVERED — live at `/rota` under the Rugby Hub, used pitchside. Not a stream in plan-2026-11. No open issues or PRs.

## Next
Use it at the next festival; log what trips coaches up as new issues (made-up names only: the repo is public).

## Context
- CI: GitHub Actions runs lint, test and build on every push and PR (#47, 2026-10-12). Run `npm test` and `npm run lint` before any PR
- Hosting: served at /rota under the rugby hub (ADR 0003); Vercel deploys on push to main, so a merge is a deploy
- Rules live in pure `src/rota/`; the UI computes none (see `CLAUDE.md`)
- Decisions: `docs/adr/`; rejected requests: `.out-of-scope/`. `DECISIONS.md` is frozen history, do not append
- `polish-plan.md` is superseded by the closed issues; delete or archive it (ask Wayne first)
- Phone shortcut: re-add from the Hub's /rota to get the H icon (old shortcuts keep their icon)
- Obsidian: `C:/Users/kenho/Obsidian/Second Brain/Projects/pitch-mate-rota/`

## Blocker
None

## Last session
2026-10-25 — NOW.md refreshed for a fresh start (no code change).
2026-10-12 — CI workflow added (#47).
2026-10-03 — Completion celebration toast now fires only when selections change, not on refresh.
