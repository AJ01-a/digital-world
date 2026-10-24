import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCrushFollowUp, isCrushQuestion, normalizeCrush } from '../src/clover/crush.ts';

const SHOULD_TRIGGER = [
  // From the brief
  'Who is my crush?',
  'who is my crush',
  'WHO IS MY CRUSH?',
  "Who's AJ's crush?",
  'Who does AJ have a crush on?',
  'Do you know who my crush is?',
  "Tell me about AJ's crush.",
  'Who does he like?',
  'Who is AJ crushing on?',
  'Can you tell me who AJ likes?',
  'Does AJ have a crush on someone?',
  'Who is the person AJ likes?',
  // Punctuation, spacing, quotes and contractions
  'whos my crush',
  'whos ajs crush??',
  'Who’s AJ’s crush?',
  '   who   is    MY   crush   ',
  'who is my crush!!!',
  'wHo Is Aj CrUsHiNg On',
  'aj has a crush?',
  // Natural variations
  'Does AJ have a crush?',
  'Is AJ crushing on anyone?',
  "Spill it, who's his crush",
  'Who does AJ like?',
  'who does aj have feelings for',
  'Who is AJ in love with?',
  'Does AJ like someone?',
  "Who's the girl AJ likes?",
  'Tell me who my crush is',
  "What's AJ's secret crush?",
  'Clover, who is your owner’s crush?',
  'Guess who my crush is',
];

const SHOULD_NOT_TRIGGER = [
  // Ordinary questions
  'Who is AJ?',
  'What does AJ like?',
  'What is AJ into?',
  'Tell me about AJ',
  'Take me to the games',
  'Tell me about Sekiro',
  'Does AJ like dogs?',
  'Who likes AJ?',
  'What breed are you?',
  'Is AJ an expert?',
  // "crush" in other senses
  'I crushed that chess puzzle',
  'Crush the competition',
  'Does AJ play Candy Crush?',
  'You are crushing it, Clover',
  'How do I crush garlic?',
  // A visitor talking about their own crush
  'I have a crush on you, Clover',
  'My crush ignored me today',
  'I think my crush likes me',
  // Comparisons and topics, not people
  'Who does AJ like more, Sekiro or Elden Ring?',
  'Which game does AJ like best?',
  'Who does AJ like to play as?',
  // Lots of S's, no crush
  'Show me the sections, sir',
  'S',
  'Does Sekiro start with S?',
];

for (const q of SHOULD_TRIGGER) {
  test(`triggers: ${JSON.stringify(q)}`, () => assert.equal(isCrushQuestion(q), true));
}

for (const q of SHOULD_NOT_TRIGGER) {
  test(`stays quiet: ${JSON.stringify(q)}`, () => assert.equal(isCrushQuestion(q), false));
}

test('normalises case, quotes, contractions and possessives', () => {
  assert.equal(normalizeCrush("  WHO’S  AJ's   Crush?! "), ' who is aj crush ');
  assert.equal(normalizeCrush('whos ajs crush'), ' who is aj crush ');
  assert.equal(normalizeCrush("Doesn't he?"), ' does not he ');
});

test('follow-ups asking for more are recognised', () => {
  for (const q of ["What's her name?", 'What is her full name', 'Who is she?', 'What does the S stand for?', 'Tell me more about her']) {
    assert.equal(isCrushFollowUp(q), true, q);
  }
  for (const q of ['Is it real?', 'What is your name?', 'Who is AJ?', 'Tell me more about Omarchy']) {
    assert.equal(isCrushFollowUp(q), false, q);
  }
});
