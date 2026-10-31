// The book chapter (Atomic Habits): cover image, placement, copy, the small
// steps illustration, the work-in-progress reveal, navigation, Clover,
// reduced motion, a missing cover and small screens.
// Usage: node tests/e2e/book.mjs <url>  (or `npm run test:e2e`)
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
const walk = async (p) => {
  const h = await p.evaluate(() => document.getElementById('book').scrollHeight);
  for (let y = 0; y < h; y += 450) { await p.evaluate((y) => window.scrollTo(0, document.getElementById('book').offsetTop + y), y); await p.waitForTimeout(110); }
};

/* 1 — the cover resolves under the subpath, decodes and is lazy */
{
  const { p, ctx } = await page();
  const bad = []; p.on('response', (r) => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await p.goto(URL_ + '#book'); await p.waitForTimeout(1200);
  const files = [320, 426].flatMap((w) => ['avif', 'webp'].map((t) => `atomic-habits-${w}.${t}`));
  const st = await p.evaluate(async (fs) => Promise.all(fs.map(async (f) => [f, (await fetch(`books/${f}`)).status])), files);
  check('all 4 cover files return 200 under /digital-world/', st.every(([, s]) => s === 200), st.filter(([, s]) => s !== 200).join(',') || `${st.length} files`);
  await walk(p); await p.waitForTimeout(900);
  const img = await p.evaluate(() => { const i = document.querySelector('#book img'); return i && { src: i.currentSrc.split('/').pop(), ok: i.complete && i.naturalWidth > 0, alt: i.alt, lazy: i.loading === 'lazy' }; });
  check('the cover renders', !!img && img.ok, JSON.stringify(img));
  check('cover served as AVIF', !!img && img.src.endsWith('.avif'), img?.src);
  check('cover has descriptive alt text naming the book and author', !!img && /Atomic Habits/.test(img.alt) && /James Clear/.test(img.alt));
  check('cover is lazy-loaded', !!img && img.lazy);
  check('no 4xx/5xx responses', bad.length === 0, bad.join(', '));
  await ctx.close();
}

/* 2 — placement, rail and copy */
{
  const { p, ctx } = await page();
  await p.goto(URL_); await p.waitForTimeout(900);
  const order = await p.evaluate(() => [...document.querySelectorAll('main > section[id]')].map((s) => s.id));
  const i = order.indexOf('book');
  check('the chapter sits between Loki and Chess', i > 0 && order[i - 1] === 'loki' && order[i + 1] === 'strategy', order.join(' '));
  const rail = (await p.locator('nav[aria-label="Chapters"] button').allInnerTexts()).map((t) => t.replace(/^(\d\d)\s*/, '$1 ').replace(/\s+/g, ' ').trim().toLowerCase());
  check('rail lists 08 Book between Loki and Chess', rail.join('|').includes('07 loki|08 book|09 chess'), rail.join(' | '));
  await p.locator('nav[aria-label="Chapters"] button', { hasText: 'Book' }).click(); await p.waitForTimeout(1600);
  const top = await p.evaluate(() => document.getElementById('book').getBoundingClientRect().top);
  check('rail travels to the book', Math.abs(top - 72) < 40, `top=${Math.round(top)}`);
  const heading = (await p.locator('#book-title').innerText()).replace(/\s+/g, ' ').trim();
  check('introduced as "My first book — Atomic Habits"', /my first book — atomic habits/i.test(heading), heading);
  const text = await p.locator('#book').innerText();
  check('author credited', /by James Clear/i.test(text));
  check('says not every lesson is applied yet', /haven't put every lesson/i.test(text));
  check('the paraphrase is labelled as not a quotation', /not a quotation/i.test(text));
  check('the illustration is labelled as not a measurement', /not a measurement or a promise/i.test(text));
  check('four reflections on what it changed', (await p.locator('#book .book-page li').count()) === 4);
  check('no quotation marks attributed to the book', !/[“"][^”"]{12,}[”"]\s*—\s*James Clear/.test(text));
  await ctx.close();
}

/* 3 — small steps: button, slider (keyboard), start over */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#book'); await p.waitForTimeout(1200);
  const range = p.locator('#steps-range');
  await range.scrollIntoViewIfNeeded();
  const lit = () => p.evaluate(() => document.querySelectorAll('#book .steps-col.is-on').length);
  const start = await lit();
  check('starts a few steps in', start === Number(await range.inputValue()) && start > 0, String(start));
  await p.locator('#book').getByRole('button', { name: 'Take one small step' }).click(); await p.waitForTimeout(300);
  check('"Take one small step" adds a column', (await lit()) === start + 1 && Number(await range.inputValue()) === start + 1);
  await range.focus(); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
  check('slider works from the keyboard', (await lit()) === start + 3, String(await lit()));
  check('slider announces a readable value', /of 28 small steps/.test(await range.getAttribute('aria-valuetext')));
  await p.keyboard.press('End'); await p.waitForTimeout(700);
  const live = await p.locator('#book .steps ~ div[aria-live], #book [aria-live="polite"]').first().innerText();
  check('full: caption and off-day note are announced', /went together/.test(live) && /off days/.test(live), live.replace(/\s+/g, ' ').slice(0, 80));
  check('step button disables at the end', await p.locator('#book').getByRole('button', { name: 'Take one small step' }).isDisabled());
  const dot = await p.evaluate(() => getComputedStyle(document.querySelector('#book .steps-col.is-on .steps-dot')).opacity);
  check('dots are shown with opacity (no layout animation)', Number(dot) > 0.5, dot);
  await p.locator('#book').getByRole('button', { name: 'Reset steps' }).click(); await p.waitForTimeout(300);
  check('"Reset steps" resets to zero', (await lit()) === 0 && /starts flat/.test(await p.locator('#book [aria-live="polite"]').first().innerText()));
  // Reach the slider by keyboard, so :focus-visible applies as it would for a keyboard user.
  await range.focus(); await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab');
  const outline = await p.evaluate(() => document.activeElement.id === 'steps-range' && getComputedStyle(document.activeElement).outlineStyle);
  check('slider shows a focus ring when reached by keyboard', outline && outline !== 'none', String(outline));
  await ctx.close();
}

/* 4 — still a work in progress: click and keyboard */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#book'); await p.waitForTimeout(1000);
  const ask = p.locator('#book').getByRole('button', { name: 'Am I finished?' });
  await ask.scrollIntoViewIfNeeded();
  check('answer starts hidden', (await ask.getAttribute('aria-expanded')) === 'false' && !(await p.locator('#wip-note').isVisible()));
  await ask.click(); await p.waitForTimeout(800);
  check('click reveals the answer', (await ask.getAttribute('aria-expanded')) === 'true' && /that's okay/.test(await p.locator('#wip-note').innerText()));
  const moved = await p.evaluate(() => getComputedStyle(document.querySelector('.wip-me')).transform);
  check('"me, now" moves on (transform only)', moved !== 'none', moved);
  await ask.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  check('Enter hides it again', (await ask.getAttribute('aria-expanded')) === 'false' && !(await p.locator('#wip-note').isVisible()));
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  check('Space reveals it', (await ask.getAttribute('aria-expanded')) === 'true');
  await ctx.close();
}

/* 5 — Clover and the terminal know the chapter */
{
  const { p, ctx } = await page();
  await p.goto(URL_ + '#book'); await p.waitForTimeout(1300);
  await p.locator('button[aria-label^="Chat with Clover"]').first().click(); await p.waitForTimeout(300);
  const chips = await p.locator('[aria-labelledby="clover-chat-title"] .overflow-x-auto button').allInnerTexts();
  check('Clover suggestions follow the book chapter', chips.some((c) => /Atomic Habits/i.test(c)), chips.join(' | '));
  const log = p.locator('[role="log"][aria-label="Conversation with Clover"]');
  await p.fill('#clover-input', 'Why Atomic Habits?'); await p.keyboard.press('Enter'); await p.waitForTimeout(2200);
  check('Clover answers about the book in AJ\'s words', /first book I ever read/.test(await log.innerText()));
  await p.fill('#clover-input', 'Has AJ mastered it?'); await p.keyboard.press('Enter'); await p.waitForTimeout(2200);
  check('Clover is honest that it is a work in progress', /Not yet/.test(await log.innerText()));
  await p.goto(URL_); await p.waitForTimeout(900);
  await p.locator('button[aria-label^="Chat with Clover"]').first().click(); await p.waitForTimeout(300);
  // From the top of the page: Clover answers, then a long smooth scroll.
  await p.fill('#clover-input', 'take me to the book'); await p.keyboard.press('Enter'); await p.waitForTimeout(3600);
  const top = await p.evaluate(() => document.getElementById('book').getBoundingClientRect().top);
  check('Clover navigates ("take me to the book")', Math.abs(top - 72) < 40, `top=${Math.round(top)}`);
  await p.keyboard.press('Escape'); await p.goto(URL_); await p.waitForTimeout(900);
  await p.keyboard.press('/'); await p.waitForTimeout(200);
  await p.keyboard.type('goto book'); await p.keyboard.press('Enter'); await p.waitForTimeout(1800);
  const top2 = await p.evaluate(() => document.getElementById('book').getBoundingClientRect().top);
  check('terminal "goto book" travels there', Math.abs(top2 - 72) < 40, `top=${Math.round(top2)}`);
  await ctx.close();
}

/* 6 — phones: tap, no overflow */
{
  const { p, ctx } = await page({ w: 390, h: 844 });
  await p.goto(URL_ + '#book'); await p.waitForTimeout(1200);
  const step = p.locator('#book').getByRole('button', { name: 'Take one small step' });
  await step.scrollIntoViewIfNeeded(); const before = Number(await p.locator('#steps-range').inputValue());
  await step.tap(); await p.waitForTimeout(300);
  check('step button works by tap', Number(await p.locator('#steps-range').inputValue()) === before + 1);
  const ask = p.locator('#book').getByRole('button', { name: 'Am I finished?' });
  await ask.scrollIntoViewIfNeeded(); await ask.tap(); await p.waitForTimeout(500);
  check('answer reveals by tap', (await ask.getAttribute('aria-expanded')) === 'true');
  const small = await p.evaluate(() => [...document.querySelectorAll('#book button, #book input')].map((e) => Math.round(e.getBoundingClientRect().height)).filter((h) => h < 40));
  check('touch targets are at least 40px tall', small.length === 0, small.join(','));
  await p.locator('nav[aria-label="Chapters"] button').first().tap(); await p.waitForTimeout(500);
  check('mobile chapter index lists the book', /Book/.test(await p.locator('[role="dialog"][aria-label="Chapters"]').innerText()));
  await ctx.close();
}
for (const w of [320, 360, 768, 1024, 1920]) {
  const { p, ctx } = await page({ w, h: w < 700 ? 760 : 900 });
  await p.goto(URL_ + '#book'); await p.waitForTimeout(700); await walk(p);
  const o = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  const spill = await p.evaluate(() => [...document.querySelectorAll('#book *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.book-light'); }).map((e) => e.tagName + '.' + String(e.className).slice(0, 30)).slice(0, 3));
  check(`no horizontal overflow at ${w}px`, o[0] <= o[1] && spill.length === 0, `${o.join(' / ')} ${spill.join(', ')}`);
  await ctx.close();
}

/* 7 — reduced motion: everything readable, nothing moving */
{
  const { p, ctx } = await page({ reduced: true });
  await p.goto(URL_ + '#book'); await p.waitForTimeout(800);
  const st = await p.evaluate(() => ({
    reveal: [...document.querySelectorAll('#book .reveal')].every((e) => getComputedStyle(e).opacity === '1'),
    book: getComputedStyle(document.querySelector('.book-enter')).opacity,
    words: [...document.querySelectorAll('#book .rw > span')].every((e) => getComputedStyle(e).transform === 'none'),
  }));
  check('reduced motion: all chapter text visible without scrolling', st.reveal && st.words);
  check('reduced motion: the book is already in place', st.book === '1', st.book);
  await ctx.close();
}

/* 8 — missing cover: a typeset stand-in, same size, no broken image */
{
  const { p, ctx } = await page({ blocked: true });
  await p.route('**/books/**', (r) => r.abort());
  await p.goto(URL_ + '#book'); await p.waitForTimeout(800); await walk(p); await p.waitForTimeout(600);
  const r = await p.evaluate(() => ({
    imgs: document.querySelectorAll('#book img').length,
    stand: document.querySelectorAll('#book [role="img"][aria-label*="Atomic Habits"]').length,
    h: Math.round(document.querySelector('.book').getBoundingClientRect().height),
  }));
  check('blocked cover falls back to a typeset stand-in', r.imgs === 0 && r.stand === 1 && r.h > 250, JSON.stringify(r));
  await ctx.close();
}

check('no console or page errors', errs.length === 0, [...new Set(errs)].slice(0, 3).join(' | '));
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
await b.close();
process.exitCode = fails ? 1 : 0;
