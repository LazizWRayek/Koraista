/** Shared theme constants for Koraista */

export const COLORS = {
  navy: 0x16213e,
  darkNavy: 0x0f1b30,
  crimson: 0xe94560,
  cyan: 0x53d8fb,
  gold: 0xf5c542,
  green: 0x00cc66,
  white: 0xffffff,
  textMuted: 0xa0a0c0,
  textDark: 0x555580,
  overlay: 0x000000,
  grassGreen: 0x2d7a3a,
  grassDark: 0x1e5c2b,
} as const;

export const HEX = {
  navy: '#16213e',
  darkNavy: '#0f1b30',
  crimson: '#e94560',
  cyan: '#53d8fb',
  gold: '#f5c542',
  green: '#00cc66',
  white: '#ffffff',
  textMuted: '#a0a0c0',
  textDark: '#555580',
  grassGreen: '#2d7a3a',
} as const;

export const FONT = {
  title: "'Cairo', 'Arial Black', sans-serif",
  body: "'Tajawal', 'Arial', sans-serif",
  mono: "'Courier New', monospace",
} as const;

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 854;

export const TEAM_COLORS = [
  { name: 'Red', hex: '#e94560', value: 0xe94560 },
  { name: 'Blue', hex: '#53d8fb', value: 0x53d8fb },
  { name: 'Gold', hex: '#f5c542', value: 0xf5c542 },
  { name: 'Green', hex: '#00cc66', value: 0x00cc66 },
];
