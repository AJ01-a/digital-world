/**
 * The theme system.
 *
 *   Active section → Theme controller (state/experience) → CSS custom
 *   properties on :root → every background layer, accent and glow.
 *
 * Adding an interest later means adding one entry here plus one section
 * component. Nothing else needs to know about it.
 */

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
  /** Colour of the nebula light. */
  ray: string;
}

export type ScapeKey = 'tree' | 'moon' | 'north' | 'mountain' | 'city' | 'nature' | 'circuit' | 'horizon';

export type SceneId =
  | 'home'
  | 'about'
  | 'tech'
  | 'omarchy'
  | 'automation'
  | 'projects'
  | 'games'
  | 'strategy'
  | 'words'
  | 'driving'
  | 'clover'
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
  /** Which procedural backdrop sits behind the chapter. */
  scape: ScapeKey;
  /** Scenes hidden from the rail still own a full environment. */
  inRail: boolean;
}

/*
 * One palette family — deep space, icy blue, electric cyan, violet — with
 * each chapter leaning on a different part of it. Warm orange is held back
 * for Clover and the game worlds, so it still means something when it shows.
 */
export const SCENES: Scene[] = [
  {
    id: 'home',
    scape: 'horizon',
    label: 'Home',
    index: '00',
    mood: 'Arrival',
    inRail: true,
    theme: { void: '#03040a', a: '#071024', b: '#0d1c40', accent: '#7fdcff', tint: '#8ea6d6', ray: '#1d4a8f' },
  },
  {
    id: 'about',
    scape: 'horizon',
    label: 'About',
    index: '01',
    mood: 'Curiosity',
    inRail: true,
    theme: { void: '#04050c', a: '#0a1228', b: '#16204a', accent: '#b8d0ff', tint: '#98a8d4', ray: '#2c3f8f' },
  },
  {
    id: 'tech',
    scape: 'circuit',
    label: 'Tech',
    index: '02',
    mood: 'Signal',
    inRail: true,
    theme: { void: '#02060a', a: '#06141f', b: '#0b2836', accent: '#5ce1ff', tint: '#8cb6c8', ray: '#0f5a78' },
  },
  {
    id: 'omarchy',
    scape: 'circuit',
    label: 'Setup',
    index: '02',
    mood: 'Setup',
    inRail: false,
    theme: { void: '#03050c', a: '#0a1228', b: '#132045', accent: '#7aa8ff', tint: '#96a8cc', ray: '#25418a' },
  },
  {
    id: 'automation',
    scape: 'circuit',
    label: 'Lab',
    index: '03',
    mood: 'Experiment',
    inRail: true,
    theme: { void: '#05040e', a: '#120c28', b: '#21164a', accent: '#a48dff', tint: '#ada2dc', ray: '#46309a' },
  },
  {
    id: 'projects',
    scape: 'circuit',
    label: 'Builds',
    index: '04',
    mood: 'Craft',
    inRail: true,
    theme: { void: '#03060b', a: '#081625', b: '#0f2742', accent: '#8be9ff', tint: '#94b4cc', ray: '#1b4d80' },
  },
  {
    id: 'games',
    scape: 'tree',
    label: 'Games',
    index: '05',
    mood: 'Wonder',
    inRail: true,
    theme: { void: '#080503', a: '#150a04', b: '#291306', accent: '#f0b45c', tint: '#c99257', ray: '#5a2b0e' },
  },
  {
    id: 'strategy',
    scape: 'horizon',
    label: 'Chess',
    index: '06',
    mood: 'Patience',
    inRail: true,
    theme: { void: '#05060a', a: '#10131c', b: '#1f2433', accent: '#dfe6f5', tint: '#a3abbd', ray: '#3a4260' },
  },
  {
    id: 'words',
    scape: 'horizon',
    label: 'Words',
    index: '06',
    mood: 'Play',
    inRail: false,
    theme: { void: '#02070a', a: '#061719', b: '#0c2a2c', accent: '#6fe3d0', tint: '#8fbcb5', ray: '#145a58' },
  },
  {
    id: 'driving',
    scape: 'city',
    label: 'Drive',
    index: '07',
    mood: 'Freedom',
    inRail: true,
    theme: { void: '#03050c', a: '#0a1026', b: '#1d0e35', accent: '#6ae0ff', tint: '#9aa8d6', ray: '#2b1d6b' },
  },
  {
    id: 'clover',
    scape: 'nature',
    label: 'Clover',
    index: '08',
    mood: 'Warmth',
    inRail: true,
    theme: { void: '#080503', a: '#1a0d07', b: '#341a0c', accent: '#ff9b52', tint: '#d4a582', ray: '#6d3513' },
  },
  {
    id: 'outro',
    scape: 'horizon',
    label: 'End',
    index: '09',
    mood: 'Thanks',
    inRail: false,
    theme: { void: '#04040b', a: '#0e0f24', b: '#1b1a3a', accent: '#d9d2ff', tint: '#aaa6c8', ray: '#3d3480' },
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
    art: 'mountain',
  },
];

export const GAME_MAP = Object.fromEntries(GAME_WORLDS.map((g) => [g.id, g])) as Record<string, GameWorld>;
