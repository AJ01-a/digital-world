// Game worlds, Monster Hunter ecosystem, who has AJ's heart, the drive,
// reduced motion, missing artwork and small-screen overflow.
// Usage: node tests/e2e/worlds.mjs <url>  (or `npm run test:e2e`)
import { launch } from './browser.mjs';

const URL_ = process.argv[2];
const b = await launch();
let fails = 0; const errs = [];
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info !== '' ? ' — ' + info : ''}`); };
async function page(opts = {}) {
  const ctx = await b.newContext({ viewport: { width: opts.w ?? 1440, height: opts.h ?? 900 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', hasTouch: (opts.w ?? 1440) < 700, isMobile: (opts.w ?? 1440) < 700 });
  await ctx.addInitScript(() => { sessionStorage.setItem('aj:clover-greeted', '1'); sessionStorage.setItem('aj:intro-seen', '1'); });
  const p = await ctx.newPage();
  if (!opts.blocked) p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(String(e)));
  return { p, ctx };
}

/* 1 — every game image in the build resolves at the subpath */
{
  const { p, ctx } = await page();
  const bad = []; p.on('response', (r) => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await p.goto(URL_ + '#games'); await p.waitForTimeout(1500);
  const files = ['monster-hunter-world-638', ...['elden-ring', 'sekiro', 'god-of-war', 'black-myth-wukong'].flatMap((id) => [640, 1280, 1920].map((w) => `${id}-${w}`))];
  const st = await p.evaluate(async (fs) => Promise.all(fs.flatMap((f) => ['avif', 'webp'].map(async (t) => [f + '.' + t, (await fetch(`games/${f}.${t}`)).status]))), files);
  check('all 26 game image files return 200 under /digital-world/', st.every(([, s]) => s === 200), st.filter(([, s]) => s !== 200).join(',') || `${st.length} files`);
  const imgs = await p.evaluate(() => [...document.querySelectorAll('#games img')].map((i) => [i.currentSrc.replace(/.*\/games\//, ''), i.complete && i.naturalWidth > 0]));
  check('visible game images decode (thumbnails)', imgs.filter(([, ok]) => ok).length >= 5, JSON.stringify(imgs.slice(0, 6)));
  check('no 4xx/5xx responses', bad.length === 0, bad.join(', '));
  // world switching + stage
  const tabs = p.locator('#games button[aria-label*=" — "]');
  check('five game worlds, Monster Hunter first and selected', (await tabs.count()) === 5 && (await tabs.first().getAttribute('aria-pressed')) === 'true');
  await tabs.nth(3).click(); await p.waitForTimeout(1400);
  const gow = await p.evaluate(() => [document.querySelector('#games h3').textContent, [...document.querySelectorAll('#games .stage img')].map((i) => i.currentSrc.split('/').pop())]);
  check('selecting a world swaps stage art and details', gow[0] === 'God of War Ragnarök' && gow[1].some((s) => s.startsWith('god-of-war-1')), JSON.stringify(gow));
  check('outgoing stage layer is dropped after the transition', (await p.locator('#games .stage > div.absolute.inset-0').count()) === 1);
  await ctx.close();
}

/* 2 — Monster Hunter field notes */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#games'); await p.waitForTimeout(1500);
  await p.locator('#games .stage').scrollIntoViewIfNeeded();
  check('ecosystem scene mounted with creatures', (await p.locator('.eco .eco-fly, .eco .eco-graze, .eco .eco-critter, .eco .eco-breathe').count()) >= 8);
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.eco-fly')).animationName);
  check('wyvern flight animation running', anim === 'eco-fly', anim);
  const markers = p.locator('.eco button[aria-label^="Field note"]');
  check('six field-note markers', (await markers.count()) === 6);
  for (let i = 0; i < 6; i++) await markers.nth(i).click({ force: true });
  const card = await p.locator('.eco [aria-live]').innerText();
  check('field note card opens', /Field note 06/i.test(card), card.slice(0, 60));
  await p.locator('.eco button[aria-label="Close field note"]').click();
  const done = await p.locator('.eco [aria-live]').innerText();
  check('all six found -> ecosystem logged', /6 \/ 6/.test(done), done);
  // scoutflies follow the pointer
  const box = await p.locator('.eco-scene').boundingBox();
  await p.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.3); await p.waitForTimeout(200);
  const fx = await p.evaluate(() => document.querySelector('.eco-flies').style.getPropertyValue('--fx'));
  check('scoutflies follow the pointer', Math.abs(parseFloat(fx) - box.width * 0.7) < 3, fx + ' of ' + box.width);
  await ctx.close();
}

/* 2b — field notes are never covered by the markers, and never cover them */
for (const [w, h] of [[390, 844], [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080]]) {
  const { p, ctx } = await page({ w, h });
  await p.goto(URL_ + '#games'); await p.waitForTimeout(1500);
  await p.locator('#games .stage').evaluate((el) => el.scrollIntoView({ block: 'center' })); await p.waitForTimeout(800);
  const problems = [];
  let below = 0;
  for (let i = 0; i < 6; i++) {
    // A normal click — it fails if anything sits on top of the marker.
    await p.locator('.eco button[aria-label^="Field note"]').nth(i).click({ timeout: 3000 }).catch(() => problems.push(`marker ${i + 1} not clickable`));
    await p.waitForTimeout(450);
    const r = await p.evaluate((i) => {
      const card = document.querySelector('#games [aria-live] .eco-card');
      if (!card || !card.textContent.includes(`Field note 0${i + 1}`)) return { missing: true };
      const c = card.getBoundingClientRect();
      const stage = document.querySelector('#games .stage').getBoundingClientRect();
      const covered = [];
      for (let x = c.left + 14; x < c.right - 14; x += 12) for (let y = c.top + 14; y < c.bottom - 14; y += 8) {
        const el = document.elementFromPoint(x, y);
        if (el && !card.contains(el) && el.closest('.eco')) covered.push(el.closest('button')?.getAttribute('aria-label') ?? 'scene');
      }
      const hidden = [...document.querySelectorAll('.eco button[aria-label^="Field note"]')].filter((m) => {
        const q = m.getBoundingClientRect(); const x = q.left + q.width / 2; const y = q.top + q.height / 2;
        if (x < stage.left || x > stage.right) return false; // panned out of view on phones
        const el = document.elementFromPoint(x, y); return !el || !m.contains(el);
      }).map((m) => m.getAttribute('aria-label'));
      return { covered: [...new Set(covered)], hidden, below: c.top >= stage.bottom - 1 };
    }, i);
    if (r.missing) problems.push(`note ${i + 1} did not open`);
    else {
      if (r.covered.length) problems.push(`note ${i + 1} covered by ${r.covered.join(', ')}`);
      if (r.hidden.length) problems.push(`note ${i + 1} hides ${r.hidden.join(', ')}`);
      if (r.below) below++;
    }
  }
  check(`field notes at ${w}px: readable, never covered, never hiding a marker`, problems.length === 0, problems.join('; '));
  check(`field notes at ${w}px: ${w < 1200 ? 'below the stage' : 'floating over the scene'}`, w < 1200 ? below === 6 : below === 0, `${below} / 6 below`);
  await ctx.close();
}

/* 3 — who has AJ's heart */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#clover'); await p.waitForTimeout(1200);
  await p.locator('button[aria-label^="Chat with Clover"]').first().click(); await p.waitForTimeout(400);
  const ask = async (q) => {
    const n = await p.locator('[aria-label="Conversation with Clover"] .clover-msg').count();
    await p.fill('#clover-input', q); await p.keyboard.press('Enter');
    await p.waitForFunction((n) => document.querySelectorAll('[aria-label="Conversation with Clover"] .clover-msg').length >= n + 2, n, { timeout: 5000 });
    return p.locator('[aria-label="Conversation with Clover"] .clover-msg').last().innerText();
  };
  for (const q of ['WHO IS MY CRUSH?', "Who's AJ's crush?", 'can you tell me who aj likes', 'Who does he like?', 'who does AJ love', 'Who is AJ in love with?']) {
    const a = await ask(q);
    const proclaimed = await p.locator('[aria-label="Conversation with Clover"] .clover-msg').last().locator('.clover-proclaim').innerText().catch(() => '');
    check(`Clover's answer: "${q}"`, proclaimed.trim() === 'Jesus is my King!' && /\*.+\*/.test(a), a.replace(/\s+/g, ' ').slice(0, 90));
  }
  for (const q of ['What does AJ like?', 'I crushed the chess puzzle', 'Who is AJ?', 'Tell me about Loki']) {
    const a = await ask(q); check(`no heart answer for: "${q}"`, !/Jesus is my King/.test(a), a.replace(/\s+/g, ' ').slice(0, 70));
  }
  const f = await ask("what's her full name?"); check('old secret is gone (no S, no sealed reply)', !/starts with S|S is all/.test(f), f.slice(0, 60));
  await ctx.close();
}

