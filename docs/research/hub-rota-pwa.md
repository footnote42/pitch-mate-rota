# Serving the rota at rugby.waynetellis.com/rota/ as an offline PWA

Research for issue #24 (map #22), checking the feasibility of ADR 0003. Researched 2026-09-27.

**Verdict: yes, it works.** The hub already proxies another Vercel app (RAM) the same way. Three details have to be right, or the offline cold load breaks:

1. Next.js strips the trailing slash, so `/rota/` 308-redirects to `/rota` (seen live). The PWA scope therefore has to be `/rota` (no slash). That needs a `Service-Worker-Allowed: /rota` header on `sw.js`.
2. The hub's site-wide CSP is applied to proxied responses (seen live). It blocks the rota's Google Fonts `@import`, so the fonts have to be self-hosted. They need to be local for offline use anyway.
3. Hard-coded `/trojans_logo.png` paths have to become base-relative.

## Sources

| Ref | Source |
|-----|--------|
| [PS] | `C:/Users/kenho/projects/portfolio-site/next.config.mjs`, `proxy.ts`, `CLAUDE.md` (Next `^16.1.6`, `package.json:16`) |
| [NX-RW] | Next.js docs, `next.config.js` rewrites: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites (via Context7 `/vercel/next.js`) |
| [NX-TS] | Next.js docs, `skipTrailingSlashRedirect`: https://nextjs.org/docs/app/api-reference/config/next-config-js/skipTrailingSlashRedirect |
| [VC-RW] | Vercel docs, Rewrites (last updated 2026-08-11): https://vercel.com/docs/routing/rewrites |
| [SW] | W3C Service Workers spec: https://w3c.github.io/ServiceWorker/ (Update algorithm; Match Service Worker Registration; Appendix B) |
| [MDN] | MDN `ServiceWorkerContainer.register()`: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register |
| [VPWA] | vite-plugin-pwa docs (Context7 `/vite-pwa/docs`): `guide/static-assets.md`, `deployment/nginx.md`, `workbox/generate-sw.md` |
| [LIVE] | `curl -sI` against production `rugby.waynetellis.com` on 2026-09-27 |

## 1. Can a Next rewrite proxy `/rota/*` to an external Vite deployment? Yes

- **There is precedent.** The hub already proxies RAM this way ([PS] `next.config.mjs:26-29`). Both rules are host-scoped `beforeFiles` rewrites to `https://coaching-handrail.vercel.app/ram/:path*`. The portfolio-site CLAUDE.md and the brief both say "`/ram` is a 307 redirect". That is out of date. The 307 seen on `/ram` comes from the RAM app itself (`Location: /ram/aide-memoire`), and the hub passes it through [LIVE]. Commit `4d2ca5e feat(rugby): serve RAM at rugby.waynetellis.com/ram` switched RAM to a proxy.
- **External destinations are supported:** "Rewrite routes to an external URL … `destination: 'https://example.com/blog/:slug'`" [NX-RW]. Vercel calls this a "rewrite to an external origin", which lets Vercel act as a reverse proxy, including for microfrontends [VC-RW].
- **Ordering.** Next checks, in order: headers, redirects, proxy (middleware), `beforeFiles`, then public/static files and pages, `afterFiles`, dynamic routes, `fallback` [NX-RW]. The subdomain mapping lives in `beforeFiles` ([PS] `next.config.mjs:24-31`). A `/rota` rule has to go in `beforeFiles` as well, next to the RAM rules. In `afterFiles` or `fallback` it would never run, because the `beforeFiles` catch-all on line 30 has already rewritten `/rota/...` to `/rugby/rota/...`.
- **The catch-all has to exclude `rota`.** "rewrites in `beforeFiles` do not check the filesystem/dynamic routes immediately after matching a source, they continue until all `beforeFiles` have been checked" [NX-RW]. That is why line 30's negative lookahead already carves out `ram(?:/|$)`. Add `rota(?:/|$)` to it the same way.
- **Host redirect.** Line 17 redirects `waynetellis.com/rugby/:path*` to the subdomain. That is harmless: `waynetellis.com/rota` matches no rule and 404s.
- **Middleware.** `proxy.ts` only matches `/workshop/admin/:path*` ([PS] `proxy.ts:8-10`), so it does not touch `/rota`.

## 2. Can `/rota/sw.js` register with a `/rota` scope and cold-load offline? Yes, with a header

