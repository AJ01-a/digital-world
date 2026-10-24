/**
 * Clover's one secret.
 *
 * Asked who AJ has a crush on, Clover leans in and gives away a single
 * letter — and nothing else. This is a joke, not a data source: it never
 * names anyone, never stores what was asked, and runs entirely in the
 * browser like the rest of Clover's brain.
 *
 * Kept free of imports so it can be unit-tested on its own
 * (tests/crush.test.ts).
 */

export const CRUSH_REPLY = [
  '*glances around suspiciously, lowers his voice and leans in closer…*',
  "Okay, but you didn't hear this from me… her name starts with S!",
];

export const CRUSH_SEALED = [
  "*zips mouth* S is all you're getting. I've already said too much — AJ would never trust me with a secret again.",
];

/** Lowercase, straighten quotes, expand contractions and possessives, drop punctuation. */
export function normalizeCrush(input: string) {
  return ` ${input
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/\b(who|what|where|he|she|it|that)'s\b/g, '$1 is')
    .replace(/\b(who|what|he|she)'d\b/g, '$1 would')
    .replace(/\b(do|does|is|did|has|have)n'?t\b/g, '$1 not')
    .replace(/\byou're\b/g, 'you are')
    // "aj's crush" / "ajs crush" -> "aj crush"
    .replace(/\b(aj|owner|human|dad|person)'?s\b/g, '$1')
    .replace(/'/g, '')
    // The contraction without an apostrophe: "whos my crush".
    .replace(/\bwhos\b/g, 'who is')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

/* Who the question is about. "My" counts because AJ is the one who will ask. */
const SUBJECT = String.raw`(?:aj|he|his|him|my|your (?:owner|human|dad|person))`;

const THIRD_PERSON = new RegExp(String.raw` (?:aj|he|his|him|your (?:owner|human|dad|person)) `);

/* "crush" used for something other than a person. */
const NOT_ROMANTIC =
  / candy crush | crush(?:ing|es)? (?:it|them|the|that|this|those|these|ice|garlic|cans?|bugs?|enemies|competition|a (?!crush))| crushed /;

/* The relationship sense of crush: "aj crush", "crush on", "have a crush", "crushing on". */
const CRUSH_PHRASE = new RegExp(
  [
    String.raw` ${SUBJECT} (?:secret |current |big |little )?crush(?:es)? `,
    String.raw` crush(?:ing)? on `,
    String.raw` (?:have|has|got|having) (?:a |any )?(?:secret |little |big )?crush`,
    String.raw` ${SUBJECT} (?:is |been )?crushing `,
  ].join('|'),
);

/* Something that makes it a question or a request to be told. */
const ASKING = / (?:who|whom|tell|know|name|reveal|spill|guess|which|does|do|is|did|any|anyone|someone|somebody|secret|about) /;

/* "my crush" on its own is often about the visitor — ask for identity to count it. */
const ASKING_WHO = / (?:who|whom|name|tell|know|guess|reveal|spill|which) /;

/* "Who does AJ like?" — a person, liked by AJ. */
const LIKE_VERB = String.raw`(?:like|likes|liking|into|fancy|fancies|love|loves|in love with|have feelings for|has feelings for|has a thing for|have a thing for|is sweet on)`;
const WHO_LIKES = new RegExp(
  [
    // who does aj like / who is aj into / who aj likes
    String.raw` who(?:m)? (?:(?:does|do|did|is|would) )?${SUBJECT} (?:really |secretly |actually )?${LIKE_VERB} `,
    // who is the person (that) aj likes / the girl aj likes
    String.raw` (?:person|girl|someone|somebody|one) (?:that |who )?${SUBJECT} (?:really |secretly )?${LIKE_VERB} `,
    // does aj like someone / does aj have feelings for anyone
    String.raw` (?:does|do|is) ${SUBJECT} ${LIKE_VERB} (?:someone|somebody|anyone|anybody|a girl|a person) `,
  ].join('|'),
);

/* Comparisons and topics — "who does AJ like more, Sekiro or Elden Ring?" */
const NOT_A_PERSON = / or | more | better | most | best | favou?rite | games? | chess | linux | music | food | team | (?:like|likes|love|loves) to /;

export function isCrushQuestion(input: string): boolean {
  const t = normalizeCrush(input);
  if (t.length > 200) return false;

  if (t.includes(' crush') && !NOT_ROMANTIC.test(t) && CRUSH_PHRASE.test(t)) {
    // About AJ: any question or request will do.
    if (THIRD_PERSON.test(t)) return ASKING.test(t) || input.includes('?');
    // "My crush" — only when asking who it is, not telling Clover about yours.
    return / my (?:secret |current |big |little )?crush/.test(t) && ASKING_WHO.test(t);
  }

  return WHO_LIKES.test(t) && !NOT_A_PERSON.test(t);
}

/** "What's her full name?" — the follow-ups Clover will not answer. */
export function isCrushFollowUp(input: string): boolean {
  const t = normalizeCrush(input);
  return /( her (?:full |real |whole |last )?name | who is she | what does (?:the )?s stand for | more about her | starts with s | what is the rest)/.test(
    t,
  );
}
