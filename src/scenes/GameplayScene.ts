import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../utils/theme';
import { createButton, createPanel, createPill, drawGrassBackground, drawHeaderBar, slideIn } from '../utils/ui';
import { playTap, playCardDraw, startCrowdAmbience } from '../managers/SoundManager';
import {
  getState,
  getCurrentPlayer,
  isGameOver,
  getStandings,
  getTeamScores,
  getReferee,
  saveState,
} from '../managers/GameState';
import { CardManager } from '../managers/CardManager';
import type { CardType } from '../data/types';

let cardManager: CardManager | null = null;

export function getCardManager(): CardManager {
  if (!cardManager) throw new Error('CardManager not initialised');
  return cardManager;
}

export class GameplayScene extends Phaser.Scene {
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameplayScene' });
  }

  create(): void {
    const gs = getState();
    cardManager = new CardManager(gs.config.editions, gs.config.questionPool);

    startCrowdAmbience();
    drawGrassBackground(this);
    drawHeaderBar(this);
    slideIn(this, 'right');

    this.drawUI();

    // Start timer if timed mode
    if (gs.config.winCondition === 'timed') {
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
          gs.elapsedTime++;
          saveState();
          if (isGameOver()) {
            this.timerEvent?.destroy();
            this.scene.start('FinalResultScene');
          }
          this.drawUI();
        },
      });
    }
  }

  private drawUI(): void {
    this.children.removeAll(true);

    const cx = this.scale.width / 2;
    const gs = getState();

    drawGrassBackground(this);
    drawHeaderBar(this);

    // Scoreboard
    this.drawScoreboard();

    const referee = getReferee();

    createPanel(this, cx, 102, 420, 78, COLORS.gold, 0.78);
    const currentPlayer = getCurrentPlayer();
    this.add
      .text(cx, 82, `${currentPlayer.name}'s Turn`, {
        fontSize: '24px',
        fontFamily: FONT.title,
        color: HEX.white,
      })
      .setOrigin(0.5);
    createPill(this, cx, 110, gs.config.questionPool === 'elite' ? 'ELITE QUESTIONS' : 'ALL-STAR MIX', gs.config.questionPool === 'elite' ? HEX.gold : HEX.cyan);
    if (referee) {
      this.add
        .text(cx, 136, `Referee: ${referee.name}`, {
          fontSize: '11px',
          fontFamily: FONT.body,
          color: HEX.textMuted,
        })
        .setOrigin(0.5);
    }

    // Streak indicator
    if (currentPlayer.stats.streak >= 3) {
      this.add
        .text(cx, 162, `🔥 ${currentPlayer.stats.streak} streak!`, {
          fontSize: '14px',
          fontFamily: FONT.body,
          color: HEX.crimson,
        })
        .setOrigin(0.5);
    }

    // Progress info
    let progressText = '';
    if (gs.config.winCondition === 'cards') {
      progressText = `Card ${gs.cardsPlayed + 1} / ${gs.config.maxCards}`;
    } else if (gs.config.winCondition === 'timed') {
      const remaining = gs.config.maxTime - gs.elapsedTime;
      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      progressText = `⏱ ${min}:${sec.toString().padStart(2, '0')}`;
    } else {
      const leader = getStandings()[0];
      progressText = `Target: ${gs.config.targetScore} pts | Leader: ${leader?.name} (${leader?.score})`;
    }

    this.add
      .text(cx, 182, progressText, {
        fontSize: '13px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);

    // Card type buttons (draw a card)
    const availableTypes = this.getAvailableCardTypes();
    const btnY = 235;
    const cardTypeInfo: { type: CardType; label: string; emoji: string; color: string }[] = [
      { type: 'rank', label: 'RANK', emoji: '📊', color: HEX.crimson },
      { type: 'headline', label: 'HEADLINE', emoji: '📰', color: HEX.cyan },
      { type: 'homeaway', label: 'HOME/AWAY', emoji: '🏟️', color: HEX.gold },
      { type: 'flashback', label: 'FLASHBACK', emoji: '📷', color: HEX.green },
      { type: 'var', label: 'VAR', emoji: '📺', color: '#ff6b9d' },
      { type: 'penalty', label: 'PENALTY', emoji: '⚽', color: '#ff9f43' },
    ];

    const filtered = cardTypeInfo.filter((c) => availableTypes.includes(c.type));
    const cols = 2;
    const cardW = 180;
    const cardH = 90;
    const gapX = 15;
    const gapY = 15;

    if (filtered.length === 0) {
      this.add
        .text(cx, 320, 'No cards left in this pool.\nBlow the whistle and go to final standings.', {
          fontSize: '16px',
          fontFamily: FONT.body,
          color: HEX.white,
          align: 'center',
        })
        .setOrigin(0.5);
    }

    filtered.forEach((info, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cx - (cols * cardW + (cols - 1) * gapX) / 2 + col * (cardW + gapX) + cardW / 2;
      const y = btnY + row * (cardH + gapY) + cardH / 2;

      this.drawCardTypeButton(x, y, cardW, cardH, info.emoji, info.label, info.color, info.type);
    });

    // Random card button
    const randomY = btnY + Math.ceil(Math.max(filtered.length, 1) / cols) * (cardH + gapY) + 20;
    createButton(this, cx, randomY, filtered.length === 0 ? '🏁  FINAL STANDINGS' : '🎲  MATCHDAY DRAW', () => {
      if (filtered.length === 0) {
        this.scene.start('FinalResultScene');
        return;
      }
      const card = getCardManager().drawRandom(availableTypes);
      if (card) {
        this.navigateToCard(card.type);
      }
    }, { fontSize: '20px', paddingX: 20, paddingY: 10 });

    // Exit button
    const exitBtn = this.add
      .text(20, this.scale.height - 30, '🚪 EXIT', {
        fontSize: '14px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setInteractive({ useHandCursor: true });

    exitBtn.on('pointerdown', () => {
      this.timerEvent?.destroy();
      this.scene.start('FinalResultScene');
    });
  }

  private drawScoreboard(): void {
    const gs = getState();
    const cx = this.scale.width / 2;

    if (gs.config.playMode === 'teams') {
      const teamScores = getTeamScores();
      teamScores.forEach((ts, i) => {
        const x = i === 0 ? 60 : this.scale.width - 60;
            this.add
              .text(x, 20, `${ts.team.name}`, {
            fontSize: '12px',
            fontFamily: FONT.body,
            color: ts.team.color,
          })
          .setOrigin(0.5);
        this.add
          .text(x, 38, `${ts.score}`, {
            fontSize: '22px',
            fontFamily: FONT.title,
            color: ts.team.color,
          })
          .setOrigin(0.5);
      });
    } else {
      // Show top 2 players in header
      const standings = getStandings();
      standings.slice(0, 2).forEach((p, i) => {
        const x = i === 0 ? 60 : this.scale.width - 60;
        const color = i === 0 ? HEX.crimson : HEX.cyan;
        this.add
          .text(x, 20, p.name, {
            fontSize: '12px',
            fontFamily: FONT.body,
            color,
          })
          .setOrigin(0.5);
        this.add
          .text(x, 38, `${p.score}`, {
            fontSize: '22px',
            fontFamily: FONT.title,
            color,
          })
          .setOrigin(0.5);
      });
    }
  }

  private drawCardTypeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    emoji: string,
    label: string,
    color: string,
    type: CardType,
  ): void {
    const remaining = getCardManager().remaining(type);
    const bg = this.add
      .rectangle(x, y, w, h, COLORS.darkNavy, 0.85)
      .setInteractive({ useHandCursor: true });

    const border = this.add.graphics();
    border.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.6);
    border.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

    this.add
      .text(x, y - 18, `${emoji} ${label}`, {
        fontSize: '14px',
        fontFamily: FONT.title,
        color,
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 5, `${remaining} cards`, {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);

    const gs = getState();
    createPill(this, x, y + 28, gs.config.questionPool === 'elite' ? 'HARD MODE' : 'MIXED', color);

    bg.on('pointerover', () => {
      border.clear();
      border.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
      border.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    });
    bg.on('pointerout', () => {
      border.clear();
      border.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.6);
      border.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    });
    bg.on('pointerdown', () => {
      if (remaining > 0) {
        this.navigateToCard(type);
      }
    });
  }

  private getAvailableCardTypes(): CardType[] {
    const gs = getState();
    const allTypes: CardType[] = ['rank', 'headline', 'homeaway', 'flashback', 'var', 'penalty'];
    const editionFilter: Record<string, CardType[]> = {
      kickoff: ['rank', 'headline', 'homeaway'],
      secondhalf: ['flashback', 'var', 'penalty'],
    };

    let types: CardType[] = [];
    for (const ed of gs.config.editions) {
      types.push(...(editionFilter[ed] || []));
    }

    if (gs.config.cardTypes) {
      types = types.filter((t) => gs.config.cardTypes!.includes(t));
    }

    // Filter to types with remaining cards
    return types.filter((t) => getCardManager().remaining(t) > 0);
  }

  private navigateToCard(type: CardType): void {
    playCardDraw();
    const sceneMap: Record<CardType, string> = {
      rank: 'RankCardScene',
      headline: 'HeadlineCardScene',
      homeaway: 'HomeAwayCardScene',
      flashback: 'FlashbackCardScene',
      var: 'VARCardScene',
      penalty: 'PenaltyCardScene',
    };
    this.timerEvent?.destroy();
    this.scene.start(sceneMap[type]);
  }
}
