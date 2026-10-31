# AJ — Digital World

An interactive personal site — one page, fourteen chapters and a closing scene, an environment that
re-tints itself as you move through it, and Clover, a digital dog who shows
visitors around. Hosted for free on GitHub Pages.

---

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run lint     # oxlint
npm test         # unit tests (Node's built-in runner, no extra dependencies)
npm run test:e2e # build, serve at /digital-world/ and run the browser suites
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

---

## Where to change things

| What | File |
| --- | --- |
| All writing — intro, chapters, facts, builds, Clover's facts | `src/data/content.ts` |
| Chapters, palettes, backdrops, the game worlds | `src/data/worlds.ts` |
| The intro (duality composition, glitch sequence) | `src/components/chrome/Intro.tsx`, layout in `src/lib/duality.ts` (+ `.intro`/`.duo-*` in `src/index.css`) |
| Intro artwork (generated web copies + manifest) | `scripts/profile-art.py` → `public/intro/`, `src/data/introArt.ts` |
| Game artwork (generated web copies + manifest) | `scripts/game-art.py` → `public/games/`, `src/data/gameArt.ts` |
| The One Piece and Loki chapters | `src/sections/OnePiece.tsx`, `src/sections/Loki.tsx`, copy in `ONE_PIECE` / `LOKI` in `src/data/content.ts` (+ `.g5-*`, `.hat-*`, `.loki-*`, `.purpose-*` in `src/index.css`) |
| Show artwork (generated web copies + manifest) | `scripts/show-art.py` → `public/shows/`, `src/data/showArt.ts` |
| The closing sequence (glass, closing line, footer) | `src/sections/Finale.tsx`, copy in `FINALE` in `src/data/content.ts` (+ `.finale-*` in `src/index.css`) |
| The ending's video clip | `scripts/finale-clip.py` → `public/finale/glass-break.mp4` |
| The Monster Hunter ecosystem | `src/effects/Ecosystem.tsx` (+ `.eco-*` in `src/index.css`) |
| The car on the night drive | `src/effects/Envista.tsx`, animated by `src/effects/RoadCanvas.tsx` |
| What Clover understands and how he answers | `src/clover/brain.ts` |
| Who has AJ's heart (the questions Clover recognises) | `src/clover/heart.ts` |
| Clover's artwork (head and full body) | `src/clover/CloverArt.tsx` |
| The AJ monogram | `src/components/ui/Logo.tsx` (+ `public/favicon.svg`) |
| Design tokens, type, motion | `src/index.css` |
| Public links in the footer | `LINKS` at the top of `src/sections/Finale.tsx` |
| Page title, description, social preview tags | `index.html` |
| Word puzzle answers | `WORDS` in `src/sections/Words.tsx` |
| Chess puzzles | `PUZZLES` in `src/lib/chess.ts` |

### Adding a chapter

Add an entry to `SCENES` in `src/data/worlds.ts` (id, label, palette,
backdrop), write a section component in `src/sections/`, and drop it into the
list in `src/App.tsx`. Add the id to `VOICES` in `src/audio/ambient.ts` and,
if Clover should know about it, to `PLACES`/`SUGGEST` in `src/clover/brain.ts`.

---

## Clover

Clover is a **local** assistant: what a visitor types is matched against
hand-written intents in `src/clover/brain.ts`, entirely in the browser. There
is no AI model, no server, and nothing typed is sent anywhere or stored.
Every factual answer is assembled from `src/data/content.ts`, so he can only
say what the site already says.

He can give a guided tour, take visitors to any chapter, answer questions about
what AJ has published here, explain the site, and do a few (fictional) tricks.
Ask him who AJ has a crush on — or who he loves — and he perks up and answers
in AJ's own words: "Jesus is my King!" (the matching lives in
`src/clover/heart.ts`, with its own tests).
Questions about private details — surname, location, age, contact, the real
dog — get a polite refusal by design.

