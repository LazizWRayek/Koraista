import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../../utils/theme';
import { createButton, drawGrassBackground, drawHeaderBar, slideIn, scorePopAnimation, spawnConfetti, t } from '../../utils/ui';
import { getCurrentPlayer, awardPoints, advancePlayer, isGameOver } from '../../managers/GameState';
import { getCardManager } from '../GameplayScene';
import type { HeadlineCard } from '../../data/types';

export class HeadlineCardScene extends Phaser.Scene {
  private card!: HeadlineCard;
  private answered = false;

  constructor() {
    super({ key: 'HeadlineCardScene' });
  }

  create(): void {
    const card = getCardManager().draw('headline');
    if (!card || card.type !== 'headline') {
      this.scene.start('GameplayScene');
      return;
    }
    this.card = card;
    this.answered = false;

    drawGrassBackground(this);
    drawHeaderBar(this);
    slideIn(this, 'right');

    const cx = this.scale.width / 2;
    const player = getCurrentPlayer();

    // Header
    this.add
      .text(cx, 20, '📰 HEADLINE', { fontSize: '18px', fontFamily: FONT.title, color: HEX.cyan })
      .setOrigin(0.5);
    this.add
      .text(cx, 45, player.name, { fontSize: '14px', fontFamily: FONT.body, color: HEX.gold })
      .setOrigin(0.5);

    // Headline in a "newspaper" style box
    const headlineBox = this.add.rectangle(cx, 140, 420, 100, COLORS.darkNavy, 0.9);
    const headlineBorder = this.add.graphics();
    headlineBorder.lineStyle(2, COLORS.cyan, 0.5);
    headlineBorder.strokeRoundedRect(cx - 210, 90, 420, 100, 8);

    this.add
      .text(cx, 125, `"${t(this.card.headline)}"`, {
        fontSize: '14px',
        fontFamily: FONT.body,
        color: HEX.white,
        fontStyle: 'italic',
        wordWrap: { width: 390 },
        align: 'center',
      })
      .setOrigin(0.5);

    // Question
    this.add
      .text(cx, 210, t(this.card.question), {
        fontSize: '16px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        wordWrap: { width: 420 },
        align: 'center',
      })
      .setOrigin(0.5);

    // Options (A/B/C/D)
    const optionLabels = ['A', 'B', 'C', 'D'];
    const startY = 270;
    const optH = 55;
    const optW = 400;

    this.card.options.forEach((opt, i) => {
      const y = startY + i * (optH + 10);

      const bg = this.add
        .rectangle(cx, y, optW, optH, COLORS.darkNavy, 0.8)
        .setInteractive({ useHandCursor: true });

      const border = this.add.graphics();
      border.lineStyle(1, COLORS.textDark, 0.4);
      border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6);

      this.add
        .text(cx - optW / 2 + 20, y, optionLabels[i], {
          fontSize: '18px',
          fontFamily: FONT.title,
          color: HEX.cyan,
        })
        .setOrigin(0, 0.5);

      this.add
        .text(cx, y, t(opt), {
          fontSize: '14px',
          fontFamily: FONT.body,
          color: HEX.white,
          wordWrap: { width: optW - 60 },
          align: 'center',
        })
        .setOrigin(0.5);

      bg.on('pointerover', () => {
        if (!this.answered) {
          border.clear();
          border.lineStyle(2, COLORS.gold, 0.8);
          border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6);
        }
      });
      bg.on('pointerout', () => {
        if (!this.answered) {
          border.clear();
          border.lineStyle(1, COLORS.textDark, 0.4);
          border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6);
        }
      });
      bg.on('pointerdown', () => this.selectAnswer(i, bg, border, y, optW, optH));
    });
  }

  private selectAnswer(
    idx: number,
    bg: Phaser.GameObjects.Rectangle,
    border: Phaser.GameObjects.Graphics,
    y: number,
    optW: number,
    optH: number,
  ): void {
    if (this.answered) return;
    this.answered = true;

    const correct = idx === this.card.answerIndex;
    const player = getCurrentPlayer();
    const cx = this.scale.width / 2;

    // Highlight selected
    const color = correct ? COLORS.green : COLORS.crimson;
    border.clear();
    border.lineStyle(3, color, 1);
    border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6);
    bg.setFillStyle(color, 0.3);

    if (correct) {
      awardPoints(player.id, 1, 'headline', true);
      spawnConfetti(this, cx, y);
      scorePopAnimation(this, cx, y - 40, '+1');
    } else {
      awardPoints(player.id, 0, 'headline', false);
    }

    // Show correct answer if wrong
    const resultText = correct ? 'CORRECT! ✅' : 'WRONG! ❌';
    const resultColor = correct ? HEX.green : HEX.crimson;

    this.add
      .text(cx, 660, resultText, { fontSize: '28px', fontFamily: FONT.title, color: resultColor })
      .setOrigin(0.5);

    if (this.card.explanation) {
      this.add
        .text(cx, 695, t(this.card.explanation), {
          fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted,
          wordWrap: { width: 400 }, align: 'center',
        })
        .setOrigin(0.5);
    }

    advancePlayer();
    const nextLabel = isGameOver() ? 'SEE RESULTS' : 'NEXT';
    createButton(this, cx, 760, nextLabel, () => {
      this.scene.start(isGameOver() ? 'FinalResultScene' : 'GameplayScene');
    }, { fontSize: '22px', paddingX: 24, paddingY: 10 });
  }
}
