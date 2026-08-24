import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../../utils/theme';
import { createButton, drawGrassBackground, drawHeaderBar, slideIn, scorePopAnimation, spawnConfetti, t } from '../../utils/ui';
import { getCurrentPlayer, awardPoints, advancePlayer, isGameOver } from '../../managers/GameState';
import { getCardManager } from '../GameplayScene';
import type { VARCard } from '../../data/types';

export class VARCardScene extends Phaser.Scene {
  private card!: VARCard;
  private answered = false;

  constructor() {
    super({ key: 'VARCardScene' });
  }

  create(): void {
    const card = getCardManager().draw('var');
    if (!card || card.type !== 'var') {
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

    this.add
      .text(cx, 20, '📺 VAR', { fontSize: '18px', fontFamily: FONT.title, color: '#ff6b9d' })
      .setOrigin(0.5);
    this.add
      .text(cx, 45, player.name, { fontSize: '14px', fontFamily: FONT.body, color: HEX.gold })
      .setOrigin(0.5);

    // Instructions
    this.add
      .text(cx, 90, 'One of these statements is FALSE.\nFind the foul! 🔍', {
        fontSize: '16px', fontFamily: FONT.body, color: HEX.white, align: 'center',
      })
      .setOrigin(0.5);

    // Three statements
    const startY = 190;
    const stmtH = 100;
    const stmtW = 420;

    this.card.statements.forEach((stmt, i) => {
      const y = startY + i * (stmtH + 15);

      const bg = this.add
        .rectangle(cx, y, stmtW, stmtH, COLORS.darkNavy, 0.85)
        .setInteractive({ useHandCursor: true });

      const border = this.add.graphics();
      border.lineStyle(1, COLORS.textDark, 0.4);
      border.strokeRoundedRect(cx - stmtW / 2, y - stmtH / 2, stmtW, stmtH, 8);

      // Number badge
      this.add
        .text(cx - stmtW / 2 + 20, y - 20, `${i + 1}`, {
          fontSize: '22px', fontFamily: FONT.title, color: '#ff6b9d',
        })
        .setOrigin(0, 0.5);

      this.add
        .text(cx, y + 5, t(stmt.text), {
          fontSize: '14px', fontFamily: FONT.body, color: HEX.white,
          wordWrap: { width: stmtW - 50 }, align: 'center',
        })
        .setOrigin(0.5);

      bg.on('pointerover', () => {
        if (!this.answered) {
          border.clear();
          border.lineStyle(2, COLORS.crimson, 0.8);
          border.strokeRoundedRect(cx - stmtW / 2, y - stmtH / 2, stmtW, stmtH, 8);
        }
      });
      bg.on('pointerout', () => {
        if (!this.answered) {
          border.clear();
          border.lineStyle(1, COLORS.textDark, 0.4);
          border.strokeRoundedRect(cx - stmtW / 2, y - stmtH / 2, stmtW, stmtH, 8);
        }
      });
      bg.on('pointerdown', () => {
        if (this.answered) return;
        this.answered = true;

        const correct = i === this.card.falseIndex;
        const color = correct ? COLORS.green : COLORS.crimson;
        border.clear();
        border.lineStyle(3, color, 1);
        border.strokeRoundedRect(cx - stmtW / 2, y - stmtH / 2, stmtW, stmtH, 8);
        bg.setFillStyle(color, 0.3);

        // Highlight the actual false one if player was wrong
        if (!correct) {
          const falseY = startY + this.card.falseIndex * (stmtH + 15);
          this.add.graphics()
            .lineStyle(3, COLORS.crimson, 1)
            .strokeRoundedRect(cx - stmtW / 2, falseY - stmtH / 2, stmtW, stmtH, 8);
          this.add
            .text(cx + stmtW / 2 - 15, falseY - stmtH / 2 + 5, '← FALSE', {
              fontSize: '12px', fontFamily: FONT.title, color: HEX.crimson,
            })
            .setOrigin(1, 0);
        }

        this.showResult(correct);
      });
    });
  }

  private showResult(correct: boolean): void {
    const cx = this.scale.width / 2;
    const player = getCurrentPlayer();

    if (correct) {
      awardPoints(player.id, 1, 'var', true);
      spawnConfetti(this, cx, 500);
      scorePopAnimation(this, cx, 480, '+1');
    } else {
      awardPoints(player.id, 0, 'var', false);
    }

    const resultText = correct ? 'VAR CONFIRMED! ✅' : 'WRONG CALL! ❌';
    this.add
      .text(cx, 620, resultText, { fontSize: '28px', fontFamily: FONT.title, color: correct ? HEX.green : HEX.crimson })
      .setOrigin(0.5);

    if (this.card.explanation) {
      this.add
        .text(cx, 660, t(this.card.explanation), {
          fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted,
          wordWrap: { width: 400 }, align: 'center',
        })
        .setOrigin(0.5);
    }

    advancePlayer();
    createButton(this, cx, 740, isGameOver() ? 'SEE RESULTS' : 'NEXT', () => {
      this.scene.start(isGameOver() ? 'FinalResultScene' : 'GameplayScene');
    }, { fontSize: '22px', paddingX: 24, paddingY: 10 });
  }
}
