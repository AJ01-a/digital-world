// The duality intro: images, white-left / red-right, the glitch sequence,
// hold to enter (mouse, touch, keyboard), cancelling, skip, the way into the
// home page, reduced motion, cleanup, image loading, and layout.
// Usage: node tests/e2e/intro.mjs <url>  (or `npm run test:e2e`)
import { launch } from './browser.mjs';

const URL_ = process.argv[2];
const b = await launch();
let fails = 0;
const errs = [];
const check = (name, ok, info = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info !== '' ? ' — ' + info : ''}`);
};

// Landmarks of the face in the unmirrored portrait (src/lib/duality.ts FACE).
const FACE = { x0: 0.25, x1: 0.53, y0: 0.29, y1: 0.67 };

async function page({ w = 1440, h = 900, reduced = false, touch = false, seen = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: touch, isMobile: touch });
  await ctx.addInitScript((seen) => {
    sessionStorage.setItem('aj:clover-greeted', '1');
    if (seen) sessionStorage.setItem('aj:intro-seen', '1');
    // Tag the intro's boundary animation frames, to prove they stop.
    const raf = window.requestAnimationFrame.bind(window);
    window.__swayFrames = 0;
    window.requestAnimationFrame = (cb) => raf((t) => {
      if (/\.cur\b/.test(String(cb)) && /\.target\b/.test(String(cb))) window.__swayFrames++;
      cb(t);
    });
  }, seen);
  const p = await ctx.newPage();
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', (e) => errs.push(String(e)));
  const images = [];
  p.on('response', (r) => r.url().includes('/intro/') && images.push({ url: r.url().replace(/.*\/intro\//, ''), status: r.status(), full: r.url() }));
  return { p, ctx, images };
}

const facesOnScreen = (p) =>
  p.evaluate((FACE) => {
    const r = (sel) => document.querySelector(sel).getBoundingClientRect();
    const white = r('.duo-white .duo-portrait');
    const red = r('.duo-red .duo-portrait');
    const face = (q, mirrored) => {
      const x0 = mirrored ? 1 - FACE.x1 : FACE.x0;
      return { x: q.left + x0 * q.width, y: q.top + FACE.y0 * q.height, w: (FACE.x1 - FACE.x0) * q.width, h: (FACE.y1 - FACE.y0) * q.height };
    };
    const wf = face(white, false);
    const rf = face(red, true);
    const on = (f) => f.x >= 0 && f.y >= 0 && f.x + f.w <= innerWidth && f.y + f.h <= innerHeight;
    return { whiteLeft: wf.x + wf.w / 2 < rf.x + rf.w / 2, onScreen: on(wf) && on(rf), wf: Math.round(wf.w), overflow: document.documentElement.scrollWidth > innerWidth };
  }, FACE);

/* 1 — the right images, from the right place, each fetched once */
{
  const { p, ctx, images } = await page();
  await p.goto(URL_);
  await p.waitForTimeout(4600);
  const srcs = await p.evaluate(() => ({
    white: document.querySelector('.duo-white .duo-reveal').currentSrc,
    red: document.querySelector('.duo-red .duo-reveal').currentSrc,
    chess: document.querySelector('.duo-chess img').currentSrc,
    redMirrored: getComputedStyle(document.querySelector('.duo-red .duo-portrait')).transform,
  }));
  check('white portrait on the white side', /intro\/white-\d+\.(avif|webp)$/.test(srcs.white), srcs.white.split('/').pop());
  check('red portrait on the red side', /intro\/red-\d+\.(avif|webp)$/.test(srcs.red), srcs.red.split('/').pop());
  check('red portrait mirrored so the two sit back to back', srcs.redMirrored.startsWith('matrix(-1'), srcs.redMirrored);
  check('chess lineup loaded', /intro\/chess-\d+\.(avif|webp)$/.test(srcs.chess), srcs.chess.split('/').pop());
  check('intro images served from the site path', images.length > 0 && images.every((i) => i.status === 200 && i.full.startsWith(URL_)), images.map((i) => `${i.status} ${i.url}`).join(', '));
  const per = (n) => images.filter((i) => i.url.startsWith(n + '-')).length;
  check('each portrait downloaded once (preload and <img> agree)', per('white') === 1 && per('red') === 1, `white ×${per('white')}, red ×${per('red')}`);
  const layout = await facesOnScreen(p);
  check('white on the left, red on the right', layout.whiteLeft);
  check('both faces fully on screen', layout.onScreen, `face width ${layout.wf}px`);
  await ctx.close();
}

/* 2 — the sequence, and then it waits to be held */
{
  const { p, ctx } = await page();
  await p.goto(URL_);
  await p.waitForTimeout(1000);
  check('glitch slices during the reveal', (await p.locator('.duo-slice').count()) === 10);
  await p.waitForTimeout(1000);
  check('glitch slices removed once the reveal is over', (await p.locator('.duo-slice').count()) === 0);
  await p.waitForTimeout(2300);
  const st = await p.evaluate(() => [getComputedStyle(document.querySelector('.intro-mark')).opacity, getComputedStyle(document.querySelector('.duo-chess')).opacity, document.querySelector('.duo-decode').textContent, document.querySelector('.duo-hint').textContent, +getComputedStyle(document.querySelector('.duo-hint')).opacity]);
  check('mark, chess and wordmark in place by ~4s', st[0] === '1' && st[1] === '1' && st[2] === 'DIGITAL WORLD', JSON.stringify(st.slice(0, 3)));
  check('"Hold to enter" shown under the mark', st[3] === 'Hold to enter' && st[4] > 0.3, JSON.stringify(st.slice(3)));
  await p.waitForTimeout(4000);
  check('no auto-exit: the intro waits to be held', !!(await p.$('.intro')));
  await ctx.close();
}

/* 3 — mouse: click, early release, and a full hold */
{
  const { p, ctx } = await page();
  await p.goto(URL_);
  await p.evaluate(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    window.__entries = 0;
    new MutationObserver(() => { const i = document.querySelector('.intro'); if (i?.classList.contains('is-leaving') && !i.__counted) { i.__counted = true; window.__entries++; } }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  await p.waitForTimeout(4200);
  const arcs = () => p.evaluate(() => [...document.querySelectorAll('.hold-arc')].map((a) => +parseFloat(getComputedStyle(a).strokeDashoffset).toFixed(2)));

  // A click is not a hold: it lights the side that was clicked, and nothing else.
  await p.mouse.click(250, 450);
  await p.waitForTimeout(400);
  check('a click does not enter', !!(await p.$('.intro')) && !(await p.$('.intro.is-leaving')));
  check('a click lights the side clicked', await p.evaluate(() => document.querySelector('.intro').classList.contains('pulse-white')));

  // Let go early: progress drains away.
  await p.mouse.move(400, 500);
  await p.mouse.down();
  await p.waitForTimeout(550);
  const mid = await arcs();
  const holding = await p.evaluate(() => document.querySelector('.intro').classList.contains('is-holding'));
  check('holding: both arcs fill together', holding && mid.every((x) => x > 0.15 && x < 0.85) && mid[0] === mid[1], JSON.stringify(mid));
  await p.mouse.up();
  await p.waitForTimeout(700);
  const after = await arcs();
  check('releasing early cancels: progress drains, still in the intro', after.every((x) => x === 1) && !(await p.$('.intro.is-leaving')) && !(await p.$('.intro.is-holding')), JSON.stringify(after));
  check('hint resets after an early release', (await p.textContent('.duo-hint')) === 'Hold to enter');

  // Switching away mid-hold lets go too.
  await p.mouse.down();
  await p.waitForTimeout(300);
  await p.evaluate(() => window.dispatchEvent(new Event('blur')));
  await p.waitForTimeout(1300);
  await p.mouse.up();
  check('leaving the window mid-hold cancels it', !(await p.$('.intro.is-leaving')));

  // Hold all the way.
  await p.mouse.down();
  await p.waitForTimeout(1000);
  check('nearly there: "Entering Digital World…"', (await p.textContent('.duo-hint')) === 'Entering Digital World…');
  await p.waitForTimeout(350);
  const leaving = await p.evaluate(() => [!!document.querySelector('.intro.is-leaving'), document.documentElement.classList.contains('mark-in-flight'), getComputedStyle(document.querySelector('.intro')).pointerEvents]);
  check('a full hold enters; the intro stops taking clicks at once', leaving[0] && leaving[2] === 'none', JSON.stringify(leaving));
  check('the mark flies to the home page emblem', leaving[1]);
  // Try to enter again, every way, while it is already on its way.
  await p.keyboard.press('Escape');
  await p.mouse.up();
  await p.mouse.down();
  await p.waitForTimeout(1400);
  await p.mouse.up();
  const done = await p.evaluate(() => ({
    intro: !!document.querySelector('.intro'),
    entries: window.__entries,
    inert: !!document.querySelector('[inert]'),
    covered: !!document.querySelector('.is-covered'),
    overflow: document.documentElement.style.overflow,
    top: document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.intro'),
    heroMark: getComputedStyle(document.querySelector('[data-hero-mark]')).opacity,
    inFlight: document.documentElement.classList.contains('mark-in-flight'),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--env-accent').trim(),
    heroText: getComputedStyle(document.querySelector('#hero-title [aria-hidden]')).opacity,
    scroll: document.documentElement.scrollWidth > innerWidth,
  }));
  check('entered exactly once', !done.intro && done.entries === 1, JSON.stringify(done));
  check('home page live: not inert, scrollable, nothing covering it', !done.inert && !done.covered && done.overflow === '' && !done.top && !done.scroll);
  check('the mark has landed in the hero emblem', done.heroMark === '1' && !done.inFlight);
  check('home page in the intro palette (crimson accent)', done.accent === '#ff4a57', done.accent);
  await p.waitForTimeout(800);
  check('the hero has risen into view', (await p.evaluate(() => getComputedStyle(document.querySelector('#hero-title [aria-hidden]')).opacity)) === '1');
  check('no layout shift through the whole way in', (await p.evaluate(() => window.__cls)) === 0, await p.evaluate(() => window.__cls));
  const gone = await p.evaluate(() => window.__swayFrames);
  await p.waitForTimeout(500);
  check('no intro animation frames after entering', (await p.evaluate(() => window.__swayFrames)) === gone);
  await ctx.close();
}

/* 4 — pointer: the side under it leans in; the boundary animation settles */
{
  const { p, ctx } = await page();
  await p.goto(URL_);
  await p.waitForTimeout(4200);
  const clip = () => p.evaluate(() => document.querySelector('.duo-white').style.clipPath);
  const before = await clip();
  await p.mouse.move(200, 450, { steps: 4 });
  await p.waitForTimeout(700);
  const left = await p.evaluate(() => [document.querySelector('.intro').dataset.side, getComputedStyle(document.querySelector('.duo-white .duo-lit')).opacity, getComputedStyle(document.querySelector('.duo-red .duo-portrait')).opacity]);
  check('hovering the white side lights it and dims red a little', left[0] === 'white' && +left[1] > 0.3 && +left[2] < 1, JSON.stringify(left));
  check('the boundary leans towards the other side', before !== (await clip()));
  await p.mouse.move(1240, 450, { steps: 4 });
  await p.waitForTimeout(1500);
  check('hovering the red side lights red', (await p.evaluate(() => document.querySelector('.intro').dataset.side)) === 'red');
  await p.locator('.duo-chess').click();
  check('the chess lineup answers, without entering', (await p.evaluate(() => document.querySelector('.intro').classList.contains('chess-play'))) && !(await p.$('.intro.is-leaving')));
  let frames = await p.evaluate(() => window.__swayFrames);
  let settled = -1;
  for (let i = 0; i < 10 && settled !== frames; i++) {
    settled = frames;
    await p.waitForTimeout(500);
    frames = await p.evaluate(() => window.__swayFrames);
  }
  check('boundary animation stops once it settles', frames > 0 && settled === frames, `${frames} frames in all`);
  await ctx.close();
}

/* 5 — keyboard: skip first, then the hold area; hold Space to enter */
{
  const { p, ctx } = await page();
  await p.goto(URL_);
  await p.waitForTimeout(600);
  await p.keyboard.press('Tab');
  const first = await p.evaluate(() => document.activeElement?.textContent);
  await p.keyboard.press('Tab');
  const second = await p.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  check('Tab: "Skip intro" first, then the hold area, labelled', first === 'Skip intro' && /^Hold to enter/.test(second ?? ''), `${first} → ${second}`);
  await p.keyboard.press('Space');
  await p.waitForTimeout(500);
  check('a quick Space press does not enter', !(await p.$('.intro.is-leaving')));
  await p.keyboard.down('Space');
  await p.waitForTimeout(1350);
  await p.keyboard.up('Space');
  check('holding Space enters', !!(await p.$('.intro.is-leaving')) || !(await p.$('.intro')));
  await ctx.close();

  const k = await page();
  await k.p.goto(URL_);
  await k.p.waitForTimeout(500);
  await k.p.keyboard.press('Tab');
  await k.p.keyboard.press('Enter');
  await k.p.waitForTimeout(1500);
  check('"Skip intro" by keyboard goes straight in', !(await k.p.$('.intro')));
  await k.ctx.close();
}

/* 6 — touch: a tap lights a side; a long press enters */
{
  const { p, ctx } = await page({ w: 390, h: 844, touch: true });
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await p.goto(URL_);
  await p.waitForTimeout(4200);
  check('stacked layout on a phone', await p.evaluate(() => document.querySelector('.intro').classList.contains('is-stacked')));
  await touch('touchStart', 120, 200);
  await p.waitForTimeout(80);
  await touch('touchEnd');
  await p.waitForTimeout(150);
  check('a tap lights the side tapped, without entering', (await p.evaluate(() => document.querySelector('.intro').classList.contains('pulse-white'))) && !(await p.$('.intro.is-leaving')));
  await touch('touchStart', 200, 600);
  await p.waitForTimeout(600);
  await touch('touchEnd');
  await p.waitForTimeout(500);
  check('a short press is cancelled', !(await p.$('.intro.is-leaving')));
  const ctxMenu = await p.evaluate(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.querySelector('.duo-hold').dispatchEvent(e); return e.defaultPrevented; });
  check('long-press menu suppressed on the hold area', ctxMenu);
  const ta = await p.evaluate(() => getComputedStyle(document.querySelector('.duo-hold')).touchAction);
  check('the hold area takes the touch (no scroll or zoom gestures)', ta === 'none', ta);
  await touch('touchStart', 200, 600);
  await p.waitForTimeout(1350);
  await touch('touchEnd');
  await p.waitForTimeout(1500);
  check('a long press enters', !(await p.$('.intro')));
  const box = await p.getByRole('button', { name: 'Chat with Clover, the site guide' }).boundingBox().catch(() => null);
  check('home page interactive after entering on touch', !!box);
  await ctx.close();
}

/* 6b — reduced motion: still, but the hold still works and its ring fills */
{
  const { p, ctx } = await page({ reduced: true });
  await p.goto(URL_);
  await p.waitForTimeout(400);
  const st = await p.evaluate(() => ({
    still: !!document.querySelector('.intro.is-still'),
    slices: document.querySelectorAll('.duo-slice').length,
    mark: getComputedStyle(document.querySelector('.intro-mark')).opacity,
    white: getComputedStyle(document.querySelector('.duo-white .duo-reveal')).opacity,
    word: document.querySelector('.duo-decode').textContent,
  }));
  check('reduced motion: everything in place at once, no glitch', st.still && st.slices === 0 && st.mark === '1' && st.white === '1' && st.word === 'DIGITAL WORLD', JSON.stringify(st));
  await p.mouse.move(400, 450);
  await p.mouse.down();
  await p.waitForTimeout(500);
  const mid = await p.evaluate(() => +getComputedStyle(document.querySelector('.hold-arc')).strokeDashoffset.replace('px', ''));
  check('reduced motion: the hold ring still fills over the hold', mid > 0.2 && mid < 0.9, mid.toFixed(2));
  await p.waitForTimeout(800);
  await p.mouse.up();
  await p.waitForTimeout(150);
  check('reduced motion: a full hold enters at once', !(await p.$('.intro')));
  await ctx.close();
}

/* 7 — no intro (and no intro images) for deep links and repeat visits */
for (const [name, opts, path] of [['deep link', {}, '#games'], ['second visit', { seen: true }, '']]) {
  const { p, ctx, images } = await page(opts);
  await p.goto(URL_ + path);
  await p.waitForTimeout(1500);
  check(`${name}: no intro and no intro images fetched`, !(await p.$('.intro')) && images.length === 0, `${images.length} image requests`);
  await ctx.close();
}

/* 8 — layout at several sizes */
for (const [w, h] of [[320, 568], [390, 844], [768, 1024], [1024, 768], [844, 390], [1920, 1080]]) {
  const { p, ctx } = await page({ w, h, reduced: true });
  await p.goto(URL_);
  await p.waitForTimeout(600);
  const l = await facesOnScreen(p);
  const word = await p.evaluate(() => {
    const r = document.querySelector('.intro-word').getBoundingClientRect();
    const btn = document.querySelector('.intro-skip').getBoundingClientRect();
    const hint = document.querySelector('.duo-hint').getBoundingClientRect();
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const on = (q) => q.top >= 0 && q.bottom <= innerHeight && q.left >= 0 && q.right <= innerWidth;
    return { inside: on(r) && on(hint), clear: !hit(r, btn) && !hit(hint, btn) };
  });
  check(`${w}×${h}: white left, red right, faces on screen, no overflow`, l.whiteLeft && l.onScreen && !l.overflow, `face ${l.wf}px`);
  check(`${w}×${h}: wordmark and hold hint on screen, clear of the button`, word.inside && word.clear, JSON.stringify(word));
  await ctx.close();
}

check('no console or page errors', errs.length === 0);
if (errs.length) console.log('CONSOLE ERRORS:\n' + errs.join('\n'));
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
await b.close();
process.exitCode = fails ? 1 : 0;
