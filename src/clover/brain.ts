/**
 * Clover's brain — a small, local intent matcher.
 *
 * There is no language model and no server: what a visitor types is scored
 * against hand-written intents below, entirely in the browser, and nothing
 * leaves the page. Every factual answer is assembled from `data/content.ts`
 * and `data/worlds.ts` — the same copy the page shows — so Clover can never
 * claim something about AJ that the site itself does not say.
 *
 * Clover's personality is fictional. Questions about the real dog get a
 * friendly deflection rather than invented facts.
 */
import { AUTOMATION_COPY, BUILDS, CLOVER, DRIVING, FACTS, OMARCHY, TECH_COPY, TOPICS } from '../data/content';
import { GAME_WORLDS, SCENE_MAP, type SceneId } from '../data/worlds';
import type { Mood } from './CloverArt';
import { CRUSH_REPLY, CRUSH_SEALED, isCrushFollowUp, isCrushQuestion } from './crush';

export type Action =
  | { label: string; kind: 'goto'; to: SceneId }
  | { label: string; kind: 'ask'; text: string }
  | { label: string; kind: 'tour' }
  | { label: string; kind: 'ambient' }
  | { label: string; kind: 'terminal' };

export interface Reply {
  lines: string[];
  mood: Mood;
  actions?: Action[];
  /** Travel to this chapter after answering. */
  go?: SceneId;
  /** Start the guided tour. */
  tour?: boolean;
}

/* ── text helpers ─────────────────────────────────────────── */

