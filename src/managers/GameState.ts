import type { CardType, Edition } from '../data/types';

export type PlayMode = 'solo' | 'teams';
export type WinCondition = 'cards' | 'timed' | 'points';
export type QuestionPool = 'all' | 'elite';

export interface PlayerStats {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  categoriesWon: Partial<Record<CardType, number>>;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  stats: PlayerStats;
  teamId?: string;
  isReferee?: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  playerIds: string[];
}

export interface GameConfig {
  playMode: PlayMode;
  hasReferee: boolean;
  questionPool: QuestionPool;
  winCondition: WinCondition;
  /** For 'cards' mode: how many cards to play */
  maxCards: number;
  /** For 'timed' mode: seconds */
  maxTime: number;
  /** For 'points' mode: target score */
  targetScore: number;
  editions: Edition[];
  /** Which card types to include (null = all from selected editions) */
  cardTypes: CardType[] | null;
}

export interface GameState {
  config: GameConfig;
  players: Player[];
  teams: Team[];
  /** Index into players array for whose turn it is */
  currentPlayerIndex: number;
  cardsPlayed: number;
  /** Elapsed seconds (for timed mode) */
  elapsedTime: number;
  /** Is the game currently running */
  isActive: boolean;
  /** When the game started (timestamp) */
  startedAt: number;
}

const STORAGE_KEY = 'koraista_game_state';

let state: GameState | null = null;

export function createDefaultConfig(): GameConfig {
  return {
    playMode: 'solo',
    hasReferee: false,
    questionPool: 'elite',
    winCondition: 'cards',
    maxCards: 20,
    maxTime: 300,
    targetScore: 10,
    editions: ['kickoff', 'secondhalf'],
    cardTypes: null,
  };
}

function createPlayerStats(): PlayerStats {
  return { correct: 0, wrong: 0, streak: 0, bestStreak: 0, categoriesWon: {} };
}

let nextPlayerId = 1;

export function createPlayer(name: string, teamId?: string): Player {
  return {
    id: `p${nextPlayerId++}`,
    name,
    score: 0,
    stats: createPlayerStats(),
    teamId,
  };
}

export function initGame(config: GameConfig, players: Player[], teams: Team[] = []): GameState {
  state = {
    config,
    players,
    teams,
    currentPlayerIndex: 0,
    cardsPlayed: 0,
    elapsedTime: 0,
    isActive: true,
    startedAt: Date.now(),
  };
  saveState();
  return state;
}

export function getState(): GameState {
  if (!state) throw new Error('Game not initialised');
  return state;
}

export function hasState(): boolean {
  return state !== null;
}

export function resetState(): void {
  state = null;
  nextPlayerId = 1;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}

export function saveState(): void {
  if (!state) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw) as GameState;
      return state;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

/** Get current player (skipping referee) */
export function getCurrentPlayer(): Player {
  const gs = getState();
  return gs.players[gs.currentPlayerIndex];
}

export function getReferee(): Player | null {
  const gs = getState();
  return gs.players.find((player) => player.isReferee) ?? null;
}

/** Advance to next player (skipping referee) */
export function advancePlayer(): void {
  const gs = getState();
  let next = (gs.currentPlayerIndex + 1) % gs.players.length;
  // Skip referee
  while (gs.players[next].isReferee && gs.players.length > 1) {
    next = (next + 1) % gs.players.length;
  }
  gs.currentPlayerIndex = next;
  saveState();
}

/** Award points and update stats */
export function awardPoints(playerId: string, points: number, cardType: CardType, correct: boolean): void {
  const gs = getState();
  const player = gs.players.find((p) => p.id === playerId);
  if (!player) return;

  if (correct) {
    player.score += points;
    player.stats.correct++;
    player.stats.streak++;
    if (player.stats.streak > player.stats.bestStreak) {
      player.stats.bestStreak = player.stats.streak;
    }
    player.stats.categoriesWon[cardType] = (player.stats.categoriesWon[cardType] || 0) + 1;
  } else {
    player.score = Math.max(0, player.score - Math.abs(points));
    player.stats.wrong++;
    player.stats.streak = 0;
  }

  gs.cardsPlayed++;
  saveState();
}

/** Check if the game is over based on win condition */
export function isGameOver(): boolean {
  const gs = getState();
  if (!gs.isActive) return true;

  switch (gs.config.winCondition) {
    case 'cards':
      return gs.cardsPlayed >= gs.config.maxCards;
    case 'timed':
      return gs.elapsedTime >= gs.config.maxTime;
    case 'points':
      return gs.players.some((p) => !p.isReferee && p.score >= gs.config.targetScore);
    default:
      return false;
  }
}

/** Get sorted standings (highest score first) */
export function getStandings(): Player[] {
  const gs = getState();
  const activePlayers = gs.players.filter((p) => !p.isReferee);
  return [...activePlayers].sort((a, b) => b.score - a.score);
}

/** Get team scores */
export function getTeamScores(): { team: Team; score: number }[] {
  const gs = getState();
  return gs.teams.map((team) => {
    const score = gs.players
      .filter((p) => p.teamId === team.id)
      .reduce((sum, p) => sum + p.score, 0);
    return { team, score };
  }).sort((a, b) => b.score - a.score);
}

/** Get MVP (highest score + best streak) */
export function getMVP(): Player | null {
  const standings = getStandings();
  return standings.length > 0 ? standings[0] : null;
}
