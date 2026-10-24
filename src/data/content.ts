/**
 * All of the writing lives here so the copy is easy to edit.
 *
 * Privacy rule for this file: the public identity is "AJ" — no surname, no
 * location, no contact details, nothing that maps out a routine. Clover's
 * answers are built from this file too, so anything added here becomes
 * something he can say.
 */

export const IDENTITY = {
  name: 'AJ',
  site: 'Digital World',
  greeting: 'Welcome to my little corner of the internet.',
  intro:
    'Exploring how technology works underneath — networks, security, systems and AI — and building things that go a little beyond the ordinary.',
  keywords: ['Technology', 'Networks', 'Security', 'AI'],
  enter: 'Enter my world',
};

export const ABOUT = {
  head: "I'm AJ.",
  lede: 'Someone who enjoys exploring technology, getting lost in good games, challenging myself with strategy, and finding interesting things to build.',
  body: [
    "Most of what I know came from curiosity rather than a plan. I'll install something just to see how it works, take it apart, break it, and figure out how to put it back together. That habit turned into an actual interest in computers, systems and building things that are useful.",
    "Outside of that I'm usually playing something with a good story, thinking a few moves too long over a chess board, driving with no particular destination, or out walking my dog, Clover.",
  ],
  facets: [
    { k: 'Technology', v: 'Computers, Linux, networking, and the parts underneath.' },
    { k: 'Security', v: 'How systems get hardened, logged and watched.' },
    { k: 'AI', v: 'What it can actually do next to me in a terminal.' },
    { k: 'Building', v: 'Useful things — this site included.' },
    { k: 'Strategy', v: 'Chess, patterns, and thinking a few moves ahead.' },
    { k: 'Learning', v: 'Still very much in progress, and enjoying it.' },
  ],
};

export interface Topic {
  id: string;
  label: string;
  blurb: string;
  x: number;
  y: number;
  links: string[];
}

/** The interactive network shown in the Technology section. */
export const TOPICS: Topic[] = [
  { id: 'linux', label: 'Linux', blurb: 'Daily driving it, breaking it, fixing it. Most of what I know came from the fixing part.', x: 0.16, y: 0.32, links: ['sysadmin', 'automation', 'net'] },
  { id: 'net', label: 'Networking', blurb: 'Subnets, routing, DNS — the part of computing that finally made the internet feel physical.', x: 0.37, y: 0.13, links: ['sec', 'sysadmin'] },
  { id: 'sec', label: 'Cybersecurity', blurb: 'Mostly from the defensive side so far: how systems get hardened, logged and watched.', x: 0.65, y: 0.17, links: ['net', 'sysadmin'] },
  { id: 'sysadmin', label: 'Systems', blurb: 'Users, services, permissions, backups. Unglamorous, and quietly the most useful thing I have learned.', x: 0.5, y: 0.45, links: ['linux', 'automation', 'sec', 'net'] },
  { id: 'automation', label: 'Automation', blurb: 'If I have done it by hand three times, I start working out how to never do it by hand again.', x: 0.27, y: 0.68, links: ['code', 'ai', 'linux'] },
  { id: 'code', label: 'Programming', blurb: 'Still building the fundamentals. I learn fastest when there is an actual thing I want to exist.', x: 0.55, y: 0.79, links: ['automation', 'ai'] },
  { id: 'ai', label: 'AI', blurb: 'Less interested in the hype, more in what it can actually do sitting next to me in a terminal.', x: 0.79, y: 0.6, links: ['automation', 'code', 'new'] },
  { id: 'new', label: 'New tech', blurb: 'A rotating list. Something new gets installed, tested, and either kept or wiped.', x: 0.86, y: 0.34, links: ['ai', 'sec'] },
];

export const TECH_COPY = {
  lede: "I'm curious about how things work.",
  body: "Computers were the first thing that really held my attention — not just using them, but understanding what is happening underneath, and taking them apart to find out. Networking, Linux, security, automation, AI. I'm not an expert in any of it. I'm just consistently interested enough to keep going.",
  hint: 'Hover or focus a node to see what I mean.',
  hintTouch: 'Tap a node to see what I mean.',
  idle: 'Eight things I am somewhere along the road with. None of them finished.',
};

