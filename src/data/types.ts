/** Card / question data types for Koraista */

export type CardType = 'rank' | 'headline' | 'homeaway' | 'flashback' | 'var' | 'penalty';
export type Edition = 'kickoff' | 'secondhalf';
export type Difficulty = 'home' | 'away';
export type Language = 'ar' | 'en';

export interface CardBase {
  id: string;
  type: CardType;
  edition: Edition;
  difficulty: Difficulty;
}

export interface RankCard extends CardBase {
  type: 'rank';
  question: { ar: string; en: string };
  /** Items to be ranked in the correct order (index 0 = first) */
  items: { ar: string; en: string }[];
  explanation?: { ar: string; en: string };
}

export interface HeadlineCard extends CardBase {
  type: 'headline';
  headline: { ar: string; en: string };
  question: { ar: string; en: string };
  options: { ar: string; en: string }[];
  answerIndex: number;
  explanation?: { ar: string; en: string };
}

export interface HomeAwayCard extends CardBase {
  type: 'homeaway';
  homeQuestion: { ar: string; en: string };
  homeAnswer: { ar: string; en: string };
  awayQuestion: { ar: string; en: string };
  awayAnswer: { ar: string; en: string };
}

export interface FlashbackCard extends CardBase {
  type: 'flashback';
  /** Description of what the image shows (used as text fallback) */
  imageDescription: { ar: string; en: string };
  /** Optional image URL or asset key */
  media?: string;
  options: { ar: string; en: string }[];
  answerIndex: number;
  explanation?: { ar: string; en: string };
}

export interface VARCard extends CardBase {
  type: 'var';
  statements: { text: { ar: string; en: string }; correct: boolean }[];
  /** Index of the false statement */
  falseIndex: number;
  explanation?: { ar: string; en: string };
}

export interface PenaltyCard extends CardBase {
  type: 'penalty';
  question: { ar: string; en: string };
  options: { ar: string; en: string }[];
  answerIndex: number;
  explanation?: { ar: string; en: string };
}

export type Card = RankCard | HeadlineCard | HomeAwayCard | FlashbackCard | VARCard | PenaltyCard;
