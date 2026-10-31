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
  /** Colour of the nebula light, top left. */
  ray: string;
  /** A second light, top right. Defaults to violet. */
  glow?: string;
}

export type ScapeKey = 'tree' | 'moon' | 'north' | 'mountain' | 'wild' | 'city' | 'nature' | 'circuit' | 'horizon';

export type SceneId =
  | 'home'
  | 'about'
  | 'tech'
  | 'omarchy'
  | 'automation'
  | 'projects'
  | 'games'
  | 'onepiece'
  | 'loki'
  | 'book'
  | 'strategy'
  | 'words'
  | 'driving'
  | 'clover'
  | 'outro'
  | 'finale';

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
 * One palette family, from the intro: near-black, white and cool silver, and
 * crimson. Black anchors every chapter; each leans towards the white side or
 * the red side — white light from the left (`ray`), red from the right
 * (`glow`) — and red is kept for accents that matter. The game worlds,
 * Clover's chapter, the night drive and the two shows keep environments
 * of their own (the book only warms the house palette slightly); warm orange still belongs to Clover, emerald to Loki.
 */
export const SCENES: Scene[] = [
  {
    id: 'home',
    scape: 'horizon',
    label: 'Home',
    index: '00',
    mood: 'Arrival',
    inRail: true,
    theme: { void: '#040405', a: '#0b0a0d', b: '#170d11', accent: '#ff4a57', tint: '#b4b7c0', ray: '#3a3e4a', glow: '#6e0d17' },
  },
  {
    id: 'about',
    scape: 'horizon',
    label: 'About',
    index: '01',
    mood: 'Curiosity',
    inRail: true,
    theme: { void: '#040405', a: '#0b0c0f', b: '#15171d', accent: '#e8ebf2', tint: '#a8acb7', ray: '#3d424f', glow: '#4a0c14' },
  },
  {
    id: 'tech',
    scape: 'circuit',
    label: 'Tech',
    index: '02',
    mood: 'Signal',
    inRail: true,
    theme: { void: '#050405', a: '#100a0c', b: '#1f0d12', accent: '#ff4a57', tint: '#c2adb0', ray: '#3a1016', glow: '#7a1420' },
  },
  {
    id: 'omarchy',
    scape: 'circuit',
    label: 'Setup',
    index: '02',
    mood: 'Setup',
    inRail: false,
    theme: { void: '#040405', a: '#0c0d10', b: '#181a20', accent: '#cfd5e2', tint: '#a3a8b4', ray: '#363b48', glow: '#4a0c14' },
  },
  {
    id: 'automation',
    scape: 'circuit',
    label: 'Lab',
    index: '03',
    mood: 'Experiment',
    inRail: true,
    theme: { void: '#060405', a: '#130a0d', b: '#250d14', accent: '#ff6670', tint: '#c4a8ad', ray: '#4a1019', glow: '#8a1626' },
  },
  {
    id: 'projects',
    scape: 'circuit',
    label: 'Builds',
    index: '04',
    mood: 'Craft',
    inRail: true,
    theme: { void: '#040405', a: '#0b0c0f', b: '#16181e', accent: '#f2f4f8', tint: '#a8acb7', ray: '#40454f', glow: '#55101a' },
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
    id: 'onepiece',
    scape: 'horizon',
    label: 'One Piece',
    index: '06',
    mood: 'Freedom',
    inRail: true,
    // Straw-hat red and sunlit gold, on the house black.
    theme: { void: '#070404', a: '#140808', b: '#2a0d0b', accent: '#ff5a4e', tint: '#d6b6a6', ray: '#5c2410', glow: '#8a1a12' },
  },
  {
    id: 'loki',
    scape: 'horizon',
    label: 'Loki',
    index: '07',
    mood: 'Purpose',
    inRail: true,
    // Emerald with a gold second light — local to this chapter only.
    theme: { void: '#030605', a: '#08110d', b: '#102219', accent: '#5fd49c', tint: '#a8c4b6', ray: '#183d2c', glow: '#6b5418' },
  },
  {
    id: 'book',
    scape: 'horizon',
    label: 'Book',
    index: '08',
    mood: 'Growth',
    inRail: true,
    // Quieter than the shows: the house black, a warm white light from the
    // left (the page), crimson kept for what you can press.
    theme: { void: '#050404', a: '#0d0b0a', b: '#1a1412', accent: '#ff5a62', tint: '#c3b8ad', ray: '#3e3832', glow: '#5c0e16' },
  },
  {
    id: 'strategy',
    scape: 'horizon',
    label: 'Chess',
    index: '09',
    mood: 'Patience',
    inRail: true,
    theme: { void: '#040405', a: '#0d0d10', b: '#1b1b21', accent: '#f4f6fb', tint: '#a8abb5', ray: '#3a3e4a', glow: '#7a1420' },
  },
  {
    id: 'words',
    scape: 'horizon',
    label: 'Words',
    index: '09',
    mood: 'Play',
    inRail: false,
    theme: { void: '#050405', a: '#110a0c', b: '#200d12', accent: '#ff5a66', tint: '#c2adb0', ray: '#3a1016', glow: '#6e0d17' },
  },
  {
    id: 'driving',
    scape: 'city',
    label: 'Drive',
    index: '10',
    mood: 'Freedom',
    inRail: true,
    theme: { void: '#030406', a: '#090b11', b: '#12151f', accent: '#e6ebf5', tint: '#a2a9b8', ray: '#2a3040', glow: '#5c0e16' },
  },
  {
    id: 'clover',
    scape: 'nature',
    label: 'Clover',
    index: '11',
    mood: 'Warmth',
    inRail: true,
    theme: { void: '#080503', a: '#1a0d07', b: '#341a0c', accent: '#ff9b52', tint: '#d4a582', ray: '#6d3513' },
  },
  {
    id: 'outro',
    scape: 'horizon',
    label: 'End',
    index: '12',
    mood: 'Thanks',
    inRail: false,
    theme: { void: '#040405', a: '#0c0b0e', b: '#19141a', accent: '#f2f4f8', tint: '#aeb1bb', ray: '#3a3e4a', glow: '#7a1420' },
  },
  {
    // The closing sequence: the world goes almost fully dark, with one red light left.
    id: 'finale',
    scape: 'horizon',
    label: 'Finale',
    index: '12',
    mood: 'Beginning',
    inRail: false,
    theme: { void: '#000000', a: '#040304', b: '#0c0507', accent: '#ff4a57', tint: '#b4b7c0', ray: '#1b1d24', glow: '#5c0a12' },
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
  /** Extra words Clover should recognise this game by. */
  aliases?: string[];
  year: string;
  genre: string;
  /** Headline shown when this world is active. */
  line: string;
  /** Personal note — why I like it. */
  note: string;
  /** Three short atmosphere descriptors. */
  atmosphere: [string, string, string];
  theme: Theme;
  /** Which procedural artwork the backdrop composes (and the stage falls back to). */
  art: 'tree' | 'moon' | 'north' | 'mountain' | 'wild';
  /**
   * Where the artwork's subject sits (CSS object-position), so narrow
   * screens crop around it. The artwork itself comes from the generated
   * manifest in data/gameArt.ts — see scripts/game-art.py.
   */
  focus: string;
}

export const GAME_WORLDS: GameWorld[] = [
  {
    id: 'monster-hunter-world',
    title: 'Monster Hunter: World',
    short: 'Monster Hunter',
    year: '2018',
    genre: 'Action RPG',
    line: 'A world that carries on living whether you are watching or not.',
    note: 'What I love most is the world itself. Enormous monsters, small wildlife, whole ecosystems — creatures at every scale, living alongside each other and reacting to their surroundings. It feels alive because something is always going on, even when it has nothing to do with you.',
    atmosphere: ['Ancient canopy', 'Drifting spores', 'Living ecosystem'],
    theme: { void: '#030805', a: '#0a1a10', b: '#16301f', accent: '#a9e27c', tint: '#b4c8a0', ray: '#2c5a31' },
    art: 'wild',
    focus: '50% 66%',
  },
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
    focus: '50% 42%',
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
    focus: '50% 30%',
  },
  {
    id: 'god-of-war',
    title: 'God of War Ragnarök',
    short: 'God of War',
    aliases: ['ragnarok', 'gow'],
    year: '2022',
    genre: 'Story-driven',
    line: 'Proof a story can carry as much weight as the combat.',
    note: 'A father and a son walking through a cold, quiet world. The fighting is heavy and satisfying, but it is the silences in between that stayed with me long after the credits.',
    atmosphere: ['Cold mist', 'Falling snow', 'Old runes'],
    theme: { void: '#04070c', a: '#0c1a2b', b: '#183044', accent: '#8ec6f0', tint: '#a3bdd2', ray: '#1e5077' },
    art: 'north',
    focus: '50% 38%',
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
    focus: '74% 30%',
  },
];

export const GAME_MAP = Object.fromEntries(GAME_WORLDS.map((g) => [g.id, g])) as Record<string, GameWorld>;
