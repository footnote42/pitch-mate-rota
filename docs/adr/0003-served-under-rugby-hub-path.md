# Served at rugby.waynetellis.com/rota via proxy

The app is served under the rugby hub as `/rota/` (Vite `base: '/rota/'`, rewrite in portfolio-site `next.config.mjs`), not as a redirect to its own Vercel address or a separate subdomain, so coaches stay under one URL they already know. Because browser storage is scoped to the origin, plans saved on the old Vercel address do not carry over; a one-off squad export/import covers the move. The app is also installable (PWA) so it cold-loads pitchside without signal.

## Considered Options

- **Hub `/rota` redirect to separate deployment (as RAM does)**: cheapest, but the URL changes under the coach.
- **Own subdomain (`rota.waynetellis.com`)**: clean isolation, but another address to share and remember.
