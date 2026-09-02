import type { Card, CardType, Difficulty, Edition } from '../data/types';
import type { QuestionPool } from './GameState';
import { rankCards } from '../data/rankCards';
import { headlineCards } from '../data/headlineCards';
import { homeAwayCards } from '../data/homeAwayCards';
import { flashbackCards } from '../data/flashbackCards';
import { varCards } from '../data/varCards';
import { penaltyCards } from '../data/penaltyCards';

/** Fisher-Yates shuffle (in-place) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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

  constructor(editions?: Edition[], questionPool: QuestionPool = 'all') {
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
      shuffle(this.decks[key]);
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
    const type = available[Math.floor(Math.random() * available.length)];
    return this.draw(type);
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