export function normalize(input: string) {
  return ` ${input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

const topic = (id: string) => TOPICS.find((t) => t.id === id)?.blurb ?? '';
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const go = (label: string, to: SceneId): Action => ({ label, kind: 'goto', to });
const ask = (label: string, text = label): Action => ({ label, kind: 'ask', text });

/* ── where things are ─────────────────────────────────────── */

const PLACES: { id: SceneId; words: string[] }[] = [
  { id: 'home', words: ['home', 'top', 'start', 'beginning'] },
  { id: 'about', words: ['about', 'about page', 'bio'] },
  { id: 'tech', words: ['tech', 'technology', 'signal map', 'network map', 'skills'] },
  { id: 'omarchy', words: ['omarchy', 'setup', 'workspace'] },
  { id: 'automation', words: ['automation', 'lab', 'pipeline', 'claude code'] },
  { id: 'projects', words: ['projects', 'project', 'builds', 'portfolio'] },
  { id: 'games', words: ['games', 'game', 'gaming'] },
  { id: 'strategy', words: ['chess', 'strategy', 'chess puzzle'] },
  { id: 'words', words: ['word puzzle', 'word game', 'wordle', 'words'] },
  { id: 'driving', words: ['drive', 'driving', 'road', 'night drive'] },
  { id: 'clover', words: ['clover', 'your chapter', 'dog chapter', 'walks'] },
  { id: 'outro', words: ['end', 'bottom', 'footer', 'outro'] },
];

const MOVE = /\b(take|go|bring|jump|navigate|show|open|scroll|visit|head|move|lead|get|back) (me )?(to|back to|down to|up to|over to)?\b|\bwhere (is|are|can i find)\b/;

function findPlace(text: string): SceneId | null {
  let best: { id: SceneId; len: number } | null = null;
  for (const p of PLACES) {
    for (const w of p.words) {
      if (text.includes(` ${w} `) && (!best || w.length > best.len)) best = { id: p.id, len: w.length };
    }
  }
  return best?.id ?? null;
}

/* ── the tour ─────────────────────────────────────────────── */

export const TOUR: { to: SceneId; line: string }[] = [
  { to: 'about', line: "First stop: AJ, the short version. There's a button down there that shuffles random facts — worth a press." },
  { to: 'tech', line: 'The signal map. Every node is something AJ is learning — hover or tap one and it lights up.' },
  { to: 'automation', line: "The lab: how AJ turns ideas into running code with Claude Code and WSL. The terminal here is a scripted illustration, not a real one." },
  { to: 'projects', line: 'Builds. Everything listed here actually runs on this page — me included.' },
  { to: 'games', line: 'Games. Pick a world and the whole site changes colour with it — and Monster Hunter has a whole ecosystem to explore.' },
  { to: 'strategy', line: "Chess puzzles, one move each. I'd help, but I don't have thumbs." },
  { to: 'driving', line: 'The night drive — a white Envista on an empty road. On a computer, your pointer sets the pace.' },
  { to: 'clover', line: 'And this is my chapter. Hi again! *wags*' },
  { to: 'outro', line: "That's the tour. Thanks for walking with me — ask me anything, any time." },
];

/* ── suggestions that follow the reader ───────────────────── */

const SUGGEST: Record<SceneId, string[]> = {
  home: ['Give me the tour', 'Who is AJ?', 'What are you?'],
  about: ['What is AJ into?', 'Tell me a random fact', 'Is AJ an expert?'],
  tech: ['Tell me about cybersecurity', 'What about networking?', 'How does AJ use AI?'],
  omarchy: ['What is Omarchy?', 'What editor does AJ use?', 'Take me to the lab'],
  automation: ['Is that terminal real?', 'How does AJ use Claude Code?', 'Show me the builds'],
  projects: ['How do you work?', 'How was this site made?', 'Take me to the chess puzzle'],
  games: ['Tell me about Monster Hunter', "What's AJ's favourite game?", 'Tell me about Sekiro'],
  strategy: ['Give me a hint', 'Is AJ good at chess?', 'Take me to the word puzzle'],
  words: ['Hint for the word puzzle?', 'Where do the words come from?', 'Take me to the drive'],
  driving: ['Why the drives?', 'What car is that?', 'Take me to Clover'],
  clover: ['What breed are you?', 'Do a trick!', 'Are you a real dog?'],
  outro: ['Back to the top', 'How can I contact AJ?', 'Thanks, Clover!'],
};

export const suggestionsFor = (scene: SceneId) => SUGGEST[scene];

/* ── intents ──────────────────────────────────────────────── */

interface Intent {
  id: string;
  /** Single words score 2, phrases 3 — longer, more specific matches win. */
  keys: string[];
  reply: (text: string) => Reply;
}

const TRICKS = [
  '*sits perfectly* … I was told there would be applause.',
  '*offers a paw* Pleasure to meet you.',
  '*rolls over* The belly is available for rubs. Digitally.',
  '*spins in a circle twice* That one is my favourite.',
  '*play bow* Okay, now YOU do one.',
  'Woof! (That means "thanks for visiting" in dog.)',
];

const JOKES = [
  "Why did the dog sit in the shade? Because he didn't want to be a hot dog.",
  "I tried to learn networking, but I kept chasing the packets.",
  "What do you call a dog who knows Linux? A command-line retriever.",
  "My favourite protocol? Fetch. Obviously.",
  "I'd tell you a UDP joke, but you might not get it.",
];

const ABOUT_AJ = [
  "AJ built this place. From what he's chosen to share: he's into technology — computers, Linux, networking, cybersecurity and AI — and building useful things, this site included.",
  "Outside of that: story-driven games, chess, long drives with no destination, and walks with the real me.",
];

const INTENTS: Intent[] = [
  {
    id: 'greet',
    keys: ['hi', 'hello', 'hey', 'yo', 'hiya', 'howdy', 'sup', 'good morning', 'good evening', 'good afternoon'],
    reply: () => ({
      lines: ["Woof — hi there! I'm Clover. I show visitors around AJ's digital world.", 'Want the quick tour, or are you looking for something?'],
      mood: 'happy',
      actions: [{ label: 'Give me the tour', kind: 'tour' }, ask('What can you do?')],
    }),
  },
  {
    id: 'help',
    keys: ['help', 'what can you do', 'what do you do', 'commands', 'options', 'how does this work', 'menu'],
    reply: () => ({
      lines: [
        'Here is what I can do:',
        '• Give you a guided tour of the site',
        '• Take you to any chapter — "take me to the games"',
        "• Answer questions about what AJ has shared here: his tech interests, projects, games and more",
        '• A few tricks, if you ask nicely',
      ],
      mood: 'happy',
      actions: [{ label: 'Start the tour', kind: 'tour' }, ask('Who is AJ?'), ask('Do a trick!')],
    }),
  },
  {
    id: 'tour',
    keys: ['tour', 'show me around', 'guide me', 'walk me through', 'give me the tour', 'explore', 'guided tour'],
    reply: () => ({ lines: ["Let's go! Stay close — I'll talk you through each stop."], mood: 'happy', tour: true }),
  },
  {
    id: 'who-aj',
    keys: ['who is aj', 'about aj', 'tell me about aj', 'who made this', 'who built this', 'whose site', 'who owns', 'aj', 'creator', 'author'],
    reply: () => ({ lines: ABOUT_AJ, mood: 'idle', actions: [go('Read the about page', 'about'), ask('What is AJ into?')] }),
  },
  {
    id: 'interests',
    keys: ['interests', 'hobbies', 'what is aj into', 'what does aj like', 'enjoy', 'likes', 'passions', 'into'],
    reply: () => ({
      lines: [
        "AJ's interests, as listed on this site:",
        '• Technology — Linux, networking, cybersecurity, systems',
        '• AI and automation, especially in the terminal',
        '• Building useful digital projects',
        '• Story-driven games and chess',
        '• Long drives, and walks with Clover (the real one)',
      ],
      mood: 'happy',
      actions: [go('See the signal map', 'tech'), go('See the builds', 'projects')],
    }),
  },
  {
    id: 'tech',
    keys: ['technology', 'tech', 'computers', 'computer', 'hardware', 'systems', 'sysadmin'],
    reply: () => ({ lines: [`In AJ's words: "${TECH_COPY.body}"`], mood: 'idle', actions: [go('Open the signal map', 'tech')] }),
  },
  {
    id: 'network',
    keys: ['networking', 'network', 'networks', 'subnet', 'subnets', 'routing', 'dns', 'tcp', 'ip address', 'router'],
    reply: () => ({ lines: [`Networking, in AJ's words: "${topic('net')}"`], mood: 'idle', actions: [ask('And cybersecurity?'), go('Show the signal map', 'tech')] }),
  },
  {
    id: 'security',
    keys: ['cybersecurity', 'security', 'cyber', 'infosec', 'hacking', 'hacker', 'hack', 'pentest', 'defensive', 'blue team'],
    reply: (t) => ({
      lines: [
        `Cybersecurity is one of AJ's big interests: "${topic('sec')}"`,
        ...(/ hack/.test(t) ? ["And no, I can't help hack anything. I'm a very good boy."] : []),
      ],
      mood: /hack/.test(t) ? 'curious' : 'idle',
      actions: [ask('What about networking?'), ask('Is AJ an expert?')],
    }),
  },
  {
    id: 'linux',
    keys: ['linux', 'distro', 'arch', 'ubuntu', 'kernel', 'terminal user'],
    reply: () => ({
      lines: [`"${topic('linux')}"`, 'One of his machines runs Omarchy, too.'],
      mood: 'idle',
      actions: [ask('What is Omarchy?'), go('See the setup', 'omarchy')],
    }),
  },
  {
    id: 'setup',
    keys: ['omarchy', 'setup', 'neovim', 'vim', 'tmux', 'zsh', 'tiling', 'wsl', 'dotfiles', 'editor', 'shell', 'what editor'],
    reply: () => ({
      lines: [
        'One of AJ\'s machines runs Omarchy — a keyboard-first, tiling Linux setup. The rest, as listed on the site:',
        ...OMARCHY.specs.map(([k, v]) => `• ${k}: ${v}`),
      ],
      mood: 'idle',
      actions: [go('See the setup', 'omarchy')],
    }),
  },
  {
    id: 'ai',
    keys: ['ai', 'artificial intelligence', 'claude', 'claude code', 'llm', 'machine learning', 'how does aj use ai', 'agents'],
    reply: () => ({
      lines: [`On AI: "${topic('ai')}"`, `In practice: ${AUTOMATION_COPY.body.split('. ')[1]}.`],
      mood: 'idle',
      actions: [go('Visit the lab', 'automation')],
    }),
  },
  {
    id: 'automation',
    keys: ['automation', 'automate', 'scripts', 'workflow', 'pipeline', 'productivity'],
    reply: () => ({ lines: [`"${topic('automation')}"`, AUTOMATION_COPY.body], mood: 'idle', actions: [go('Visit the lab', 'automation')] }),
  },
  {
    id: 'sim',
    keys: ['is that terminal real', 'is this real', 'is it real', 'real terminal', 'simulation', 'simulated', 'fake', 'is it running'],
    reply: () => ({
      lines: [`Honest answer: no. ${AUTOMATION_COPY.disclaimer} It is there to show the shape of AJ's workflow, not to pretend anything is running.`],
      mood: 'idle',
    }),
  },
  {
    id: 'code',
    keys: ['programming', 'coding', 'code', 'developer', 'programmer', 'languages', 'python', 'javascript', 'typescript', 'software'],
    reply: () => ({
      lines: [`"${topic('code')}"`, 'This site itself is written in TypeScript with React — you can see how in the Builds chapter.'],
      mood: 'idle',
      actions: [go('See the builds', 'projects')],
    }),
  },
  {
    id: 'projects',
    keys: ['projects', 'project', 'builds', 'built', 'portfolio', 'made', 'creations', 'show me the builds'],
    reply: () => ({
      lines: ['Everything in the Builds chapter is real and running on this page:', ...BUILDS.map((b) => `• ${b.name} — ${b.summary}`)],
      mood: 'happy',
      actions: [go('Show me the builds', 'projects')],
    }),
  },
  {
    id: 'stack',
    keys: ['how was this site made', 'how was this built', 'how is this made', 'stack', 'tech stack', 'react', 'vite', 'tailwind', 'framework', 'built with', 'source code', 'github', 'hosted', 'hosting'],
    reply: () => ({
      lines: [
        'This site is React and TypeScript, built with Vite and styled with Tailwind CSS. It is deployed to GitHub Pages by a GitHub Actions workflow.',
        'The backgrounds, the logo, the car and I are all drawn in code. The only pictures are AJ\'s own portrait artwork in the intro and the game artwork in the Games chapter.',
      ],
      mood: 'idle',
      actions: [go('See the builds', 'projects')],
    }),
  },
  {
    id: 'design',
    keys: ['design', 'colors', 'colours', 'logo', 'font', 'fonts', 'typography', 'style', 'theme', 'monogram'],
    reply: () => ({
      lines: [
        "The AJ mark is one shape, not two letters: the A's right stem carries on down and hooks into the J. The crossbar runs out as a little circuit trace to an orange node — the same orange as my fur.",
        'Each chapter tints the whole world a different colour. Pick a game world and watch it change.',
      ],
      mood: 'happy',
    }),
  },
  {
    id: 'games',
    keys: ['games', 'gaming', 'video games', 'favourite game', 'favorite game', 'what does aj play', 'play'],
    reply: () => ({
      lines: [
        `AJ likes games that feel like an experience — living worlds, stories and difficult combat. The ${GAME_WORLDS.length} on the site:`,
        ...GAME_WORLDS.map((g) => `• ${g.title} — ${g.line}`),
        'There is no single official favourite, but he does think Sekiro has the best combat system ever made.',
      ],
      mood: 'happy',
      actions: [go('Visit the game worlds', 'games')],
    }),
  },
  ...GAME_WORLDS.map<Intent>((g) => ({
    id: `game-${g.id}`,
    keys: [g.short.toLowerCase(), g.title.normalize('NFD').toLowerCase().replace(/[^a-z\s]/g, ''), ...(g.aliases ?? [])],
    reply: () => ({ lines: [`${g.title}: "${g.line}"`, `"${g.note}"`], mood: 'idle', actions: [go('Enter the game worlds', 'games')] }),
  })),
  {
    id: 'chess',
    keys: ['chess', 'strategy', 'checkmate', 'is aj good at chess', 'mate in one'],
    reply: () => ({
      lines: [
        'Chess is the game AJ keeps coming back to — thinking a few moves ahead, spotting patterns.',
        'Is he good? His words: "I am not a strong player. I just enjoy the part where you have to sit and think."',
      ],
      mood: 'idle',
      actions: [go('Try a puzzle', 'strategy')],
    }),
  },
  {
    id: 'hint',
    keys: ['hint', 'give me a hint', 'hint for the word puzzle', 'stuck', 'solution', 'answer', 'help me solve'],
    reply: (t) =>
      / word/.test(t)
        ? { lines: ["I won't sniff out the answer, but every word on the list is something from AJ's world — tech, chess, games, the road."], mood: 'curious' }
        : {
            lines: [
              "For the chess puzzles: look for checks first, then captures. And there's a 'Need a hint?' button right by the board.",
              'For the word puzzle: every word means something to AJ.',
            ],
            mood: 'curious',
          },
  },
  {
    id: 'words',
    keys: ['word puzzle', 'word game', 'wordle', 'guess the word', 'where do the words come from'],
    reply: () => ({
      lines: ['Five letters, six tries. The answers come from a short list of words that mean something to AJ — built from scratch for this page.'],
      mood: 'idle',
      actions: [go('Play a round', 'words'), ask('Hint for the word puzzle?')],
    }),
  },
  {
    id: 'driving',
    keys: ['drive', 'driving', 'drives', 'car', 'cars', 'road trip', 'why the drives'],
    reply: () => ({ lines: [`"${DRIVING.line} ${DRIVING.body}"`], mood: 'idle', actions: [go('Take the drive', 'driving'), ask('What car is that?')] }),
  },
  {
    id: 'car',
    keys: ['what car', 'which car', 'what car is that', 'buick', 'envista', 'the car', 'white car', 'vehicle'],
    reply: () => ({
      lines: [
        `That's a ${DRIVING.car} — drawn in code, not a photo. The wheels turn at the speed the road moves, so nothing slides.`,
      ],
      mood: 'happy',
      actions: [go('Take the drive', 'driving')],
    }),
  },
  {
    id: 'clover',
    keys: ['who are you', 'what are you', 'your name', 'clover', 'what breed', 'breed', 'pyrenees', 'bernese', 'are you a dog', 'are you a real dog', 'real dog'],
    reply: () => ({
      lines: [
        `I'm Clover — a digital character inspired by AJ's real dog, a ${CLOVER.breed} mix. ${CLOVER.colors}, very fluffy.`,
        "My personality is made up for the website, so don't take my opinions as his. He's the real one; I'm the tour guide.",
      ],
      mood: 'happy',
      actions: [go('Visit my chapter', 'clover'), ask('Do a trick!')],
    }),
  },
  {
    id: 'real-clover',
    keys: ['how old is clover', 'clover age', 'favorite food', 'favourite food', 'what does clover eat', 'clover birthday', 'where does clover live', 'is clover a boy', 'clovers'],
    reply: () => ({
      lines: ["I'm only a digital sketch of the real Clover — details about him stay with AJ. I can tell you he's orange and white and extremely fluffy."],
      mood: 'curious',
    }),
  },
  {
    id: 'bot',
    keys: ['are you ai', 'are you an ai', 'are you a bot', 'chatbot', 'are you chatgpt', 'chatgpt', 'gpt', 'language model', 'how do you work', 'are you human', 'are you real', 'is this ai'],
    reply: () => ({
      lines: [
        'No AI here. I am a set of hand-written answers running entirely in your browser.',
        'I match what you type against topics from this site — no language model, no server, and nothing you type leaves the page.',
      ],
      mood: 'idle',
      actions: [ask('What about privacy?')],
    }),
  },
  {
    id: 'privacy',
    keys: ['privacy', 'private', 'data', 'tracking', 'cookies', 'cookie', 'track', 'analytics', 'collect', 'what about privacy', 'gdpr'],
    reply: () => ({
      lines: [
        "This site doesn't use cookies, analytics or trackers, and the fonts are served from the site itself.",
        "Our chat isn't stored or sent anywhere — close the tab and it's gone. The only thing the site remembers is that you've already seen the intro, for this tab session.",
      ],
      mood: 'idle',
    }),
  },
  {
    id: 'contact',
    keys: ['contact', 'email', 'reach aj', 'hire', 'message aj', 'phone', 'social', 'socials', 'instagram', 'facebook', 'twitter', 'linkedin', 'discord', 'how can i contact aj', 'get in touch'],
    reply: () => ({
      lines: ["AJ hasn't published a contact channel on this site, so I don't have one to hand out. If you found the site through one of his profiles, that's the place to say hi."],
      mood: 'idle',
    }),
  },
  {
    id: 'personal',
    keys: ['where does aj live', 'where is aj', 'location', 'address', 'how old is aj', 'age', 'birthday', 'real name', 'last name', 'surname', 'full name', 'school', 'job', 'employer', 'where does aj work', 'salary'],
    reply: () => ({
      lines: ["That's something AJ keeps off the internet — and I'm a very loyal dog. Everything he wants to share is right here on the page."],
      mood: 'curious',
    }),
  },
  {
    id: 'expert',
    keys: ['expert', 'professional', 'certified', 'certification', 'certifications', 'experience', 'skill level', 'how good', 'qualified', 'is aj an expert'],
    reply: () => ({
      lines: ['Straight from AJ: "I\'m not an expert in any of it. I\'m just consistently interested enough to keep going."', 'He is learning — and he says he quite likes it that way.'],
      mood: 'idle',
    }),
  },
  {
    id: 'learning',
    keys: ['learning', 'learn', 'studying', 'study', 'what is aj learning', 'goals', 'future', 'plans'],
    reply: () => ({
      lines: [`AJ's learning map has ${TOPICS.length} nodes: ${TOPICS.map((t) => t.label).join(', ')}.`, `"${TECH_COPY.idle}"`],
      mood: 'idle',
      actions: [go('See the map', 'tech')],
    }),
  },
  {
    id: 'sound',
    keys: ['sound', 'music', 'audio', 'ambient', 'noise', 'mute', 'volume'],
    reply: () => ({
      lines: ['The Ambient button up top makes a soft tone that shifts with each chapter. It is generated live in your browser and never plays until you ask.'],
      mood: 'idle',
      actions: [{ label: 'Toggle ambient sound', kind: 'ambient' }],
    }),
  },
  {
    id: 'secrets',
    keys: ['secret', 'secrets', 'easter egg', 'easter eggs', 'hidden', 'konami', 'cheat', 'terminal'],
    reply: () => ({
      lines: ["Psst. Press / anywhere for a terminal. Click the AJ logo five times quickly. And old-school gamers might try a certain famous code on their keyboard…"],
      mood: 'curious',
      actions: [{ label: 'Open the terminal', kind: 'terminal' }],
    }),
  },
  {
    id: 'trick',
    keys: ['trick', 'do a trick', 'sit', 'paw', 'shake', 'roll over', 'fetch', 'treat', 'good boy', 'good dog', 'bark', 'woof', 'belly rub', 'pet', 'pat', 'play dead', 'speak', 'spin'],
    reply: () => ({ lines: [pick(TRICKS)], mood: 'happy', actions: [ask('Another trick!', 'Do a trick!')] }),
  },
  {
    id: 'joke',
    keys: ['joke', 'funny', 'make me laugh', 'pun', 'tell me a joke'],
    reply: () => ({ lines: [pick(JOKES)], mood: 'happy', actions: [ask('Another one', 'Tell me a joke')] }),
  },
  {
    id: 'fact',
    keys: ['fact', 'random fact', 'tell me a random fact', 'fun fact', 'surprise me', 'tell me something'],
    reply: () => ({ lines: [pick(FACTS)], mood: 'happy', actions: [ask('Another fact', 'Tell me a random fact')] }),
  },
  {
    id: 'how-are-you',
    keys: ['how are you', 'how is it going', 'whats up', 'how you doing', 'you ok'],
    reply: () => ({ lines: ['Tail is wagging, ears are up — excellent, thanks. How can I help?'], mood: 'happy' }),
  },
  {
    id: 'thanks',
    keys: ['thanks', 'thank you', 'thx', 'cheers', 'appreciate', 'thanks clover'],
    reply: () => ({ lines: ['Anytime! *tail wag*'], mood: 'happy' }),
  },
  {
    id: 'bye',
    keys: ['bye', 'goodbye', 'see you', 'see ya', 'cya', 'later', 'good night'],
    reply: () => ({ lines: ["Bye for now! I'll be right here in the corner if you need me."], mood: 'happy' }),
  },
];

