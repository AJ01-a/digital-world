/**
 * The theme system.
 *
 *   Active section → Theme controller (state/experience) → CSS custom
 *   properties on :root → every background layer, accent and glow.
 *
 * Adding an interest later means adding one entry here plus one section
 * component. Nothing else needs to know about it.
 */

export type ParticleMode =
  | 'motes'
  | 'embers'
  | 'leaves'
  | 'snow'
  | 'mist'
  | 'chess'
  | 'letters'
  | 'road'
  | 'pollen'
  | 'grid'
  | 'neural';

export interface Theme {
  /** Deepest background tone. */
  void: string;
  /** Mid atmosphere. */
  a: string;
  /** Lit atmosphere, usually where the light source sits. */
  b: string;
  /** Interactive accent — borders, highlights, focus. */
  accent: string;
  /** Muted text / label tone. */
  tint: string;
  /** Colour of the volumetric light rays. */
  ray: string;
}

export type SceneId =
  | 'home'
  | 'about'
  | 'games'
  | 'strategy'
  | 'words'
  | 'tech'
  | 'omarchy'
  | 'automation'
  | 'driving'
  | 'dog'
  | 'outro';

export interface Scene {
  id: SceneId;
  /** Rail label. */
  label: string;
  /** Two digit index shown in the rail and section header. */
  index: string;
  /** One word mood, used in the section header. */
  mood: string;
  theme: Theme;
  particles: ParticleMode;
  /** Scenes hidden from the rail still own a full environment. */
  inRail: boolean;
}

export const SCENES: Scene[] = [
  {
    id: 'home',
    label: 'Home',
    index: '00',
    mood: 'Welcome',
    inRail: true,
    particles: 'motes',
    theme: { void: '#05060b', a: '#0a1020', b: '#161d3a', accent: '#9fb4ff', tint: '#8fa1d0', ray: '#2b3a78' },
  },
  {
    id: 'about',
    label: 'About',
    index: '01',
    mood: 'Curiosity',
    inRail: true,
    particles: 'motes',
    theme: { void: '#06070d', a: '#0d1224', b: '#1b2140', accent: '#b9c6ff', tint: '#94a2ce', ray: '#33407f' },
  },
  {
    id: 'games',
    label: 'Games',
    index: '02',
    mood: 'Wonder',
    inRail: true,
    particles: 'embers',
    theme: { void: '#080503', a: '#150a04', b: '#291306', accent: '#e9b15c', tint: '#c99257', ray: '#5a2b0e' },
  },
  {
    id: 'strategy',
    label: 'Strategy',
    index: '03',
    mood: 'Patience',
    inRail: true,
    particles: 'chess',
    theme: { void: '#07070a', a: '#12131a', b: '#23252f', accent: '#dbe0ea', tint: '#a3a9b8', ray: '#3a3e4d' },
  },
  {
    id: 'words',
    label: 'Words',
    index: '03',
    mood: 'Play',
    inRail: false,
    particles: 'letters',
    theme: { void: '#05080a', a: '#0c1613', b: '#17281f', accent: '#7fd1a6', tint: '#93b8a7', ray: '#215040' },
  },
  {
    id: 'tech',
    label: 'Tech',
    index: '04',
    mood: 'Craft',
    inRail: true,
    particles: 'grid',
    theme: { void: '#04070a', a: '#08141f', b: '#0f2634', accent: '#58c8e6', tint: '#8fb2c2', ray: '#14506b' },
  },
  {
    id: 'omarchy',
    label: 'Omarchy',
    index: '04',
    mood: 'Setup',
    inRail: false,
    particles: 'grid',
    theme: { void: '#05060c', a: '#0b1226', b: '#141f3f', accent: '#79a8ff', tint: '#96a8cc', ray: '#28407e' },
  },
  {
    id: 'automation',
    label: 'Automation',
    index: '05',
    mood: 'Experiment',
    inRail: true,
    particles: 'neural',
    theme: { void: '#060510', a: '#130c26', b: '#221540', accent: '#a98cff', tint: '#b0a3dd', ray: '#442a86' },
  },
  {
    id: 'driving',
    label: 'Driving',
    index: '06',
    mood: 'Freedom',
    inRail: true,
    particles: 'road',
    theme: { void: '#04060c', a: '#0a1026', b: '#1d0e35', accent: '#6ae0ff', tint: '#9aa8d6', ray: '#2b1d6b' },
  },
  {
    id: 'dog',
    label: 'Walks',
    index: '07',
    mood: 'Warmth',
    inRail: true,
    particles: 'pollen',
    theme: { void: '#090604', a: '#1d0e08', b: '#3a1d0f', accent: '#f2a65a', tint: '#cfa17f', ray: '#6d3813' },
  },
  {
    id: 'outro',
    label: 'End',
    index: '08',
    mood: 'Thanks',
    inRail: false,
    particles: 'motes',
    theme: { void: '#06060a', a: '#121220', b: '#1f1d2e', accent: '#e7e2d6', tint: '#b3aea2', ray: '#463f57' },
  },
];

