import type { CardType } from '../data/types';
import type { Player } from './GameState';

export interface PlayerProfile {
  name: string;
  matches: number;
  wins: number;
  totalPoints: number;
  bestStreak: number;
  badges: string[];
  favoriteCategory?: CardType;
  lastPlayedAt: number;
}

export interface MatchHighlight {
  title: string;
  value: string;
}

export interface MatchRecord {
  playedAt: number;
  winnerName: string | null;
  standings: { name: string; score: number }[];
  highlights: MatchHighlight[];
}

const PROFILES_KEY = 'koraista_profiles';
const HISTORY_KEY = 'koraista_match_history';

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function loadProfiles(): Record<string, PlayerProfile> {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}') as Record<string, PlayerProfile>;
  } catch {
    return {};
  }
}

function saveProfiles(profiles: Record<string, PlayerProfile>): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // ignore storage errors
  }
}

function loadHistory(): MatchRecord[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as MatchRecord[];
  } catch {
    return [];
  }
}

function saveHistory(history: MatchRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors
  }
}

function getFavoriteCategory(player: Player): CardType | undefined {
  const entries = Object.entries(player.stats.categoriesWon);
  if (!entries.length) return undefined;
  return entries.sort((a, b) => (b[1] || 0) - (a[1] || 0))[0][0] as CardType;
}

export function getPlayerProfile(name: string): PlayerProfile | null {
  const profiles = loadProfiles();
  return profiles[normalizeName(name)] ?? null;
}

export function getRecentMatches(limit = 5): MatchRecord[] {
  return loadHistory().slice(0, limit);
}

export function getPlayerBadges(player: Player): string[] {
  const badges: string[] = [];
  if (player.stats.bestStreak >= 4) badges.push('Hot Streak');
  if (player.stats.correct >= 3) badges.push('Quiz Killer');
  if (player.stats.wrong === 0 && player.stats.correct > 0) badges.push('Clean Sheet');
  if (player.score >= 6) badges.push('Captain Clutch');
  const favorite = getFavoriteCategory(player);
  if (favorite) badges.push(`${favorite.toUpperCase()} Boss`);
  return badges.slice(0, 3);
}

export function buildMatchHighlights(players: Player[]): MatchHighlight[] {
  const activePlayers = players.filter((player) => !player.isReferee);
  if (!activePlayers.length) return [];

  const topScorer = [...activePlayers].sort((a, b) => b.score - a.score)[0];
  const streakKing = [...activePlayers].sort((a, b) => b.stats.bestStreak - a.stats.bestStreak)[0];
  const accuracyKing = [...activePlayers].sort((a, b) => b.stats.correct - a.stats.correct)[0];

  return [
    { title: 'Top scorer', value: `${topScorer.name} • ${topScorer.score} pts` },
    { title: 'Best streak', value: `${streakKing.name} • ${streakKing.stats.bestStreak}` },
    { title: 'Most correct', value: `${accuracyKing.name} • ${accuracyKing.stats.correct}` },
  ];
}

export function recordMatch(players: Player[]): void {
  const profiles = loadProfiles();
  const activePlayers = players.filter((player) => !player.isReferee);
  const standings = [...activePlayers].sort((a, b) => b.score - a.score);
  const winnerName = standings.length > 1 && standings[0].score === standings[1].score ? null : standings[0]?.name ?? null;
  const highlights = buildMatchHighlights(players);

  activePlayers.forEach((player) => {
    const key = normalizeName(player.name);
    const existing = profiles[key];
    const badges = getPlayerBadges(player);
    profiles[key] = {
      name: player.name,
      matches: (existing?.matches ?? 0) + 1,
      wins: (existing?.wins ?? 0) + (winnerName === player.name ? 1 : 0),
      totalPoints: (existing?.totalPoints ?? 0) + player.score,
      bestStreak: Math.max(existing?.bestStreak ?? 0, player.stats.bestStreak),
      badges,
      favoriteCategory: getFavoriteCategory(player) ?? existing?.favoriteCategory,
      lastPlayedAt: Date.now(),
    };
  });

  saveProfiles(profiles);

  const history = loadHistory();
  history.unshift({
    playedAt: Date.now(),
    winnerName,
    standings: standings.map((player) => ({ name: player.name, score: player.score })),
    highlights,
  });
  saveHistory(history.slice(0, 12));
}
