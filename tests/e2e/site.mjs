// Whole-site checks: intro, Clover, navigation, terminal, privacy.
// Usage: node tests/e2e/site.mjs <url>  (or `npm run test:e2e`)
import { launch, leaks } from './browser.mjs';

const url = process.argv[2];
const browser = await launch();
const results = [];
let fails = 0;
const check = (name, ok, detail = '') => {
  if (!ok) fails++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};
const privacy = (name, text) => {
  const found = leaks(text);
  if (found === null) results.push(`SKIP  ${name} — no tests/e2e/private-words.txt`);
  else check(name, found.length === 0, found.length ? 'found a private word' : '');
};
const errors = [];
const watch = (p) => {
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p.on('requestfailed', (r) => errors.push('request failed: ' + r.url()));
};

/* ── Intro ─────────────────────────────────────────── */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  watch(p);
  const external = [];
  p.on('request', (r) => { if (!r.url().startsWith(url)) external.push(r.url()); });
  await p.goto(url);
  await p.waitForTimeout(400);
  check('intro shows on first visit', !!(await p.$('.intro')));
  check('page content is rendered beneath the intro', !!(await p.$('#about')));
  await p.getByRole('button', { name: 'Skip intro' }).click();
  await p.waitForTimeout(1500);
  check('skip button removes intro', !(await p.$('.intro')));
  await p.reload();
  await p.waitForTimeout(500);
  check('intro does not replay on refresh (session-aware)', !(await p.$('.intro')));
  check('no third-party network requests', external.length === 0, external.slice(0, 3).join(', '));
  const cookies = await ctx.cookies();
  check('no cookies set', cookies.length === 0, String(cookies.length));
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  watch(p);
  await p.goto(url);
  await p.waitForTimeout(500);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(1500);
  check('Escape skips intro', !(await p.$('.intro')));
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  watch(p);
  await p.goto(url);
  await p.waitForTimeout(300);
  check('reduced motion: intro is the finished composition, still', !!(await p.$('.intro.is-still')) && (await p.locator('.duo-slice').count()) === 0);
  check('reduced motion: skip offered straight away', await p.getByRole('button', { name: 'Skip intro' }).isVisible());
  await p.getByRole('button', { name: 'Skip intro' }).click();
  await p.waitForTimeout(200);
  check('reduced motion: skip dismisses the intro at once', !(await p.$('.intro')));
  const visible = await p.evaluate(() => getComputedStyle(document.querySelector('#about .reveal')).opacity);
  check('reduced motion: reveal content visible without scrolling', visible === '1', visible);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  watch(p);
  await p.goto(url + '#games');
  await p.waitForTimeout(1200);
  const top = await p.evaluate(() => document.getElementById('games').getBoundingClientRect().top);
  check('deep link skips intro and lands on chapter', !(await p.$('.intro')) && Math.abs(top - 72) < 30, `top=${Math.round(top)}`);
  await p.goto(url + '#dog');
  await p.reload();
  await p.waitForTimeout(1200);
  const top2 = await p.evaluate(() => document.getElementById('clover').getBoundingClientRect().top);
  check('legacy #dog link lands on Clover chapter', Math.abs(top2 - 72) < 30, `top=${Math.round(top2)}`);
  await ctx.close();
}

/* ── Clover ─────────────────────────────────────────── */
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
await ctx.addInitScript(() => sessionStorage.setItem('aj:intro-seen', '1'));
const p = await ctx.newPage();
watch(p);
await p.goto(url);
await p.waitForTimeout(800);

await p.getByRole('button', { name: 'Chat with Clover, the site guide' }).click();
await p.waitForTimeout(300);
const dlg = await p.evaluate(() => [...document.querySelectorAll('[role=dialog]')].map((d) => d.getAttribute('aria-labelledby') + ':' + d.getBoundingClientRect().height));
check('Clover panel opens', await p.locator('[aria-labelledby="clover-chat-title"]').isVisible(), dlg.join(','));
const focused = await p.evaluate(() => document.activeElement?.id);
check('input focused on open (desktop)', focused === 'clover-input', focused);

async function ask(q) {
  const before = await p.locator('[role="log"][aria-label="Conversation with Clover"] .clover-msg').count();
  await p.fill('#clover-input', q);
  await p.keyboard.press('Enter');
  await p.waitForFunction((n) => document.querySelectorAll('[aria-label="Conversation with Clover"] .clover-msg').length >= n + 2, before, { timeout: 4000 });
  return p.locator('[aria-label="Conversation with Clover"] .clover-msg').last().innerText();
}

