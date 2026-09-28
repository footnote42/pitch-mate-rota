# Served at rugby.waynetellis.com/rota via proxy

The app is served under the rugby hub at `/rota` (proxy rewrite in portfolio-site `next.config.mjs`, as RAM already is; PWA scope `/rota` because Next strips the trailing slash), not as a redirect to its own Vercel address or a separate subdomain, so coaches stay under one URL they already know. Because browser storage is scoped to the origin, plans saved on the old Vercel address do not carry over, and there is no export/import: coaches re-enter the squad once, which keeps data from ever leaving the phone. The app is also installable (PWA) so it cold-loads pitchside without signal.

## Considered Options

- **Hub `/rota` redirect to separate deployment**: cheapest, but the URL changes under the coach.
- **Own subdomain (`rota.waynetellis.com`)**: clean isolation, but another address to share and remember.
