# AJ's world

An interactive personal site — one page, eleven chapters, and an environment
that changes as you move through them. Built to be dropped into a Facebook bio
and hosted for free on GitHub Pages.

---

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
```

Node 20+ recommended.

---

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings → Pages → Build and deployment**, and set
   **Source** to **GitHub Actions**.
3. Push to `main`. The included workflow (`.github/workflows/deploy.yml`)
   builds the site and publishes it.

The workflow works out the public URL for you — `https://<you>.github.io/<repo>`
for a normal repository, or `https://<you>.github.io` if the repo is named
`<you>.github.io` — and bakes it into the social preview tags.

Building by hand instead? Edit `VITE_SITE_URL` in `.env` first, run
`npm run build`, and upload `dist/`. Vite is configured with `base: './'`, so
the build works from any path without further changes.

### Custom domain

Set `VITE_SITE_URL=https://your-domain.com` in `.env`, add your domain under
Settings → Pages, and commit a `public/CNAME` file containing the domain.

---

## Where to change things

| What | File |
| --- | --- |
| All writing — intro, sections, facts, terminal replies | `src/data/content.ts` |
| Chapters, colours, atmospheres, the four game worlds | `src/data/worlds.ts` |
| Social links in the footer | `LINKS` at the top of `src/sections/Outro.tsx` |
| Page title, description, social preview tags | `index.html` |
| Word puzzle answers | `WORDS` in `src/sections/Words.tsx` |
| Chess puzzles | `PUZZLES` in `src/lib/chess.ts` |

### Adding an interest later

Add an entry to `SCENES` in `src/data/worlds.ts` (id, label, palette, particle
mode), write a section component in `src/sections/`, and drop it into the list
in `src/App.tsx`. The background system, navigation and scroll tracking pick it
up automatically.

---

## Artwork

Every background in the site is **generated from code** — the tree, the moon and
ridges, the mountains, the city skyline, the sunset treeline — so there is no
third-party artwork to license and nothing to load. Colours come from the active
chapter, which is why the same shapes re-tint themselves per world.

If you would rather use your own photographs for the game cards:

1. Drop images into `public/worlds/` (1200×1600 or so, compressed).
2. Set the `image` field on that world in `src/data/worlds.ts`, e.g.
   `image: './worlds/elden.jpg'`.

The card and its backdrop switch to your image automatically. Use pictures you
have the right to publish — screenshots of games you own are generally fine for
a personal page, but stay away from official promotional art.

### Social preview image

`public/og.jpg` was rendered from `scripts/og.html`. Open that file in a browser
at 1200×630 and screenshot it if you ever want to change the preview card.

---

## Notes

- **Sound** never plays on its own. The Ambient button generates a soft tone
  bed live in the browser (Web Audio) — there are no audio files to download.
- **Reduced motion** is respected: particle fields, the road and the walking dog
  stop, and reveal animations resolve instantly.
- **Hidden things**: press `/` anywhere for a terminal (`help` lists commands),
  click the AJ mark five times, or try the Konami code.
- **Stack**: React 19, Vite, TypeScript, Tailwind CSS v4, Motion. Backgrounds
  are hand-written `<canvas>` and SVG — no Three.js, no image payload.
