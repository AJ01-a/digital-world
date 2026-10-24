// Shared setup for the browser suites.
import { chromium } from 'playwright-core';
import { existsSync, readFileSync } from 'node:fs';

/** Headless Chromium — Playwright's own copy, or CHROME_PATH if set. */
export async function launch() {
  try {
    return await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  } catch (e) {
    console.error('Could not start Chromium. Run `npx playwright-core install chromium` once,\nor set CHROME_PATH to a Chrome or Chromium binary.\n');
    throw e;
  }
}

/*
 * Words that must never appear on the site (a surname, say). They live in a
 * git-ignored file, one per line, so the check itself never publishes them.
 */
const PRIVATE = new URL('./private-words.txt', import.meta.url);
const words = existsSync(PRIVATE)
  ? readFileSync(PRIVATE, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter((w) => w && !w.startsWith('#'))
  : [];

/** null when there is nothing to check against, otherwise the words found. */
export const leaks = (text) => (words.length ? words.filter((w) => text.toLowerCase().includes(w)) : null);
