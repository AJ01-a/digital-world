// `npm run test:e2e` — builds the site, serves it under /digital-world/ (the
// GitHub Pages path, so broken asset paths show up) and runs each browser
// suite against it. `npm run test:e2e -- --no-build` reuses the existing dist/.
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const SUITES = ['site.mjs', 'intro.mjs', 'worlds.mjs', 'shows.mjs', 'finale.mjs'];

if (!process.argv.includes('--no-build')) {
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const server = await preview({ base: '/digital-world/', logLevel: 'warn', preview: { port: 4180 } });
const url = server.resolvedUrls.local[0];
// Async on purpose: the preview server runs in this process and must keep
// answering requests while a suite runs.
const run = (suite) =>
  new Promise((done) => {
    spawn(process.execPath, [fileURLToPath(new URL(suite, import.meta.url)), url], { stdio: 'inherit' }).on('close', done);
  });
const failed = [];
for (const suite of SUITES) {
  console.log(`\n── ${suite} · ${url}\n`);
  if ((await run(suite)) !== 0) failed.push(suite);
}
await server.close();

console.log(failed.length ? `\nFailed: ${failed.join(', ')}` : `\nAll ${SUITES.length} browser suites passed.`);
process.exitCode = failed.length ? 1 : 0;
