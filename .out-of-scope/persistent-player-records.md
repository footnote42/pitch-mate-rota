# Persistent player records

The rota does not keep players, IDs or player data beyond the current festival on the phone.

## Why this is out of scope

The coach's rule: no permanent storage of players or IDs. Names are transient, kept only
so they survive the phone switching off during a festival day. New festival, in the menu,
clears the plan and record; "Clear everything" also removes every name.

That rules out anything that needs a lasting record of a child: a season-long master
squad, per-player skill profiles, or tracking participation across festivals. These are
children's names on a coach's personal phone, with no backend and no consent process to
hold them longer. The app is offline-first with a single localStorage key and no
accounts, so there is nowhere safe or sanctioned to keep them anyway.

Keep squad (on New festival) already covers the practical need: the same players for the
next festival, without an archive.

## Prior requests

- #12: "Create master squad database with up to 50 players"
- #13: "Add per-player profiles with detailed skill ratings"
