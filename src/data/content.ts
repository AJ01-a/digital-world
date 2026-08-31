/** All of the writing lives here so the copy is easy to edit. */

export const IDENTITY = {
  full: 'AJ Almachar',
  short: 'AJ',
  greeting: 'Welcome to my little corner of the internet.',
  keywords: ['Technology', 'Games', 'Curiosity', 'Exploration'],
  enter: 'Enter my world',
};

export const ABOUT = {
  head: "I'm AJ.",
  lede: 'Someone who enjoys exploring technology, getting lost in good games, challenging myself with strategy, and finding interesting things to build.',
  body: [
    "Most of what I know came from curiosity rather than a plan. I'll install something just to see how it works, take it apart, break it, and figure out how to put it back together. That habit turned into an actual interest in computers, systems and building things that are useful.",
    "Outside of that I'm usually playing something with a good story, thinking a few moves too long over a chess board, driving with no particular destination, or out walking my dog.",
  ],
  facets: [
    { k: 'Technology', v: 'Computers, Linux, networking, and the parts underneath.' },
    { k: 'Experimenting', v: 'New tools, new environments, new setups — often at 1am.' },
    { k: 'Games', v: 'Story-driven worlds worth getting lost in.' },
    { k: 'Strategy', v: 'Chess, patterns, and thinking a few moves ahead.' },
    { k: 'Learning', v: 'Still very much in progress, and enjoying it.' },
    { k: 'Outdoors', v: 'Long drives, longer walks, better headspace.' },
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
  { id: 'new', label: 'New tech', blurb: 'A rotating list. Something new gets installed, tested, and either kept or wiped by the weekend.', x: 0.86, y: 0.34, links: ['ai', 'sec'] },
];

export const TECH_COPY = {
  lede: "I'm curious about how things work.",
  body: "Computers were the first thing that really held my attention — not just using them, but understanding what is happening underneath, and taking them apart to find out. Networking, Linux, security, automation, AI. I'm not an expert in any of it. I'm just consistently interested enough to keep going.",
  hint: 'Hover a node to see what I mean.',
  hintTouch: 'Tap a node to see what I mean.',
};

export const OMARCHY = {
  line: 'One of my machines runs Omarchy.',
  body: "I like machines that feel like mine. Omarchy gave me a reason to learn a tiling workflow properly, and rebuilding my environment from the ground up taught me more than any tutorial did. Different devices, different setups — I'd rather experiment than settle on one.",
  boot: [
    '> booting environment',
    '> mounting /home',
    '> starting compositor',
    '> loading keybinds        [ok]',
    '> restoring workspaces    [1] [2] [3]',
    '> dotfiles                synced',
    '> tmux                    session: main',
    '',
    '> ready in 0.9s',
  ],
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
  disclaimer: 'Simulated for the page — nothing is executed here.',
};

export const PIPELINE = [
  { id: 'idea', label: 'Idea', detail: 'Something I want to exist. Usually at a bad hour.' },
  { id: 'claude', label: 'Claude Code', detail: 'Describe it in plain language, argue about the approach.' },
  { id: 'wsl', label: 'WSL', detail: 'My Linux environment on Windows, where it actually runs.' },
  { id: 'code', label: 'Code', detail: 'Files, tests, commits — reviewed instead of blindly trusted.' },
  { id: 'app', label: 'Application', detail: 'A thing that works. Then the next idea.' },
];

export const AUTOMATION_STEPS: { cmd: string; out: string[]; ms: number }[] = [
  { cmd: 'claude "build me a small dashboard for my scripts"', out: ['reading project context…', 'workspace: ~/projects/dash'], ms: 900 },
  { cmd: 'analyze requirements', out: ['4 goals · 2 constraints · 1 unknown'], ms: 700 },
  { cmd: 'design architecture', out: ['modules scaffolded', 'interfaces drafted'], ms: 780 },
  { cmd: 'build application', out: ['compiled in 1.9s · 0 errors'], ms: 850 },
  { cmd: 'run tests', out: ['18 passed · 0 failed'], ms: 720 },
  { cmd: 'review diff', out: ['suggestions applied', 'notes kept for later'], ms: 700 },
];

export const DRIVING = {
  line: 'Sometimes I just like getting in the car and going for a drive.',
  body: 'No plan, no destination worth mentioning. Music on, roads empty, city lights going past. It is the one place where thinking about nothing in particular actually works.',
  cues: ['No destination', 'Good playlist', 'Empty roads'],
};

export const DOG = {
  line: 'And sometimes, the best way to disconnect is a walk with my dog.',
  body: 'No screens, no notifications, no terminal. Just grass, late sun and someone who is extremely pleased about a completely ordinary walk. It is a good reset, and honestly the part of the day I look forward to most.',
  cues: ['Golden hour', 'Long grass', 'Zero notifications'],
};

export const FACTS = [
  'AJ enjoys story-driven games more than competitive ones.',
  'AJ plays chess — badly enough to still find it interesting.',
  'AJ runs Omarchy on one of his machines.',
  'AJ has broken more Linux installs than he can count.',
  'AJ integrates Claude Code into his WSL terminal.',
  'AJ likes long drives with no destination.',
  'AJ walks his dog to reset his head.',
  'AJ plays a word puzzle most mornings.',
  'AJ would rather understand a tool than just use it.',
  'AJ once "quickly reinstalled" an OS at 2am. It was not quick.',
  'AJ thinks Sekiro is the best combat system ever made.',
  'AJ is still learning, and quite likes it that way.',
];

export const OUTRO = {
  head: "So… that's me.",
  body: "Games, chess, technology, automation, long drives and walks with my dog. I'm always experimenting with something.",
  quote: "I don't just want to use technology — I want to understand it, experiment with it, and build with it.",
  thanks: 'Thanks for stopping by.',
};

export const TERMINAL_HELP: [string, string][] = [
  ['help', 'list available commands'],
  ['whoami', 'who is running this'],
  ['about', 'the short version'],
  ['games', 'currently installed'],
  ['tech', 'the setup'],
  ['skills', 'what is being learned'],
  ['dog', 'important information'],
  ['goto <id>', 'travel: home about games strategy tech automation driving dog'],
  ['clear', 'wipe the screen'],
  ['exit', 'close this window'],
];