**If you want a real language model later:** it needs a small server-side
proxy (e.g. a serverless function) that holds the API key — a key must never
be in this repository or the browser bundle — plus rate limiting, a clear
notice that messages leave the browser, and a system prompt restricted to the
site's content. GitHub Pages alone can't host that part.

---

## Privacy

- The public identity is **AJ** — no surname anywhere in the site, metadata,
  structured data or images.
- No cookies, analytics or trackers. Fonts are bundled with the site
  (`@fontsource`), so a visit makes no third-party requests.
- The only thing stored is `sessionStorage` flags for "intro seen" and
  "Clover said hello" — they vanish when the tab closes.
- Before adding content, ask: does this reveal a location, a routine, contact
  details, or anything useful for account recovery or social engineering?

---

## Performance notes

Things that keep the site smooth — worth keeping in mind when adding to it:

- **Nothing animates at rest.** Decorative CSS animation pauses when its
  chapter is off screen (`.is-offscreen`), the starfield is painted once, and
  its parallax is a scroll-driven CSS animation.
- **Animate `transform` and `opacity` only.** No blur filters on scroll
  reveals; one shared `IntersectionObserver` drives every reveal.
- **Palettes are static per chapter.** Each section carries its own colours
  (`SectionShell`); only the small floating UI follows the active chapter
  (`ChromeEnv`). Changing a custom property on `:root` would restyle the
  whole document on every chapter change.
- **No animation library.** Motion is CSS; the few scroll-linked indicators
  write transforms directly instead of re-rendering React.

---

## Artwork and images

The backdrops, the logo, Clover, the Monster Hunter ecosystem and the car are
**drawn in code** — nothing to load, nothing to license. The pictures are AJ's
own artwork in the intro, the game artwork, and the One Piece and Loki artwork.

**Intro artwork.** Put the four originals — the white and red rim-lit
portraits and the white and red chess lineups — in `Profile/` (kept out of
git) and run:

```bash
python3 scripts/profile-art.py
```

The script recognises each image by what it shows (shape: portrait or
lineup; light: white or red), not by its filename, and skips anything it
can't place. It writes AVIF + WebP copies to `public/intro/` (portraits at
640 / 960 / 1312 px, never upscaled) and regenerates `src/data/introArt.ts`.
It also joins the two lineups into one — white king, queen and knight, then
red rook, bishop, pawn and signature — at the gap where both put the seam,
raising the red one 28px so the neon line runs on unbroken. The red portrait
is mirrored in CSS, not in the file, so the two sit back to back.

**Game artwork.** Put original images in `Games/` (kept out of git — only the
web copies are published), map each file to a game id in `SOURCES` at the top
of `scripts/game-art.py`, and run:

```bash
pip install pillow        # once; needs Pillow 11+ for AVIF
python3 scripts/game-art.py
```

It writes resized AVIF + WebP copies (640 / 1280 / 1920 px wide, never
upscaled, metadata stripped) to `public/games/` and regenerates
`src/data/gameArt.ts`. The Games chapter serves the smallest file that fits,
lazy-loads everything off screen, and falls back to the world's procedural
scene if an image is missing or fails to load. Files not listed in `SOURCES`
are skipped and reported — images are never matched to games by filename
guesswork. The game artwork belongs to its studios and publishers; only
publish images you're comfortable using.

**Show artwork.** The One Piece and Loki chapters work the same way: originals
in `Shows/` (kept out of git), mapped by filename in `SOURCES` at the top of
`scripts/show-art.py`, then:

```bash
python3 scripts/show-art.py
```

It writes AVIF + WebP copies at 640 / 1280 / 1920 px to `public/shows/` and
regenerates `src/data/showArt.ts`. Missing or failed artwork falls back to a
painted backdrop in the chapter's colours, so the layout never breaks. The
artwork belongs to its owners (Eiichiro Oda / Shueisha / Toei Animation, and
Marvel Studios / Disney) and is credited under each chapter. The only
quotations are Loki's two lines in `LOKI` — everything labelled a reflection
is AJ's own commentary.

