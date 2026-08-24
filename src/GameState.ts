/** Shared game state for local pass-and-play multiplayer */
export interface PlayerState {
  name: string;
  score: number;
}

export interface GameState {
  players: [PlayerState, PlayerState];
  currentRound: number;
  maxRounds: number;
  /** Index of the player currently kicking (0 or 1) */
  kickerIndex: number;
}

let state: GameState | null = null;

export function initGame(p1: string, p2: string, rounds = 5): GameState {
  state = {
    players: [
      { name: p1, score: 0 },
      { name: p2, score: 0 },
    ],
    currentRound: 1,
    maxRounds: rounds,
    kickerIndex: 0,
  };
  return state;
}

export function getState(): GameState {
  if (!state) throw new Error('Game not initialised');
  return state;
}

export function resetState(): void {
  state = null;
}