/* 4 — the drive: wheels turn with the road, no layout shift */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#driving'); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: false }); });
  const svg = p.locator('#driving svg[role="img"]');
  check('Envista labelled for assistive tech', /white 2025 Buick Envista/.test(await svg.getAttribute('aria-label')));
  const read = () => p.evaluate(() => [...document.querySelectorAll('#driving svg[role="img"] ~ div.will-change-transform')].map((d) => d.style.transform));
  const a = await read(); await p.waitForTimeout(700); const c = await read();
  check('wheels rotate (driven by the road loop)', a.length === 2 && c.length === 2 && a[0] !== c[0], `${a[0]} -> ${c[0]}`);
  check('front and rear wheels in step', c[0] === c[1], c.join(' | '));
  const r1 = await svg.boundingBox(); await p.waitForTimeout(1500); const r2 = await svg.boundingBox();
  check('car does not move in the layout', r1.x === r2.x && Math.abs(r1.y - r2.y) < 0.5, `${r1.x},${r1.y} / ${r2.x},${r2.y}`);
  check('no layout shift while driving', (await p.evaluate(() => window.__cls)) === 0, await p.evaluate(() => window.__cls));
  const vis = await p.evaluate(() => [...document.querySelectorAll('canvas')].length);
  check('drive scene: static + moving canvas, one rAF loop', (await p.locator('#driving canvas').count()) === 2, vis);
  await ctx.close();
}

