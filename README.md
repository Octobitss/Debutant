# Where Eighteen Blooms

A cinematic, scroll-driven React invitation for Trina's 18th birthday: approach a mirror, step
through it into a whimsical memory garden, and journey through the venue, dress code, date and
RSVP to a final closing scene.

## Getting started

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` with hot reload (Vite).

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run placeholders` | Regenerate the placeholder WebP art in `public/assets/images/` |

## How the scroll journey works

- **Lenis** smooths the scroll and feeds it into **GSAP's** ticker, which keeps **ScrollTrigger**
  in sync (`src/hooks/useLenis.js`). Disabled entirely under `prefers-reduced-motion` — the site
  falls back to plain native scroll with all content immediately visible.
- The Mirror and Garden scenes are pinned (`ScrollTrigger` with `pin: true, scrub: 1`) so their
  internal timelines play out at a fixed scroll position before releasing to the next scene.
  Venue, Dress Code, RSVP and Outro use lighter scroll-triggered reveals as they scroll into view,
  no pinning.
- The mirror-portal transition (the "walking through the mirror" moment) is the only place using
  real 3D — a small React Three Fiber scene (`src/scenes/MirrorScene/MirrorPortalCanvas.jsx`) with
  a custom glass-distortion shader, code-split via `React.lazy` so it only loads once a visitor
  actually scrolls there. Everywhere else is CSS/GSAP-driven for reliability and performance.

## Editing content

Everything lives in **[src/config/siteConfig.js](src/config/siteConfig.js)** — debutant name,
event date/venue, RSVP link, dress code copy, and the garden letter text. Changing `event.date`
updates the fixed countdown everywhere automatically.

## Replacing images

All imagery is in `public/assets/images/`, referenced by stable filenames — overwrite them with
real photography, no code changes needed:

- `debutante-portrait.webp` — the portrait inside the mirror (3:4)
- `venue-1.webp`, `venue-2.webp`, `venue-3.webp` — venue gallery
- `dresscode-women.webp`, `dresscode-men.webp` — dress code cards (3:4)

Run `npm run placeholders` any time to regenerate the current placeholder set from
`scripts/generate-placeholders.mjs` if you want to tweak the stand-in art itself.

## Google Maps

Drop your embed iframe into `src/components/ui/MapEmbed.jsx` inside `<div id="google-map">`.
"Open in Google Maps" and "Check My Location" work without any API key — the latter uses the
Geolocation API and a clearly-labeled straight-line distance estimate. Set
`VITE_GOOGLE_MAPS_API_KEY` (copy `.env.example` to `.env`) to upgrade that estimate to a real
driving-time via Google's Distance Matrix API; set `SITE_CONFIG.venue.latitude/longitude` in
`siteConfig.js` for either mode to compute a distance at all.

## Background music

Disabled by default (`AUDIO_CONFIG.enabled` in `siteConfig.js`). Set it to `true` and point
`source` at a licensed audio file to reveal the sound toggle — playback only ever starts from that
toggle's click, never automatically.