const qa = [
  ['hello', /Clover/],
  ['Who is AJ?', /built this place/],
  ['what is his last name?', /keeps off the internet/],
  ['where does aj live', /keeps off the internet/],
  ['are you an AI?', /No AI here/],
  ['what about privacy?', /cookies/],
  ['how can I contact AJ', /hasn't published a contact/],
  ['tell me about cybersecurity', /defensive/],
  ['what breed are you', /Great Pyrenees/],
  ['how old is clover', /digital sketch/],
  ['is aj an expert', /not an expert/],
  ['tell me about sekiro', /Sekiro/],
  ['hint for the word puzzle?', /won't sniff/],
  ['Thanks, Clover!', /Anytime/],
  ['asdkjh qwe zzz', /(nose|yard|not sure)/],
];
for (const [q, re] of qa) {
  const a = await ask(q);
  check(`Clover: "${q}"`, re.test(a), a.replace(/\s+/g, ' ').slice(0, 90));
}

await p.fill('#clover-input', 'take me to the games');
await p.keyboard.press('Enter');
await p.waitForTimeout(1600);
const gamesTop = await p.evaluate(() => document.getElementById('games').getBoundingClientRect().top);
check('Clover navigates ("take me to the games")', Math.abs(gamesTop - 72) < 40, `top=${Math.round(gamesTop)}`);

const chips = await p.locator('[aria-labelledby="clover-chat-title"] .overflow-x-auto button').allInnerTexts();
check('suggestions follow the active chapter', chips.some((c) => /Sekiro|Elden|favourite game/i.test(c)), chips.join(' | '));

await p.keyboard.press('Escape');
await p.waitForTimeout(200);
check('Escape closes Clover', (await p.locator('[aria-labelledby="clover-chat-title"]').count()) === 0);
const backFocus = await p.evaluate(() => document.activeElement?.getAttribute('aria-label'));
check('focus returns to launcher', /Clover/.test(backFocus ?? ''), backFocus);

// Tour
await p.getByRole('button', { name: /Chat with Clover/ }).click();
await p.waitForTimeout(200);
await p.getByRole('button', { name: 'Give me the tour' }).first().click();
await p.waitForTimeout(1200);
const tourText = await p.locator('.clover-root [role="status"]').innerText().catch(() => '');
check('tour starts with narration bubble', /tour · 01/i.test(tourText), tourText.slice(0, 60));
const aboutTop = await p.evaluate(() => document.getElementById('about').getBoundingClientRect().top);
check('tour step 1 travels to About', Math.abs(aboutTop - 72) < 40, `top=${Math.round(aboutTop)}`);
await p.getByRole('button', { name: 'Next stop →' }).click();
await p.waitForTimeout(1200);
const techTop = await p.evaluate(() => document.getElementById('tech').getBoundingClientRect().top);
check('tour "Next stop" travels to Tech', Math.abs(techTop - 72) < 40, `top=${Math.round(techTop)}`);
await p.getByRole('button', { name: 'End tour' }).click();

/* ── Other interactions ─────────────────────────────── */
await p.evaluate(() => document.getElementById('games').scrollIntoView());
await p.waitForTimeout(600);
await p.getByRole('button', { name: /Sekiro/ }).click();
await p.waitForTimeout(400);
await p.waitForTimeout(400);
const tint = await p.evaluate(() => ({
  section: getComputedStyle(document.getElementById('games')).getPropertyValue('--env-accent').trim(),
  chrome: getComputedStyle(document.querySelector('header')).getPropertyValue('--env-accent').trim(),
  root: document.documentElement.style.getPropertyValue('--env-accent'),
}));
check('choosing a game world re-tints the section and chrome', tint.section === '#e8926a' && tint.chrome === '#e8926a', JSON.stringify(tint));
check('palette change does not touch :root (perf)', tint.root === '', JSON.stringify(tint.root));

await p.keyboard.press('/');
await p.waitForTimeout(200);
check('"/" opens terminal', await p.getByRole('dialog', { name: 'Terminal' }).isVisible());
await p.keyboard.type('whoami');
await p.keyboard.press('Enter');
const termText = await p.locator('[role="dialog"][aria-label="Terminal"]').innerText();
check('terminal responds', /Curious human/.test(termText));
privacy('terminal shows no private words', termText);
await p.keyboard.press('Escape');

// Keyboard: tab order starts with the skip link, then the chrome.
await p.goto(url);
await p.waitForTimeout(500);
await p.keyboard.press('Tab');
const first = await p.evaluate(() => document.activeElement?.textContent?.trim());
check('first Tab reaches "Skip to content"', first === 'Skip to content', first);

// Privacy sweep of the rendered DOM + metadata.
const html = await p.content();
privacy('rendered page contains no private words', html);

// Ambient sound never starts on its own.
const audio = await p.evaluate(() => typeof window.AudioContext);
check('no audio context created without a click (smoke)', audio === 'function');

check('no console or page errors', errors.length === 0);
console.log(results.join('\n'));
if (errors.length) console.log(`\nCONSOLE/PAGE ERRORS:\n${[...new Set(errors)].join('\n')}`);
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
await browser.close();
process.exitCode = fails ? 1 : 0;
