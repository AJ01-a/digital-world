import { test } from 'node:test';
import assert from 'node:assert/strict';
import { respond } from '../src/clover/brain.ts';
import { CRUSH_REPLY, CRUSH_SEALED } from '../src/clover/crush.ts';

const all = (lines: string[]) => lines.join(' ');

test('the secret wins over every other intent', () => {
  // Each of these also contains words other intents score on
  // ("tell me about aj", "games", "who is", "take me").
  for (const q of ["Tell me about AJ's crush.", 'Who is my crush?', 'Who does AJ like?', 'who is aj crushing on? take me to the games']) {
    assert.deepEqual(respond(q, 'home').lines, CRUSH_REPLY, q);
  }
});

test('the same answer every time', () => {
  const a = respond('Who is my crush?', 'clover');
  const b = respond('WHO IS MY CRUSH', 'outro');
  assert.deepEqual(a, b);
});

test('reveals the initial S and nothing more', () => {
  const text = all(CRUSH_REPLY);
  assert.match(text, /starts with S!/);
  // No capitalised name-like word other than the letter itself and AJ.
  const capitals = text.match(/\b[A-Z][a-z]+\b/g) ?? [];
  assert.deepEqual(capitals.filter((w) => !['Okay'].includes(w)), []);
  assert.ok(!/\bS[a-z]{2,}/.test(text.replace(/S!/, '')));
});

test('follow-ups stay sealed', () => {
  assert.deepEqual(respond("What's her full name?", 'home').lines, CRUSH_SEALED);
});

test('ordinary questions still reach their own answers', () => {
  assert.notDeepEqual(respond('Who is AJ?', 'home').lines, CRUSH_REPLY);
  assert.match(all(respond('What does AJ like?', 'home').lines), /interests/i);
  assert.equal(respond('Take me to the games', 'home').go, 'games');
  assert.match(all(respond('Tell me about Monster Hunter', 'games').lines), /Monster Hunter: World/);
  for (const q of ['Tell me about Ragnarok', 'Ragnarök?', 'What about God of War?']) assert.match(all(respond(q, 'games').lines), /^God of War Ragnarök:/, q);
  assert.match(all(respond('What car is that?', 'driving').lines), /Buick Envista/);
});

test('games answer lists every world on the site', () => {
  const text = all(respond('What games does AJ play?', 'home').lines);
  for (const t of ['Monster Hunter: World', 'Elden Ring', 'Sekiro', 'God of War Ragnarök', 'Black Myth: Wukong']) assert.ok(text.includes(t), t);
});