/* 5 — reduced motion */
{
  const { p, ctx } = await page({ reduced: true });
  await p.goto(URL_ + '#games'); await p.waitForTimeout(1500);
  await p.locator('#games .stage').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const still = await p.evaluate(() => [!!document.querySelector('.eco.eco-still'), getComputedStyle(document.querySelector('.eco-fly')).animationName, document.querySelectorAll('.drift').length]);
  check('reduced motion: ecosystem still, creatures in resting pose', still[0] && still[1] === 'none', JSON.stringify(still));
  await p.locator('#games button[aria-label*=" — "]').nth(1).click(); await p.waitForTimeout(500);
  check('reduced motion: no drifting particles', (await p.locator('.drift').count()) === 0);
  await p.goto(URL_ + '#driving'); await p.waitForTimeout(1200);
  const t1 = await p.evaluate(() => document.querySelector('#driving svg[role="img"] ~ div.will-change-transform')?.style.transform || 'none');
  await p.waitForTimeout(800);
  const t2 = await p.evaluate(() => document.querySelector('#driving svg[role="img"] ~ div.will-change-transform')?.style.transform || 'none');
  check('reduced motion: car parked (wheels still)', t1 === t2, `${t1} / ${t2}`);
  await ctx.close();
}

/* 6 — missing artwork falls back without crashing */
{
  const { p, ctx } = await page({ blocked: true });
  await ctx.route('**/games/**', (r) => r.abort());
  await p.goto(URL_ + '#games'); await p.waitForTimeout(1500);
  await p.locator('#games button[aria-label*=" — "]').nth(1).click(); await p.waitForTimeout(1500);
  const fb = await p.evaluate(() => [document.querySelectorAll('#games .stage img').length, document.querySelectorAll('#games .stage svg').length, document.querySelectorAll('#games button[aria-label*=" — "] svg').length]);
  check('blocked images: stage and tabs show procedural art instead', fb[0] === 0 && fb[1] > 0 && fb[2] >= 4, JSON.stringify(fb));
  check('blocked images: page still renders later chapters', await p.locator('#driving').isVisible());
  await ctx.close();
}

/* 7 — no horizontal overflow */
for (const w of [320, 390, 768, 1024, 1440]) {
  const { p, ctx } = await page({ w, h: 860 });
  await p.goto(URL_); await p.waitForTimeout(800);
  for (const id of ['games', 'driving']) { await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(500); }
  const o = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  check(`no horizontal overflow at ${w}px`, o[0] <= o[1], o.join(' / '));
  await ctx.close();
}

check('no console or page errors', errs.length === 0);
if (errs.length) console.log('CONSOLE ERRORS:\n' + errs.join('\n'));
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
await b.close();
process.exitCode = fails ? 1 : 0;
