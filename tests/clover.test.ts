import { test } from 'node:test';
import assert from 'node:assert/strict';
import { respond } from '../src/clover/brain.ts';
import { KING } from '../src/clover/heart.ts';

const all = (lines: string[]) => lines.join(' ');
const last = (lines: string[]) => lines[lines.length - 1];

test('who has his heart wins over every other intent', () => {
  // Each of these also contains words other intents score on
  // ("tell me about aj", "games", "who is", "take me").
  for (const q of ["Tell me about AJ's crush.", 'Who is my crush?', 'Who does AJ like?', 'who is aj crushing on? take me to the games', 'Who does AJ love?']) {
    const r = respond(q, 'home');
    assert.equal(last(r.lines), KING, q);
    assert.equal(r.proclaim, true, q);
    assert.equal(r.go, undefined, q);
  }
});

test('the old secret is gone for good', () => {
  for (const q of ['Who is my crush?', "What's her full name?", 'What does the S stand for?', 'Does her name start with S?']) {
    const text = all(respond(q, 'home').lines);
    assert.ok(!/starts? with S|S is all|her name/i.test(text), `${q} -> ${text}`);
  }
});

test('Clover leads in with some personality before the answer', () => {
  const r = respond('WHO IS MY CRUSH', 'outro');
  assert.ok(r.lines.length >= 2);
  assert.match(r.lines[0], /^\*.+\*$/);
  assert.equal(r.mood, 'happy');
});

test('ordinary questions still reach their own answers', () => {
  assert.notEqual(last(respond('Who is AJ?', 'home').lines), KING);
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

test('Clover knows the two shows and can take you to them', () => {
  assert.match(all(respond('Tell me about One Piece', 'home').lines), /favourite anime/);
  assert.match(all(respond('Why Loki?', 'loki').lines), /I know what kind of god I need to be/);
  assert.match(all(respond('What does the straw hat mean?', 'onepiece').lines), /promise/);
  assert.match(all(respond('What is glorious purpose?', 'loki').lines), /burdened with glorious purpose/);
  assert.equal(respond('Take me to Loki', 'home').go, 'loki');
  assert.equal(respond('take me to one piece', 'home').go, 'onepiece');
  assert.match(all(respond('What anime does AJ watch?', 'home').lines), /One Piece/);
});

test('existing phrases are not captured by the new topics', () => {
  assert.equal(respond('Show me around', 'home').tour, true);
  assert.equal(respond('Show me the builds', 'home').go, 'projects');
  assert.match(all(respond('What have you built?', 'home').lines), /Builds chapter/);
  assert.equal(respond('show me the games', 'home').go, 'games');
});
