import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../../utils/theme';
import { createButton, drawGrassBackground, drawHeaderBar, slideIn, scorePopAnimation, spawnConfetti, t } from '../../utils/ui';
import { getCurrentPlayer, awardPoints, advancePlayer, isGameOver } from '../../managers/GameState';
import { getCardManager } from '../GameplayScene';
import { playGoal, playSave } from '../../managers/SoundManager';
import type { PenaltyCard } from '../../data/types';

export class PenaltyCardScene extends Phaser.Scene {
  private card!: PenaltyCard;
  private bet = 0;
  private answered = false;

  constructor() {
    super({ key: 'PenaltyCardScene' });
  }

  create(): void {
    const card = getCardManager().draw('penalty');
    if (!card || card.type !== 'penalty') {
      this.scene.start('GameplayScene');
      return;
    }
    this.card = card;
    this.bet = 0;
    this.answered = false;

    this.showBetScreen();
  }

  private showBetScreen(): void {
    this.children.removeAll(true);
    drawGrassBackground(this);
    drawHeaderBar(this);
    slideIn(this, 'right');

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const player = getCurrentPlayer();

    this.add
      .text(cx, 20, '⚽ PENALTY', { fontSize: '18px', fontFamily: FONT.title, color: '#ff9f43' })
      .setOrigin(0.5);
    this.add
      .text(cx, 45, player.name, { fontSize: '14px', fontFamily: FONT.body, color: HEX.gold })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 140, 'Place your bet!', {
        fontSize: '28px', fontFamily: FONT.title, color: HEX.white,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 100, 'Correct = double your bet\nWrong = lose your bet', {
        fontSize: '14px', fontFamily: FONT.body, color: HEX.textMuted, align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 60, `Your score: ${player.score}`, {
        fontSize: '16px', fontFamily: FONT.body, color: HEX.gold,
      })
      .setOrigin(0.5);

    // Bet buttons: 1, 2, 3
    const bets = [1, 2, 3];
    bets.forEach((b, i) => {
      const x = cx - 100 + i * 100;
      const y = cy + 20;

      const bg = this.add
        .rectangle(x, y, 80, 80, COLORS.darkNavy, 0.9)
        .setInteractive({ useHandCursor: true });

      this.add.graphics()
        .lineStyle(2, COLORS.gold, 0.6)
        .strokeRoundedRect(x - 40, y - 40, 80, 80, 10);

      this.add
        .text(x, y - 10, `${b}`, { fontSize: '32px', fontFamily: FONT.title, color: HEX.gold })
        .setOrigin(0.5);
      this.add
        .text(x, y + 22, b === 1 ? 'pt' : 'pts', { fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted })
        .setOrigin(0.5);

      bg.on('pointerdown', () => {
        this.bet = b;
        this.showQuestion();
      });
    });

    // "No bet" option
    const noBetBtn = this.add
      .text(cx, cy + 100, 'Skip bet (0 risk)', {
        fontSize: '14px', fontFamily: FONT.body, color: HEX.textMuted,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    noBetBtn.on('pointerdown', () => {
      this.bet = 0;
      this.showQuestion();
    });
  }

  private showQuestion(): void {
    this.children.removeAll(true);
    drawGrassBackground(this);
    drawHeaderBar(this);

    const cx = this.scale.width / 2;
    const player = getCurrentPlayer();

    this.add
      .text(cx, 20, `⚽ PENALTY — Bet: ${this.bet} pt${this.bet !== 1 ? 's' : ''}`, {
        fontSize: '16px', fontFamily: FONT.title, color: '#ff9f43',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 45, player.name, { fontSize: '14px', fontFamily: FONT.body, color: HEX.gold })
      .setOrigin(0.5);

    // Question
    this.add
      .text(cx, 120, t(this.card.question), {
        fontSize: '18px', fontFamily: FONT.body, color: HEX.white,
        wordWrap: { width: 420 }, align: 'center',
      })
      .setOrigin(0.5);

    // Options
    const optionLabels = ['A', 'B', 'C', 'D'];
    const startY = 220;
    const optH = 60;
    const optW = 400;

    this.card.options.forEach((opt, i) => {
      const y = startY + i * (optH + 12);
      const bg = this.add.rectangle(cx, y, optW, optH, COLORS.darkNavy, 0.8).setInteractive({ useHandCursor: true });
      const border = this.add.graphics();
      border.lineStyle(1, COLORS.textDark, 0.4);
      border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6);

      this.add.text(cx - optW / 2 + 20, y, optionLabels[i], { fontSize: '18px', fontFamily: FONT.title, color: '#ff9f43' }).setOrigin(0, 0.5);
      this.add.text(cx, y, t(opt), { fontSize: '14px', fontFamily: FONT.body, color: HEX.white, wordWrap: { width: optW - 60 }, align: 'center' }).setOrigin(0.5);

      bg.on('pointerover', () => {
        if (!this.answered) { border.clear(); border.lineStyle(2, COLORS.gold, 0.8); border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6); }
      });
      bg.on('pointerout', () => {
        if (!this.answered) { border.clear(); border.lineStyle(1, COLORS.textDark, 0.4); border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6); }
      });
      bg.on('pointerdown', () => {
        if (this.answered) return;
        this.answered = true;

        const correct = i === this.card.answerIndex;
        const color = correct ? COLORS.green : COLORS.crimson;
        border.clear(); border.lineStyle(3, color, 1); border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6);
        bg.setFillStyle(color, 0.3);

        this.showResult(correct);
      });
    });

    // Penalty kick visual: goal with ball
    const goalY = 620;
    const gfx = this.add.graphics();
    gfx.lineStyle(3, COLORS.white, 0.4);
    gfx.strokeRect(cx - 100, goalY, 200, 60);
    // Net
    gfx.lineStyle(1, COLORS.textDark, 0.2);
    for (let x = cx - 100; x <= cx + 100; x += 15) {
      gfx.lineBetween(x, goalY, x, goalY + 60);
    }
    this.add.text(cx, goalY + 80, '⚽', { fontSize: '24px' }).setOrigin(0.5);
  }

  private showResult(correct: boolean): void {
    const cx = this.scale.width / 2;
    const player = getCurrentPlayer();

    if (correct) {
      const gained = this.bet * 2;
      playGoal();
      awardPoints(player.id, gained, 'penalty', true);
      spawnConfetti(this, cx, 500);
      scorePopAnimation(this, cx, 480, gained > 0 ? `+${gained}` : '+0');
      this.cameras.main.shake(300, 0.01);
    } else {
      // Lose the bet
      playSave();
      awardPoints(player.id, this.bet, 'penalty', false);
      if (this.bet > 0) {
        scorePopAnimation(this, cx, 480, `-${this.bet}`);
      }
    }

    const resultText = correct ? 'GOAL! ⚽🎉' : 'SAVED! 🧤';
    this.add
      .text(cx, 720, resultText, { fontSize: '28px', fontFamily: FONT.title, color: correct ? HEX.green : HEX.crimson })
      .setOrigin(0.5);

    if (this.card.explanation) {
      this.add
        .text(cx, 755, t(this.card.explanation), {
          fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted,
          wordWrap: { width: 400 }, align: 'center',
        })
        .setOrigin(0.5);
    }

    advancePlayer();
    createButton(this, cx, 810, isGameOver() ? 'SEE RESULTS' : 'NEXT', () => {
      this.scene.start(isGameOver() ? 'FinalResultScene' : 'GameplayScene');
    }, { fontSize: '22px', paddingX: 24, paddingY: 10 });
  }
}
