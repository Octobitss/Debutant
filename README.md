# Trina's XVIII — Wildest Dreams

An interactive, cinematic debut invitation website: a tearable paper entrance built in
Three.js/WebGL, a persistent floating-petal atmosphere, scroll-driven camera movement,
and a full storytelling flow from countdown to RSVP.

## Getting started

```bash
npm install
npm run dev
```

Opens the site at `http://localhost:5173` with hot reload (Vite).

## Other commands

| Command | What it does |
| --- | --- |
| `npm run build` | Production build via Vite → `dist-vite/` |
| `npm run preview` | Serve the Vite production build locally |
| `npm run placeholders` | Regenerate the placeholder WebP art in `public/assets/images/` |
| `npm run gulp:build` | Compile SCSS → `dist/main.min.css` and bundle/minify JS → `dist/main.min.js`, copy assets, emit a static `dist/index.html` |
| `npm run gulp:watch` (or `npx gulp watch`) | Same as above, then watches `src/scss`, `src/js`, `public/assets`, and `index.html` for changes |

Both build paths are independent: `npm run dev`/`build` works straight off `src/` for day-to-day
development, while the Gulp pipeline produces a fully static `dist/` folder (no build tooling
required to host it) for simple deployments.

## Editing content

Everything content-related lives in one place: **[src/js/config.js](src/js/config.js)**.

```js
export const SITE_CONFIG = {
  debutantName: "Trina",
  title: "Trina's XVIII",
  subtitle: "Wildest Dreams",
  tagline: "A Night of Fairy Tales and Endless Memories",
  event: { date: "2026-12-12T18:00:00+08:00", displayDate: "...", displayTime: "..." },
  venue: { name: "...", address: "...", latitude: null, longitude: null },
  rsvp: { url: "https://forms.gle/jcm1jQLy4WrLwLaUA" }
};
```

Changing `event.date`/`displayDate`/`displayTime`, `venue.name`/`address`, or `rsvp.url` updates
the countdown, the hero/venue/maps text, and the RSVP button everywhere at once — those elements
are bound at runtime via `data-bind="event.displayDate"` / `data-bind-href="rsvp.url"` attributes
in `index.html`.

## Replacing images

All imagery lives in `public/assets/images/` and is referenced by stable filenames, so swapping
in real photography is just overwriting the file — no code changes needed:

- `debutant-placeholder.webp` — hero portrait (3:4)
- `venue-1.webp`, `venue-2.webp`, `venue-3.webp` — venue gallery
- `dresscode-girls.webp`, `dresscode-boys.webp` — dress code cards (3:4)
- `floral-1.webp`, `floral-3.webp` — transparent corner flourishes
- `floral-2.webp` — story section image (4:5)
- `invitation-cover.webp` — the tearable entrance artwork

Run `npm run placeholders` any time to regenerate the current placeholder set (defined in
`scripts/generate-placeholders.mjs`) if you want to tweak the stand-in art itself.

## Google Maps

Drop your embed iframe straight into `index.html` inside `<div id="google-map">`. The "See My
Location" and "Get Directions" buttons work without any API key (they use the Geolocation API and
a Google Maps directions URL); `SITE_CONFIG.maps.apiKey` is reserved if you later want to upgrade
to live ETAs via the Distance Matrix API.

## Background music

Disabled by default. Set `AUDIO_CONFIG.enabled = true` in `src/js/config.js` and point `source` at
a licensed audio file under `public/assets/audio/` — playback only ever starts from a real user
gesture (the entrance tear/tap), never automatically.