export const OMARCHY = {
  line: 'One of my machines runs Omarchy.',
  body: "I like machines that feel like mine. Omarchy gave me a reason to learn a tiling workflow properly, and rebuilding my environment from the ground up taught me more than any tutorial did. Different devices, different setups — I'd rather experiment than settle on one.",
  specs: [
    ['shell', 'zsh + starship'],
    ['editor', 'neovim'],
    ['multiplex', 'tmux'],
    ['workflow', 'tiling, keyboard-first'],
    ['also runs', 'WSL on the daily driver'],
  ] as [string, string][],
};

export const AUTOMATION_COPY = {
  lede: 'Ideas, turned into things that actually run.',
  body: "I've been experimenting with automating my own development environment. By integrating Claude Code into my WSL terminal, I can turn an idea into something that actually runs — scripts, tools, small applications — far faster than I could alone. It hasn't replaced learning; it has made the loop between 'what if' and 'it works' short enough that I try more things.",
  disclaimer: 'A scripted illustration — nothing is executed, and the output is made up.',
};

export const PIPELINE = [
  { id: 'idea', label: 'Idea', detail: 'Something I want to exist.' },
  { id: 'claude', label: 'Claude Code', detail: 'Describe it in plain language, argue about the approach.' },
  { id: 'wsl', label: 'WSL', detail: 'My Linux environment on Windows, where it actually runs.' },
  { id: 'code', label: 'Code', detail: 'Files, tests, commits — reviewed instead of blindly trusted.' },
  { id: 'app', label: 'Application', detail: 'A thing that works. Then the next idea.' },
];

export const AUTOMATION_STEPS: { cmd: string; out: string[]; ms: number }[] = [
  { cmd: 'claude "build me a small dashboard for my scripts"', out: ['reading project context…'], ms: 900 },
  { cmd: 'analyze requirements', out: ['goals, constraints, open questions'], ms: 700 },
  { cmd: 'design architecture', out: ['modules scaffolded', 'interfaces drafted'], ms: 780 },
  { cmd: 'build application', out: ['build finished'], ms: 850 },
  { cmd: 'run tests', out: ['tests run — failures get fixed, not hidden'], ms: 720 },
  { cmd: 'review diff', out: ['read every change before keeping it'], ms: 700 },
];

/**
 * Things that were actually built for this site — every one of them is
 * running on the page, so a visitor can go and check.
 */
export interface Build {
  id: string;
  name: string;
  kind: string;
  summary: string;
  how: string[];
  stack: string[];
  /** Where the visitor can see it working. */
  try: { label: string; target: 'clover' | 'strategy' | 'words' | 'ambient' | 'home' | 'tech' };
}