export const SCENE_MAP = Object.fromEntries(SCENES.map((s) => [s.id, s])) as Record<SceneId, Scene>;
export const RAIL_SCENES = SCENES.filter((s) => s.inRail);

/**
 * Game worlds temporarily take over the whole environment while one is
 * selected in the Games section.
 */
export interface GameWorld {
  id: string;
  title: string;
  short: string;
  year: string;
  genre: string;
  /** Headline shown when this world is active. */
  line: string;
  /** Personal note — why I like it. */
  note: string;
  /** Three short atmosphere descriptors. */
  atmosphere: [string, string, string];
  theme: Theme;
  particles: ParticleMode;
  /** Which procedural artwork the card and backdrop compose. */
  art: 'tree' | 'moon' | 'north' | 'mountain';
  /**
   * Optional custom backdrop image. Drop a file in /public/worlds and set
   * the path here (e.g. './worlds/elden.jpg') to use your own artwork —
   * everything else keeps working unchanged.
   */
  image?: string;
}

export const GAME_WORLDS: GameWorld[] = [
  {
    id: 'elden-ring',
    title: 'Elden Ring',
    short: 'Elden Ring',
    year: '2022',
    genre: 'Open world',
    line: 'A world that never once tells you where to go.',
    note: 'What hooked me was the silence. No arrows, no checklist — just a horizon and the feeling that something is out there. Every discovery feels like it belongs to you, because nobody handed it to you.',
    atmosphere: ['Golden light', 'Drifting embers', 'Endless horizon'],
    theme: { void: '#080602', a: '#170e05', b: '#301c08', accent: '#f0c063', tint: '#cf9d55', ray: '#6b420f' },
    particles: 'embers',
    art: 'tree',
  },
  {
    id: 'sekiro',
    title: 'Sekiro: Shadows Die Twice',
    short: 'Sekiro',
    year: '2019',
    genre: 'Action',
    line: 'The game that taught me to stop panicking.',
    note: 'It punishes hesitation more than mistakes. Learning a boss here is less grinding and more learning a rhythm — and the moment it finally clicks is one of the best feelings in games.',
    atmosphere: ['Moonlight', 'Falling leaves', 'Held breath'],
    theme: { void: '#080506', a: '#170b0b', b: '#2a1313', accent: '#e8926a', tint: '#bd8c7f', ray: '#63251b' },
    particles: 'leaves',
    art: 'moon',
  },
  {
    id: 'god-of-war',
    title: 'God of War',
    short: 'God of War',
    year: '2018',
    genre: 'Story-driven',
    line: 'Proof a story can carry as much weight as the combat.',
    note: 'A father and a son walking through a cold, quiet world. The fighting is heavy and satisfying, but it is the silences in between that stayed with me long after the credits.',
    atmosphere: ['Cold mist', 'Falling snow', 'Old runes'],
    theme: { void: '#04070c', a: '#0c1a2b', b: '#183044', accent: '#8ec6f0', tint: '#a3bdd2', ray: '#1e5077' },
    particles: 'snow',
    art: 'north',
  },
  {
    id: 'black-myth-wukong',
    title: 'Black Myth: Wukong',
    short: 'Wukong',
    year: '2024',
    genre: 'Action',
    line: 'Mythology turned into somewhere you can actually walk.',
    note: 'Mist, mountains, temples, and a legend I only half knew before playing. One of the few games where I stopped mid-fight just to look at where I was standing.',
    atmosphere: ['Mountain mist', 'Temple gold', 'Old legend'],
    theme: { void: '#060704', a: '#101a0c', b: '#222b12', accent: '#d9c05e', tint: '#aeb277', ray: '#474615' },
    particles: 'mist',
    art: 'mountain',
  },
];

export const GAME_MAP = Object.fromEntries(GAME_WORLDS.map((g) => [g.id, g])) as Record<string, GameWorld>;
