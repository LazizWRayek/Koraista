import type { Card, CardType, Difficulty, Edition } from '../data/types';
import type { QuestionPool } from './GameState';
import { rankCards } from '../data/rankCards';
import { headlineCards } from '../data/headlineCards';
import { homeAwayCards } from '../data/homeAwayCards';
import { flashbackCards } from '../data/flashbackCards';
import { varCards } from '../data/varCards';
import { penaltyCards } from '../data/penaltyCards';

/** Fisher-Yates shuffle (in-place) */
function makeRng(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class CardManager {
  private decks: Record<CardType, Card[]> = {
    rank: [],
    headline: [],
    homeaway: [],
    flashback: [],
    var: [],
    penalty: [],
  };
  private usedIds = new Set<string>();
  private seed: number;

  constructor(editions?: Edition[], questionPool: QuestionPool = 'all', seed = Date.now()) {
    this.seed = seed;
    this.buildDecks(editions, questionPool);
  }

  private buildDecks(editions?: Edition[], questionPool: QuestionPool = 'all'): void {
    const all: Card[] = [
      ...rankCards,
      ...headlineCards,
      ...homeAwayCards,
      ...flashbackCards,
      ...varCards,
      ...penaltyCards,
    ];

    const allowedDifficulties: Difficulty[] = questionPool === 'elite'
      ? ['away']
      : ['home', 'away'];

    const filtered = (editions
      ? all.filter((c) => editions.includes(c.edition))
      : all)
      .filter((card) => allowedDifficulties.includes(card.difficulty));

    // Reset decks
    for (const key of Object.keys(this.decks) as CardType[]) {
      this.decks[key] = [];
    }

    for (const card of filtered) {
      this.decks[card.type].push(card);
    }

    // Shuffle each deck
    for (const key of Object.keys(this.decks) as CardType[]) {
      shuffle(this.decks[key], makeRng(this.seed + key.length * 997));
    }
  }

  /** Draw a card of a specific type. Returns null if deck exhausted. */
  draw(type: CardType): Card | null {
    const deck = this.decks[type];
    // Find first unused card
    while (deck.length > 0) {
      const card = deck.pop()!;
      if (!this.usedIds.has(card.id)) {
        this.usedIds.add(card.id);
        return card;
      }
    }
    return null;
  }

  /** Draw a random card from any available type */
  drawRandom(allowedTypes?: CardType[]): Card | null {
    const types = allowedTypes ?? (Object.keys(this.decks) as CardType[]);
    const available = types.filter((t) => this.decks[t].length > 0);
    if (available.length === 0) return null;
    const type = available[Math.floor(makeRng(this.seed + this.usedIds.size + 17)() * available.length)];
    return this.draw(type);
  }

  drawById(type: CardType, id: string): Card | null {
    const deck = this.decks[type];
    const idx = deck.findIndex((card) => card.id === id);
    if (idx === -1 || this.usedIds.has(id)) return null;
    const [card] = deck.splice(idx, 1);
    this.usedIds.add(id);
    return card;
  }

  /** How many cards remain in a specific deck */
  remaining(type: CardType): number {
    return this.decks[type].length;
  }

  /** Total remaining across all decks */
  totalRemaining(): number {
    return Object.values(this.decks).reduce((sum, d) => sum + d.length, 0);
  }

  /** Reset used cards and reshuffle */
  reset(editions?: Edition[], questionPool: QuestionPool = 'all'): void {
    this.usedIds.clear();
    this.buildDecks(editions, questionPool);
  }
}