- **MIME type.** The script must be served with a JavaScript MIME type or registration rejects with `SecurityError` ([SW] Update step: "If this MIME type … is not a JavaScript MIME type … Reject"). Vercel serves `.js` as `application/javascript`, and the proxy passes `Content-Type` through (see the RAM responses in [LIVE]).
- **No redirects allowed on the SW script.** The Update algorithm sets "request's redirect mode to `error`" [SW]. `/rota/sw.js` has no trailing slash, so Next's slash redirect never fires on it. The upstream must not redirect it either.
- **Scope and the trailing-slash gotcha.** Next's default trailing-slash handling 308-redirects `/rota/` to `/rota` before any rewrite runs. [LIVE] shows `/rota/` returning `308 Location: /rota` with `Refresh: 0;url=/rota`, and `/ram/` doing the same. Scope matching is a plain string prefix test: "the longest value in scopeStringSet which the value of clientURLString starts with" ([SW] Match Service Worker Registration). A `/rota/` scope therefore does **not** control `https://rugby.waynetellis.com/rota`, which is the URL every coach actually lands on. The scope has to be `/rota`.
- **Max scope.** By default the maximum scope is the script's directory, which always ends in `/`. For `/rota/sw.js` that is `/rota/` [SW] [MDN]. `/rota` does not start with `/rota/`, so registering it is rejected unless the response sets `Service-Worker-Allowed: /rota`. MDN: "A service worker can't have a scope broader than its own location, unless the server specifies a broader maximum scope in a `Service-Worker-Allowed` header" [MDN].
- **Why not just turn off the slash redirect?** `skipTrailingSlashRedirect: true` [NX-TS] would let `/rota/` through. It is a global flag, though, and would change trailing-slash behaviour across the whole portfolio. The header is narrower.
- **Cold offline load.** Workbox `generateSW` precaches `index.html`, and `navigateFallback` answers navigations inside the scope from that precache. `html` must be in `globPatterns`, or Workbox throws `non-precached-url index.html` [VPWA static-assets]. The default glob already covers `js,css,html`, and the icons and logo have to be added. When the network is down the SW answers before any request leaves the device, so the hub, the proxy and the 308 are never involved offline.
- **Update checks.** Browsers skip the HTTP cache for the top-level SW script (`updateViaCache` defaults to `imports` [SW]), so a stale `sw.js` sitting in the browser cache is not a risk. A stale copy in the Vercel CDN is (see point 4).

## 3. Does portfolio-site already register a SW or a manifest that would clash? No

- A grep for `serviceWorker|manifest|sw.js|next-pwa|serwist|workbox` across `app/`, `public/` and `package.json` in portfolio-site finds nothing. There is no `app/manifest.*` and no `public/sw.js` ([PS]).
- Even if the hub adds one later, registrations are keyed by scope. The browser picks the longest matching scope, so `/rota` would win for rota URLs [SW]. The real risk would be a hub SW scoped to `/` whose `navigateFallback` catches `/rota` navigations while no rota SW is installed yet. If that ever happens, the hub SW needs `navigateFallbackDenylist: [/^\/rota/]` [VPWA generate-sw].

## 4. Caching and header gotchas

1. **The hub's CSP applies to proxied responses.** `/ram/aide-memoire` comes back with the hub's full `Content-Security-Policy`, `X-Frame-Options: DENY`, and so on, even though coaching-handrail does not send them itself [LIVE]. These headers come from [PS] `next.config.mjs:34-68` (`source: '/:path*'`). What that means for the rota:
   - `src/index.css:1` `@import url('https://fonts.googleapis.com/...')` is blocked by `style-src 'self' 'unsafe-inline'` and `font-src 'self' data:`. **Self-host the fonts** (e.g. `@fontsource/figtree`, `@fontsource/big-shoulders-display`). That also makes them precachable offline, which cross-origin Google Fonts are not by default.
   - The rest is fine. The Vite build emits only same-origin module scripts. `worker-src` and `manifest-src` fall back to `'self'`. The `wa.me` link is a navigation (`window.open`), not a fetch.