**The ending.** The page closes on a few seconds of glass breaking, taken
from a free-to-use effects pack (VFX GURU, credited in the footer). Put the
original `.mp4` in `Videos/` (kept out of git) and run:

```bash
python3 scripts/finale-clip.py
```

It cuts the stretch the ending uses (`START`/`END` at the top of the script)
into `public/finale/glass-break.mp4` **losslessly** — the same compressed
frames, copied into a new MP4, no re-encoding and no ffmpeg needed — and drops
the audio, since the ending always plays muted (about 1.9 MB instead of
14 MB). The poster stills in `public/finale/` are a frame from the clip.

How it behaves (`src/sections/Finale.tsx`): the clip is only requested once
the visitor is a screen away from the bottom; it plays once, muted and inline,
when the closing scene is mostly in view; the closing line appears inside the
hole in the glass, then it settles on the AJ mark, the line, and two controls
— back to the top, and replay. Skip is offered while it plays. Scrolling away
mid-play settles it rather than restarting it later. If the video can't load
or autoplay is refused, the still composition is shown instead. With reduced
motion it starts settled, downloads nothing, and offers "Play the ending".

The social images are rendered from HTML templates in `scripts/` (colours in
`scripts/brand.css` and `scripts/brand.js`)
(`og.html` → `public/og.jpg` at 1200×630, `share.html` →
`share/enter-my-little-world.jpg` at 1080×1080, `icon.html` →
`public/icon-180.png` at 180×180). Open one in a browser at that size and
screenshot it, or render it headlessly. They load fonts from `node_modules`,
so run `npm install` first.

---

## Notes

- **The intro** plays once per browser session and never for deep links.
  Visitors enter by **pressing and holding** the composition (mouse, touch
  or pen through one Pointer Events path, or holding Space / Enter) for
  `HOLD_MS` (1.15s, in `Intro.tsx`); letting go early drains the progress.
  "Skip intro" (the first Tab stop) and Escape go straight in. There is no
  auto-exit. On entry a circle opens from the AJ mark onto the home page and
  the mark flies to the hero emblem (`data-hero-mark`); the hero's entrance
  plays as it opens. With reduced motion the composition is still, the hold
  ring still fills, and entry is immediate. The page underneath is built
  from the start, rendered once the intro is waiting (`is-behind`, animations
  paused), and not rendered before that (`is-covered`) — see `App.tsx`.
- **Palette**: near-black, white / cool silver, and crimson, from the intro.
  Each chapter's colours live in `SCENES` in `src/data/worlds.ts` (`ray` is
  the white light from the left, `glow` the red from the right). The game
  worlds, Clover's chapter, the drive and the two shows keep their own
  environments — straw-hat red and gold for One Piece; emerald, with gold as
  the second light, for Loki. Those stay local to their chapter.
- **Sound** never plays on its own. The Ambient button generates a soft tone
  live in the browser (Web Audio) — there are no audio files.
- **Reduced motion** is respected throughout.
- **Hidden things**: press `/` for a terminal (`help` lists commands), click
  the AJ mark five times, or try the Konami code.
- **Stack**: React 19, Vite, TypeScript, Tailwind CSS v4. No animation library;
  backgrounds are hand-written `<canvas>` and SVG.
- **Tests**: `tests/*.test.ts`, run by `npm test` through `tests/run.mjs`.
  `tests/register.mjs` lets Node load the app's TypeScript using the project's
  own `typescript` package, so no test framework is installed.
- **Browser tests**: `tests/e2e/`, run by `npm run test:e2e` (add `-- --no-build`
  to reuse `dist/`). They drive headless Chromium through `playwright-core`;
  run `npx playwright-core install chromium` once first, or set `CHROME_PATH`.
  The privacy check reads words that must never appear on the site from
  `tests/e2e/private-words.txt`, one per line. That file is git-ignored so the
  words stay local; without it the check is skipped.