export const BUILDS: Build[] = [
  {
    id: 'site',
    name: 'This website',
    kind: 'Personal site',
    summary: 'One page, twelve chapters, and an environment that re-tints itself as you move through it.',
    how: [
      'Each chapter owns a palette; the background cross-fades between them on the compositor.',
      'Animations stick to transform and opacity, and pause when they are off screen.',
      'Built and deployed to GitHub Pages by a GitHub Actions workflow on every push.',
    ],
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    try: { label: 'Back to the top', target: 'home' },
  },
  {
    id: 'clover',
    name: 'Clover',
    kind: 'Site guide',
    summary: 'A digital companion who knows his way around the site and answers questions about it.',
    how: [
      'Runs entirely in the browser — no AI model, no server, no network requests.',
      'Matches what you type against a hand-written knowledge base taken from this page.',
      'Knows which chapter you are reading and suggests things to ask about it.',
    ],
    stack: ['TypeScript', 'SVG', 'Intent matching'],
    try: { label: 'Talk to Clover', target: 'clover' },
  },
  {
    id: 'chess',
    name: 'Chess puzzles',
    kind: 'Mini game',
    summary: 'One-move puzzles on a board that knows how its pieces move.',
    how: [
      'A small FEN parser turns a position string into a board.',
      'Pseudo-legal move generation shows where a selected piece can go.',
      'Fully keyboard playable — every square is a button.',
    ],
    stack: ['TypeScript', 'FEN', 'Move generation'],
    try: { label: 'Solve one', target: 'strategy' },
  },
  {
    id: 'words',
    name: 'Word puzzle',
    kind: 'Mini game',
    summary: 'Five letters, six tries, a word list with some meaning behind it.',
    how: [
      'Two-pass scoring, so repeated letters are marked correctly.',
      'Works from a physical keyboard or the on-screen one.',
    ],
    stack: ['TypeScript', 'React'],
    try: { label: 'Play a round', target: 'words' },
  },
  {
    id: 'sound',
    name: 'Ambient sound',
    kind: 'Audio',
    summary: 'A soft tone bed that shifts with each chapter — generated live, never autoplayed.',
    how: [
      'Oscillators and filtered noise from the Web Audio API — there are no audio files.',
      'Only starts after you press the Ambient button.',
    ],
    stack: ['Web Audio API'],
    try: { label: 'Turn it on', target: 'ambient' },
  },
  {
    id: 'art',
    name: 'Procedural worlds',
    kind: 'Artwork',
    summary: 'Every backdrop — trees, mountains, a whole Monster Hunter ecosystem, the car on the night drive — is drawn from code.',
    how: [
      'Seeded random numbers, so the same shapes come back every visit.',
      'The only pictures on the site are AJ\'s own portrait artwork in the intro and the game artwork.',
    ],
    stack: ['SVG', 'Canvas'],
    try: { label: 'See the network', target: 'tech' },
  },
];

export const DRIVING = {
  line: 'Sometimes I just like getting in the car and going for a drive.',
  body: 'No plan, no destination worth mentioning. Music on, roads empty, city lights going past. It is the one place where thinking about nothing in particular actually works.',
  cues: ['No destination', 'Good playlist', 'Empty roads'],
  car: 'white 2025 Buick Envista',
};

export const CLOVER = {
  line: 'And sometimes, the best way to disconnect is a walk with my dog.',
  body: 'No screens, no notifications, no terminal. Just grass, open air and someone who is extremely pleased about a completely ordinary walk. It is a good reset.',
  breed: 'Great Pyrenees × Bernese Mountain Dog',
  colors: 'Orange and white',
  note: 'The Clover on this site is a digital character inspired by him — the personality is made up for the website.',
  cues: ['Fresh air', 'Long grass', 'Zero notifications'],
};

export const FACTS = [
  'AJ enjoys story-driven games more than competitive ones.',
  'AJ plays chess — badly enough to still find it interesting.',
  'AJ runs Omarchy on one of his machines.',
  'AJ has broken more Linux installs than he can count.',
  'AJ integrates Claude Code into his WSL terminal.',
  'AJ likes long drives with no destination.',
  "The guide on this site is based on AJ's dog, Clover.",
  'AJ enjoys a good word puzzle.',
  'AJ would rather understand a tool than just use it.',
  'AJ once "quickly reinstalled" an OS. It was not quick.',
  'AJ thinks Sekiro is the best combat system ever made.',
  'AJ is still learning, and quite likes it that way.',
];

export const OUTRO = {
  head: "So… that's me.",
  body: "Technology, networks, AI, games, chess, long drives and walks with Clover. I'm always experimenting with something.",
  quote: "I don't just want to use technology — I want to understand it, experiment with it, and build with it.",
  thanks: 'Thanks for stopping by.',
};

export const TERMINAL_HELP: [string, string][] = [
  ['help', 'list available commands'],
  ['whoami', 'who is running this'],
  ['about', 'the short version'],
  ['games', 'currently installed'],
  ['tech', 'the setup'],
  ['learning', 'what is being learned'],
  ['clover', 'call the guide'],
  ['goto <id>', 'travel: home about tech automation projects games strategy driving clover'],
  ['clear', 'wipe the screen'],
  ['exit', 'close this window'],
];