function score(text: string, keys: string[]) {
  let s = 0;
  for (const k of keys) {
    if (!text.includes(` ${k} `)) continue;
    s += k.includes(' ') ? 3 + k.split(' ').length * 0.25 : 2;
  }
  return s;
}

const FALLBACKS = [
  "Hmm, my nose isn't picking that one up. I only know what's on this site.",
  "That one's outside my yard. I know about AJ's interests, his projects and the chapters on this page.",
  "I'm not sure about that — I'd rather say so than make something up.",
];

export function respond(input: string, active: SceneId): Reply {
  // The secret comes first, so no other topic can swallow it.
  if (isCrushQuestion(input)) return { lines: CRUSH_REPLY, mood: 'curious' };
  if (isCrushFollowUp(input)) return { lines: CRUSH_SEALED, mood: 'curious' };

  const text = normalize(input);

  // "Take me to …" — or just the name of a chapter on its own.
  const place = findPlace(text);
  const bare = text.trim().replace(/^the /, '');
  const onlyPlace = PLACES.some((p) => p.words.includes(bare));
  if (place && (MOVE.test(text) || onlyPlace)) {
    if (place === active) {
      return { lines: [`We're already in ${SCENE_MAP[place].label}! Have a sniff around.`], mood: 'happy' };
    }
    return { lines: [`On our way to ${SCENE_MAP[place].label}! *trots ahead*`], mood: 'happy', go: place };
  }

  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const s = score(text, intent.keys);
    if (s > bestScore) {
      bestScore = s;
      best = intent;
    }
  }
  if (best && bestScore >= 2) return best.reply(text);

  return {
    lines: [pick(FALLBACKS), 'Try one of these:'],
    mood: 'curious',
    actions: suggestionsFor(active).map((s) => ask(s)),
  };
}
