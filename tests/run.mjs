// `npm test` — runs every test file with Node's built-in runner.
// (Imported directly rather than via `node --test <glob>`, which some
// distro builds of Node ship broken.)
import { readdirSync } from 'node:fs';

const dir = new URL('./', import.meta.url);
for (const file of readdirSync(dir).filter((f) => f.endsWith('.test.ts')).sort()) {
  await import(new URL(file, dir).href);
}
