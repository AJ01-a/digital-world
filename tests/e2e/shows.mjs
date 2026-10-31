// The One Piece and Loki chapters: artwork, interactions (mouse, keyboard
// and touch), navigation, reduced motion, missing artwork and small screens.
// Usage: node tests/e2e/shows.mjs <url>  (or `npm run test:e2e`)
import { launch } from './browser.mjs';

const URL_ = process.argv[2];
const b = await launch();
let fails = 0; const errs = [];
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info !== '' ? ' — ' + info : ''}`); };
async function page(opts = {}) {
  const w = opts.w ?? 1440;
  const ctx = await b.newContext({ viewport: { width: w, height: opts.h ?? 900 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', hasTouch: w < 700, isMobile: w < 700 });
  await ctx.addInitScript(() => { sessionStorage.setItem('aj:clover-greeted', '1'); sessionStorage.setItem('aj:intro-seen', '1'); });
  const p = await ctx.newPage();
  if (!opts.blocked) p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', (e) => errs.push(String(e)));
  return { p, ctx };
}
const ARTWORK = ['luffy-gear-5', 'straw-hat', 'loki-tva', 'loki-throne'];
const LINE = 'I know what kind of god I need to be… for you. For all of us.';

/* 1 — artwork resolves under the subpath and decodes */
{
  const { p, ctx } = await page();
  const bad = []; p.on('response', (r) => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await p.goto(URL_ + '#onepiece'); await p.waitForTimeout(1200);
  const files = ARTWORK.flatMap((id) => [640, 1280, 1920].flatMap((w) => ['avif', 'webp'].map((t) => `${id}-${w}.${t}`)));
  const st = await p.evaluate(async (fs) => Promise.all(fs.map(async (f) => [f, (await fetch(`shows/${f}`)).status])), files);
  check('all 24 show image files return 200 under /digital-world/', st.every(([, s]) => s === 200), st.filter(([, s]) => s !== 200).join(',') || `${st.length} files`);
  // Walk through both chapters so lazy images load.
  for (const id of ['onepiece', 'loki']) {
    const h = await p.evaluate((id) => document.getElementById(id).scrollHeight, id);
    for (let y = 0; y < h; y += 500) { await p.evaluate(([id, y]) => window.scrollTo(0, document.getElementById(id).offsetTop + y), [id, y]); await p.waitForTimeout(120); }
  }
  await p.waitForTimeout(1200);
  const imgs = await p.evaluate(() => [...document.querySelectorAll('#onepiece img, #loki img')].map((i) => [i.currentSrc.split('/').pop(), i.complete && i.naturalWidth > 0, i.alt]));
  check('four artworks render in the two chapters', imgs.length === 4 && imgs.every(([, ok]) => ok), JSON.stringify(imgs.map(([s, ok]) => `${s}:${ok}`)));
  check('modern formats served (AVIF)', imgs.every(([s]) => s.endsWith('.avif')), imgs.map(([s]) => s).join(', '));
  check('meaningful artwork has alt text, decorative hat is empty', imgs.filter(([, , a]) => a).length === 3, imgs.map(([, , a]) => a.slice(0, 20)).join(' | '));
  const lazy = await p.evaluate(() => [...document.querySelectorAll('#onepiece img, #loki img')].every((i) => i.loading === 'lazy'));
  check('below-the-fold artwork is lazy-loaded', lazy);
  check('no 4xx/5xx responses', bad.length === 0, bad.join(', '));
  await ctx.close();
}

/* 2 — One Piece interactions, mouse and keyboard */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#onepiece'); await p.waitForTimeout(1200);
  const g5 = p.locator('#onepiece button[aria-controls="g5-note"]');
  check('Gear 5 starts calm', (await g5.getAttribute('aria-expanded')) === 'false' && !(await p.locator('#g5-note').isVisible()));
  await g5.click(); await p.waitForTimeout(700);
  check('Gear 5 click: awakens and reveals the reflection', (await g5.getAttribute('aria-expanded')) === 'true' && (await p.locator('#g5-note').isVisible()) && /being free and being strong/.test(await p.locator('#g5-note').innerText()));
  const z = await p.evaluate(() => getComputedStyle(document.querySelector('.g5-zoom')).transform);
  check('Gear 5: the scene pushes in (transform only)', z !== 'none', z);
  await g5.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  check('Gear 5 keyboard: Enter toggles back', (await g5.getAttribute('aria-expanded')) === 'false' && !(await p.locator('#g5-note').isVisible()));
  const outline = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check('Gear 5 button shows a focus ring', outline !== 'none', outline);

  const hat = p.locator('#onepiece button[aria-controls="hat-meaning"]');
  await hat.scrollIntoViewIfNeeded(); await hat.click(); await p.waitForTimeout(600);
  check('straw hat: picking it up reveals the reflection', (await hat.getAttribute('aria-expanded')) === 'true' && /dream you carry/.test(await p.locator('#hat-meaning').innerText()));
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  check('straw hat keyboard: Space puts it down', (await hat.getAttribute('aria-expanded')) === 'false');

  const tabs = p.locator('#onepiece [role="group"][aria-label="Themes"] button');
  const names = (await tabs.allInnerTexts()).map((t) => t.trim().toLowerCase());
  check('three themes — Freedom, Dreams, Perseverance — first selected', names.join(',') === 'freedom,dreams,perseverance' && (await tabs.first().getAttribute('aria-pressed')) === 'true', names.join(','));
  const lessonsText = (await p.locator('#onepiece [role="group"][aria-label="Themes"]').locator('..').innerText()).toLowerCase();
  check('Friendship, Loyalty and Sacrifice are gone from the lessons', !/friendship|loyalty|sacrifice/.test(lessonsText));
  await p.getByRole('button', { name: 'Dreams' }).click(); await p.waitForTimeout(400);
  const panel = await p.locator('#onepiece [aria-live="polite"]').last().innerText();
  check('choosing a theme shows its reflection', /chase theirs/.test(panel) && (await p.getByRole('button', { name: 'Dreams' }).getAttribute('aria-pressed')) === 'true', panel.replace(/\s+/g, ' ').slice(0, 60));
  await ctx.close();
}

/* 3 — Loki: journey, purpose, the line */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#loki'); await p.waitForTimeout(1200);
  check('journey has five stations in order', (await p.locator('#loki ol > li').count()) === 5 && /Burdened/.test(await p.locator('#loki ol > li h4').first().innerText()) && /needed to be/.test(await p.locator('#loki ol > li h4').last().innerText()));
  const quote = (await p.locator('#loki .loki-quote blockquote').innerText()).replace(/\s+/g, ' ').trim();
  check('the supplied line is shown word for word', quote === `“${LINE}”`, quote);
  check('the 2012 line is shown word for word', (await p.locator('#loki figure blockquote').first().innerText()).includes('I am Loki, of Asgard, and I am burdened with glorious purpose.'));
  check('reflections are labelled as commentary', /My words, not the show's/i.test(await p.locator('#loki').innerText()));
  check('Loki keeps its own "Sacrifice" reflection', (await p.locator('#loki li h4', { hasText: 'Sacrifice' }).count()) === 1);
  await p.locator('#loki .loki-quote').scrollIntoViewIfNeeded(); await p.waitForTimeout(3600);
  const beats = await p.evaluate(() => [...document.querySelectorAll('.loki-quote .beat')].map((e) => getComputedStyle(e).opacity));
  check('quote beats all arrive (readable within ~3.5s)', beats.length === 4 && beats.every((o) => o === '1'), beats.join(','));
  check('"For all of us." carries the final emphasis', (await p.locator('.loki-final').innerText()).startsWith('For all of us.'));
  const now = p.getByRole('button', { name: 'Now', exact: true });
  await now.scrollIntoViewIfNeeded();
  const shadeBefore = await p.evaluate(() => getComputedStyle(document.querySelector('.purpose-shade')).opacity);
  await now.click(); await p.waitForTimeout(1400);
  const shadeAfter = await p.evaluate(() => getComputedStyle(document.querySelector('.purpose-shade')).opacity);
  check('purpose: "Now" reveals the sacrifice and lets the light in', /hold everything together/.test(await p.locator('.purpose [aria-live]').innerText()) && shadeBefore === '1' && shadeAfter === '0', `${shadeBefore} -> ${shadeAfter}`);
  await p.getByRole('button', { name: 'Then', exact: true }).press('Enter'); await p.waitForTimeout(300);
  check('purpose keyboard: back to "Then"', /throne to rule from/.test(await p.locator('.purpose [aria-live]').innerText()));
  const accent = await p.evaluate(() => [getComputedStyle(document.getElementById('loki')).getPropertyValue('--env-accent').trim(), document.documentElement.style.getPropertyValue('--env-accent')]);
  check('emerald stays local to the chapter (not :root)', accent[0] === '#5fd49c' && accent[1] === '', accent.join(' / '));
  await ctx.close();
}

/* 4 — navigation: rail, deep links, Clover */
{
  const { p, ctx } = await page();
  await p.goto(URL_); await p.waitForTimeout(900);
  const rail = await p.locator('nav[aria-label="Chapters"] button').allInnerTexts();
  const labels = rail.map((t) => t.replace(/^(\d\d)\s*/, '$1 ').replace(/\s+/g, ' ').trim().toLowerCase());
  check('rail lists both chapters between Games and the book', labels.join('|').includes('05 games|06 one piece|07 loki|08 book'), labels.join(' | '));
  await p.locator('nav[aria-label="Chapters"] button', { hasText: 'Loki' }).click(); await p.waitForTimeout(1600);
  const top = await p.evaluate(() => document.getElementById('loki').getBoundingClientRect().top);
  check('rail travels to Loki', Math.abs(top - 72) < 40, `top=${Math.round(top)}`);
  const current = await p.locator('nav[aria-label="Chapters"] button[aria-current="location"]').innerText();
  check('rail marks Loki as current', /loki/i.test(current), current);
  await p.goto(URL_ + '#onepiece'); await p.reload(); await p.waitForTimeout(1300);
  const top2 = await p.evaluate(() => document.getElementById('onepiece').getBoundingClientRect().top);
  check('deep link #onepiece lands on the chapter', Math.abs(top2 - 72) < 30, `top=${Math.round(top2)}`);
  await p.locator('button[aria-label^="Chat with Clover"]').first().click(); await p.waitForTimeout(300);
  const chips = await p.locator('[aria-labelledby="clover-chat-title"] .overflow-x-auto button').allInnerTexts();
  check('Clover suggestions follow the One Piece chapter', chips.some((c) => /straw hat/i.test(c)), chips.join(' | '));
  await p.fill('#clover-input', 'take me to loki'); await p.keyboard.press('Enter'); await p.waitForTimeout(2200);
  const top3 = await p.evaluate(() => document.getElementById('loki').getBoundingClientRect().top);
  check('Clover navigates ("take me to loki")', Math.abs(top3 - 72) < 40, `top=${Math.round(top3)}`);
  await ctx.close();
}

/* 5 — phones: touch, mobile index, no overflow */
{
  const { p, ctx } = await page({ w: 390, h: 844 });
  await p.goto(URL_ + '#onepiece'); await p.waitForTimeout(1200);
  const g5 = p.locator('#onepiece button[aria-controls="g5-note"]');
  check('touch label on phones', /tap to awaken/i.test(await g5.innerText()));
  await g5.tap(); await p.waitForTimeout(700);
  check('Gear 5 works by tap', (await g5.getAttribute('aria-expanded')) === 'true' && (await p.locator('#g5-note').isVisible()));
  const fit = await p.evaluate(() => { const f = document.querySelector('.g5'); const n = document.getElementById('g5-note').getBoundingClientRect(); const r = f.getBoundingClientRect(); return [n.top >= r.top - 1, Math.round(n.top - r.top)]; });
  check('Gear 5 reflection fits inside the artwork on a phone', fit[0], `note sits ${fit[1]}px below the frame top`);
  const hat = p.locator('#onepiece button[aria-controls="hat-meaning"]');
  await hat.scrollIntoViewIfNeeded(); await hat.tap(); await p.waitForTimeout(500);
  check('straw hat works by tap', (await hat.getAttribute('aria-expanded')) === 'true');
  const now = p.getByRole('button', { name: 'Now', exact: true });
  await p.goto(URL_ + '#loki'); await p.waitForTimeout(1200);
  await now.scrollIntoViewIfNeeded(); await now.tap(); await p.waitForTimeout(500);
  check('purpose toggle works by tap', (await now.getAttribute('aria-pressed')) === 'true');
  await p.locator('nav[aria-label="Chapters"] button').first().tap(); await p.waitForTimeout(500);
  const idx = await p.locator('[role="dialog"][aria-label="Chapters"]').innerText();
  check('mobile chapter index lists One Piece and Loki', /One Piece/.test(idx) && /Loki/.test(idx));
  await ctx.close();
}
for (const w of [320, 360, 768, 1024, 1920]) {
  const { p, ctx } = await page({ w, h: w < 700 ? 760 : 900 });
  await p.goto(URL_ + '#onepiece'); await p.waitForTimeout(700);
  for (const id of ['onepiece', 'loki']) {
    await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(250);
  }
  const o = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  const spill = await p.evaluate(() => [...document.querySelectorAll('#onepiece *, #loki *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.show-art, .hat-zoom, .g5-zoom, picture'); }).map((e) => e.tagName + '.' + String(e.className).slice(0, 30)).slice(0, 3));
  check(`no horizontal overflow at ${w}px`, o[0] <= o[1] && spill.length === 0, `${o.join(' / ')} ${spill.join(', ')}`);
  await ctx.close();
}

/* 6 — reduced motion: everything readable, nothing moving */
{
  const { p, ctx } = await page({ reduced: true });
  await p.goto(URL_ + '#loki'); await p.waitForTimeout(800);
  const st = await p.evaluate(() => ({
    reveal: [...document.querySelectorAll('#onepiece .reveal, #loki .reveal')].every((e) => getComputedStyle(e).opacity === '1'),
    parallax: [...document.querySelectorAll('.show-parallax')].map((e) => getComputedStyle(e).animationName),
    track: getComputedStyle(document.querySelector('.loki-track-fill')).transform,
    beats: [...document.querySelectorAll('.loki-quote .beat')].map((e) => getComputedStyle(e).opacity),
  }));
  check('reduced motion: the Loki quote is shown whole, no beats', st.beats.length === 4 && st.beats.every((o) => o === '1'), st.beats.join(','));
  check('reduced motion: all chapter text visible without scrolling', st.reveal);
  check('reduced motion: artwork parallax off', st.parallax.every((n) => n === 'none'), st.parallax.join(','));
  check('reduced motion: journey track fully drawn', st.track === 'none', st.track);
  await ctx.close();
}

/* 7 — missing artwork: painted stand-ins, no broken images, same layout */
{
  const { p, ctx } = await page({ blocked: true });
  await p.route('**/shows/**', (r) => r.abort());
  await p.goto(URL_ + '#onepiece'); await p.waitForTimeout(800);
  for (const id of ['onepiece', 'loki']) {
    const h = await p.evaluate((id) => document.getElementById(id).scrollHeight, id);
    for (let y = 0; y < h; y += 600) { await p.evaluate(([id, y]) => window.scrollTo(0, document.getElementById(id).offsetTop + y), [id, y]); await p.waitForTimeout(100); }
  }
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => ({
    imgs: document.querySelectorAll('#onepiece img, #loki img').length,
    stand: document.querySelectorAll('#onepiece [role="img"], #loki [role="img"]').length,
    g5: Math.round(document.querySelector('.g5').getBoundingClientRect().height),
  }));
  check('blocked artwork falls back to painted stand-ins', r.imgs === 0 && r.stand === 3 && r.g5 > 300, JSON.stringify(r));
  await ctx.close();
}

check('no console or page errors', errs.length === 0, [...new Set(errs)].slice(0, 3).join(' | '));
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
await b.close();
process.exitCode = fails ? 1 : 0;
