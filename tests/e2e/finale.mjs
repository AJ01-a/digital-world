// The closing sequence: lazy video, the full sequence, skip, scrolling away,
// replay, reduced motion, failures, keyboard, layout and small screens.
// Usage: node tests/e2e/finale.mjs <url>  (or `npm run test:e2e`)
import { launch } from './browser.mjs';

const URL_ = process.argv[2];
const b = await launch();
let fails = 0; const errs = [];
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info !== '' ? ' — ' + info : ''}`); };
async function page(opts = {}) {
  const w = opts.w ?? 1440;
  const ctx = await b.newContext({ viewport: { width: w, height: opts.h ?? 900 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', hasTouch: w < 700, isMobile: w < 700 });
  await ctx.addInitScript(() => { sessionStorage.setItem('aj:clover-greeted', '1'); sessionStorage.setItem('aj:intro-seen', '1'); });
  if (opts.refuse) await ctx.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('blocked', 'NotAllowedError')); });
  const p = await ctx.newPage();
  if (!opts.blocked) p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', (e) => errs.push(String(e)));
  const videos = []; p.on('request', (r) => r.url().endsWith('.mp4') && videos.push(r.url()));
  return { p, ctx, videos };
}
const state = (p) => p.evaluate(() => {
  const f = document.getElementById('finale'); const v = f.querySelector('video');
  return { phase: (f.className.match(/is-(waiting|playing|done)/) || [])[1], line: f.classList.contains('line-in'), t: v.currentTime, paused: v.paused, src: v.currentSrc.split('/').pop() };
});
const waitPhase = (p, phase, ms = 9000) => p.waitForFunction((ph) => document.getElementById('finale').classList.contains('is-' + ph), phase, { timeout: ms }).then(() => true, () => false);
const toBottom = (p) => p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

/* 1 — the sequence, start to finish */
{
  const { p, ctx, videos } = await page();
  const bad = []; p.on('response', (r) => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await p.goto(URL_); await p.waitForTimeout(1200);
  check('no video requested when the page loads', videos.length === 0, videos.join(', '));
  const st = await p.evaluate(async () => [(await fetch('finale/glass-break.mp4', { method: 'HEAD' })).status, (await fetch('finale/glass-break.mp4', { method: 'HEAD' })).headers.get('content-length')]);
  check('clip is served from the build under the subpath', st[0] === 200 && +st[1] < 2.5e6, `${st[0]} · ${(+st[1] / 1e6).toFixed(2)} MB`);
  const last = await p.evaluate(() => { const m = document.querySelector('main'); return [m.lastElementChild.id, document.querySelector('#finale footer') !== null]; });
  check('the finale is the last thing on the page, footer inside it', last[0] === 'finale' && last[1], last.join(' / '));
  await p.evaluate(() => document.getElementById('outro').scrollIntoView()); await p.waitForTimeout(900);
  check('video is fetched on the approach, before it is needed', videos.length >= 1 && videos.every((u) => u.endsWith('finale/glass-break.mp4')), videos.length + ' requests');
  check('nothing plays before the visitor arrives', (await state(p)).phase === 'waiting');
  const h0 = await p.evaluate(() => document.querySelector('.finale-stage').getBoundingClientRect().height);
  await toBottom(p);
  check('arriving starts the sequence', await waitPhase(p, 'playing', 4000));
  const actionsHidden = await p.evaluate(() => getComputedStyle(document.querySelector('.finale-actions')).visibility);
  check('controls stay out of reach while it plays', actionsHidden === 'hidden', actionsHidden);
  check('Skip is offered while it plays', await p.getByRole('button', { name: 'Skip' }).isVisible());
  await p.waitForFunction(() => document.getElementById('finale').classList.contains('line-in'), null, { timeout: 4000 }).catch(() => {});
  const mid = await state(p);
  check('the line appears inside the glass (~1s in)', mid.line && mid.t >= 0.9 && mid.phase === 'playing', `t=${mid.t.toFixed(2)}`);
  const t0 = Date.now();
  check('it settles into the final composition', await waitPhase(p, 'done', 6000), `${((Date.now() - t0) / 1000).toFixed(1)}s after the line`);
  await p.waitForTimeout(1500);
  const end = await state(p);
  check('video stops at the end (no loop)', end.paused, `t=${end.t.toFixed(2)}`);
  await p.waitForTimeout(800); // the controls arrive last (0.85s delay + 0.9s fade)
  const comp = await p.evaluate(() => ['.finale-mark svg', '.finale-line', '.finale-sub', '.finale-actions'].map((s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).opacity : 'missing'; }));
  check('mark, line, subline and controls all visible', comp.every((o) => o === '1'), comp.join(','));
  check('the closing line reads in full', (await p.locator('#finale-title').innerText()).trim() === 'This is only the beginning.');
  const h1 = await p.evaluate(() => document.querySelector('.finale-stage').getBoundingClientRect().height);
  check('no layout shift across the sequence', h0 === h1, `${h0} → ${h1}`);
  await p.waitForTimeout(1500);
  check('it plays once — still settled after lingering', (await state(p)).phase === 'done');
  // Replay
  await p.getByRole('button', { name: 'Replay the ending' }).click();
  check('Replay plays it again', await waitPhase(p, 'playing', 3000));
  check('…and settles again', await waitPhase(p, 'done', 8000));
  // Back to the top
  await p.getByRole('button', { name: 'Back to the top', exact: true }).click(); await p.waitForTimeout(2200);
  check('Back to the top returns to the start', (await p.evaluate(() => window.scrollY)) < 5);
  check('scrolling away does not restart it', (await state(p)).phase === 'done');
  check('no 4xx/5xx responses', bad.length === 0, bad.join(', '));
  await ctx.close();
}

/* 2 — Skip, and focus */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#outro'); await p.waitForTimeout(1200);
  await toBottom(p);
  await waitPhase(p, 'playing', 4000);
  await p.getByRole('button', { name: 'Skip' }).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  const s = await state(p);
  check('Skip (keyboard) ends it straight away', s.phase === 'done' && s.paused);
  check('focus moves to "Back to the top", not lost', (await p.evaluate(() => document.activeElement?.textContent?.trim())) === 'Back to the top');
  await p.keyboard.press('Tab');
  check('Tab reaches "Replay the ending"', (await p.evaluate(() => document.activeElement?.textContent?.trim())) === 'Replay the ending');
  await ctx.close();
}

/* 3 — scrolling away mid-play */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#outro'); await p.waitForTimeout(1200);
  await toBottom(p); await waitPhase(p, 'playing', 4000); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('clover').scrollIntoView()); await p.waitForTimeout(600);
  const s = await state(p);
  check('leaving mid-play pauses and settles it', s.phase === 'done' && s.paused, JSON.stringify(s));
  await toBottom(p); await p.waitForTimeout(800);
  check('coming back does not replay it', (await state(p)).phase === 'done');
  await ctx.close();
}

/* 4 — reduced motion: still, complete, nothing downloaded */
{
  const { p, ctx, videos } = await page({ reduced: true });
  await p.goto(URL_ + '#outro'); await p.waitForTimeout(800);
  await toBottom(p); await p.waitForTimeout(800);
  const s = await state(p);
  check('reduced motion: final composition straight away', s.phase === 'done' && s.line);
  check('reduced motion: video not downloaded', videos.length === 0, videos.length + ' requests');
  const poster = await p.evaluate(() => { const i = document.querySelector('.finale-poster img'); return [getComputedStyle(document.querySelector('.finale-poster')).opacity, i.complete && i.naturalWidth > 0, i.currentSrc.split('/').pop()]; });
  check('reduced motion: still of the glass behind it', +poster[0] > 0.2 && poster[1], poster.join(' · '));
  check('reduced motion: offered as a choice instead', await p.getByRole('button', { name: 'Play the ending' }).isVisible());
  await p.getByRole('button', { name: 'Play the ending' }).click();
  check('reduced motion: plays only when asked', await waitPhase(p, 'playing', 3000) && videos.length >= 1);
  await ctx.close();
}

/* 5 — failures end gracefully */
{
  const { p, ctx } = await page({ blocked: true });
  await p.route('**/*.mp4', (r) => r.abort());
  await p.goto(URL_ + '#outro'); await p.waitForTimeout(800);
  await toBottom(p);
  check('video unavailable: settles on the still composition', await waitPhase(p, 'done', 9000));
  check('video unavailable: no Replay offered', (await p.getByRole('button', { name: 'Replay the ending' }).count()) === 0);
  check('video unavailable: way back up still there', await p.getByRole('button', { name: 'Back to the top', exact: true }).isVisible());
  await ctx.close();
}
{
  const { p, ctx } = await page({ refuse: true });
  await p.goto(URL_ + '#outro'); await p.waitForTimeout(800);
  await toBottom(p);
  check('autoplay refused: settles on the composition', await waitPhase(p, 'done', 5000));
  await ctx.close();
}

/* 6 — navigation into the ending */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#finale'); await p.waitForTimeout(1400);
  const top = await p.evaluate(() => document.getElementById('finale').getBoundingClientRect().top);
  check('deep link #finale lands on it', Math.abs(top - 72) < 30, `top=${Math.round(top)}`);
  await p.goto(URL_); await p.waitForTimeout(800);
  await p.locator('button[aria-label^="Chat with Clover"]').first().click(); await p.waitForTimeout(300);
  await p.fill('#clover-input', 'take me to the ending'); await p.keyboard.press('Enter'); await p.waitForTimeout(2600);
  const top2 = await p.evaluate(() => document.getElementById('finale').getBoundingClientRect().top);
  check('Clover can take you to the ending', Math.abs(top2 - 72) < 40, `top=${Math.round(top2)}`);
  const current = await p.locator('nav[aria-label="Chapters"] button[aria-current="location"]').innerText().catch(() => '');
  check('rail keeps a chapter lit at the end', /clover/i.test(current), current);
  await ctx.close();
}

/* 7 — screens */
for (const [w, h] of [[320, 640], [390, 844], [768, 1024], [1024, 768], [1920, 1080], [2560, 1080]]) {
  const { p, ctx } = await page({ w, h });
  await p.goto(URL_ + '#outro'); await p.waitForTimeout(900);
  await toBottom(p); await waitPhase(p, 'done', 9000); await p.waitForTimeout(1300);
  const r = await p.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    const box = (s) => document.querySelector(s).getBoundingClientRect();
    const stage = box('.finale-stage'), title = box('#finale-title'), actions = box('.finale-actions');
    const v = document.querySelector('.finale-video video');
    return {
      overflow: document.documentElement.scrollWidth - vw,
      stageFills: Math.round(stage.height) >= vh - 1,
      titleIn: title.left >= 0 && title.right <= vw,
      actionsIn: actions.left >= 0 && actions.right <= vw,
      fit: getComputedStyle(v).objectFit,
    };
  });
  check(`${w}×${h}: no overflow, stage fills, text and controls on screen, video not stretched`, r.overflow <= 0 && r.stageFills && r.titleIn && r.actionsIn && r.fit === 'cover', JSON.stringify(r));
  await ctx.close();
}

check('no console or page errors', errs.length === 0, [...new Set(errs)].slice(0, 3).join(' | '));
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
await b.close();
process.exitCode = fails ? 1 : 0;