2. **Vercel CDN caching of proxied responses.** "Vercel honors `cache-control`, `CDN-Cache-Control`, and `Vercel-CDN-Cache-Control` headers from upstream servers on external rewrites." This is on by default for projects created on or after 2026-04-06. Older projects stay uncached unless they opt in [VC-RW]. Whichever case the hub is, a rota deploy does not purge the hub's CDN. So the non-hashed files (`index.html`, `sw.js`, `manifest.webmanifest`, `registerSW.js`) must not be CDN-cached: have the upstream send `Cache-Control: public, max-age=0, must-revalidate` for them. That is Vercel's static default and also what [VPWA nginx] recommends. Hashed `/rota/assets/*` can be `immutable` [VPWA nginx]. An alternative from [VC-RW] is to set `x-vercel-enable-rewrite-caching: 0` for `/rota/:path*` on the hub. The docs show it in `vercel.json`, so check that it also works from Next `headers()`.
3. **SPA fallback for deep links.** The app has only `/` and `*` routes (`src/App.tsx:18-21`), so deep links barely matter. Online, the upstream still needs to serve `index.html` for unknown `/rota/*` paths. Offline, `navigateFallback` covers it.
4. **Router basename.** `BrowserRouter` (`src/App.tsx:17`) needs `basename="/rota"`. Without it, `/rota` matches the `*` route and renders NotFound.
5. **Absolute public paths.** `src="/trojans_logo.png"` at `src/components/Header.tsx:43` and `src/components/RotationGrid.tsx:75` does not get the Vite `base` prefix. On the hub, that path hits the line-30 catch-all and becomes `/rugby/trojans_logo.png`, which 404s. Use `` `${import.meta.env.BASE_URL}trojans_logo.png` `` instead.
6. **Redirect loop risk.** The hub turns `/rota/` into `/rota`. If the upstream ever redirected `/rota` back to `/rota/` (e.g. `trailingSlash: true` in the upstream `vercel.json`), requests would loop forever. Keep the upstream slash-agnostic, using rewrites and never redirects.
7. **Old address and the export/import migration (ADR 0003).** localStorage is scoped per origin, not per path. If the existing Vercel project also serves `/rota/` and redirects `/` to `/rota/`, coaches opening the old `*.vercel.app` bookmark still see their saved plans on that origin and can export them.

## 5. Minimal config

### portfolio-site `next.config.mjs` (hub)

```js
const ROTA_ORIGIN = 'https://<pitch-mate-rota>.vercel.app'; // current Vercel address

// in rewrites().beforeFiles, beside the RAM rules:
{ source: '/rota', has: [{ type: 'host', value: RUGBY_HOST }], destination: `${ROTA_ORIGIN}/rota` },
{ source: '/rota/:path*', has: [{ type: 'host', value: RUGBY_HOST }], destination: `${ROTA_ORIGIN}/rota/:path*` },
// and extend the catch-all lookahead on line 30:
//   (?!_next|rugby|ram(?:/|$)|rota(?:/|$)|api|fonts|images|...)
```

No hub header change is needed if the upstream sends `Service-Worker-Allowed` itself (the proxy passes upstream headers through). As a fallback, add a `headers()` entry with `source: '/rota/sw.js'`, `key: 'Service-Worker-Allowed'`, `value: '/rota'`.

### pitch-mate-rota `vite.config.ts`

```ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: '/rota/',
  build: { outDir: 'dist/rota' },           // files physically live under /rota on the upstream
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,                // register manually so the scope can be '/rota'
      manifest: {
        id: '/rota',
        name: 'Squad Rotation Tool',
        short_name: 'Rota',
        start_url: '/rota',
        scope: '/rota',
        display: 'standalone',
        theme_color: '#<trojans-blue>',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/rota/index.html',
      },
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  // ...resolve, test unchanged
}));
```

Register manually (e.g. in `src/main.tsx`) using `virtual:pwa-register` or plain JS:

```ts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/rota/sw.js', { scope: '/rota' });
}
```

### pitch-mate-rota `vercel.json` (upstream, new file)

```json
{
  "outputDirectory": "dist",
  "redirects": [{ "source": "/", "destination": "/rota/", "permanent": false }],
  "rewrites": [{ "source": "/rota/:path*", "destination": "/rota/index.html" }],
  "headers": [
    { "source": "/rota/sw.js", "headers": [
      { "key": "Service-Worker-Allowed", "value": "/rota" },
      { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" } ] },
    { "source": "/rota/assets/(.*)", "headers": [
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" } ] }
  ]
}
```

Vercel serves filesystem hits before `rewrites`, so real assets are served as files and only unknown paths fall back to `index.html`. With no `trailingSlash` setting, `/rota` resolves through the rewrite rather than being redirected, which avoids the loop in 4.6. The `/` to `/rota/` redirect only applies on the old `*.vercel.app` address, because the hub never sends `/` upstream.

### App code

- `BrowserRouter basename="/rota"` (`src/App.tsx:17`).
- Logo paths through `import.meta.env.BASE_URL` (`Header.tsx:43`, `RotationGrid.tsx:75`).
- Replace the Google Fonts `@import` (`src/index.css:1`) with self-hosted fonts.

## Open items to verify during implementation

- Check that the hub's Vercel project honours upstream `Cache-Control` as expected: run `curl -sI` twice on `/rota/sw.js` after deploy and confirm `x-vercel-cache` never shows a HIT on a stale body.
- Confirm Chrome's install prompt appears on `https://rugby.waynetellis.com/rota` with scope `/rota`. The spec allows it; test on a real Android device.
- Confirm the full offline cold start: install, force-quit, enable airplane mode, launch from the home screen.
