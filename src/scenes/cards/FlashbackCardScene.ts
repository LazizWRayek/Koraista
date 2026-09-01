import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../../utils/theme';
import { createButton, drawGrassBackground, drawHeaderBar, slideIn, scorePopAnimation, spawnConfetti, t, drawTimerRing } from '../../utils/ui';
import { getCurrentPlayer, awardPoints, advancePlayer, isGameOver } from '../../managers/GameState';
import { getCardManager } from '../GameplayScene';
import { playCorrect, playWrong, playTick } from '../../managers/SoundManager';
import type { FlashbackCard } from '../../data/types';

const TIMER_SECONDS = 15;

export class FlashbackCardScene extends Phaser.Scene {
  private card!: FlashbackCard;
  private answered = false;
  private timeLeft = TIMER_SECONDS;
  private timerEvent?: Phaser.Time.TimerEvent;
  private timerGfx?: Phaser.GameObjects.Graphics;
  private timerText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'FlashbackCardScene' });
  }

  create(): void {
    const card = getCardManager().draw('flashback');
    if (!card || card.type !== 'flashback') {
      this.scene.start('GameplayScene');
      return;
    }
    this.card = card;
    this.answered = false;
    this.timeLeft = TIMER_SECONDS;

    drawGrassBackground(this);
    drawHeaderBar(this);
    slideIn(this, 'right');

    const cx = this.scale.width / 2;
    const player = getCurrentPlayer();

    this.add
      .text(cx, 20, '📷 FLASHBACK', { fontSize: '18px', fontFamily: FONT.title, color: HEX.green })
      .setOrigin(0.5);
    this.add
      .text(cx, 45, player.name, { fontSize: '14px', fontFamily: FONT.body, color: HEX.gold })
      .setOrigin(0.5);

    // Timer ring
    this.timerGfx = drawTimerRing(this, cx, 100, 25, 1);
    this.timerText = this.add
      .text(cx, 100, `${this.timeLeft}`, { fontSize: '16px', fontFamily: FONT.title, color: HEX.white })
      .setOrigin(0.5);

    // Image description / "flashback" box
    this.add.rectangle(cx, 210, 400, 120, COLORS.darkNavy, 0.9);
    const descBorder = this.add.graphics();
    descBorder.lineStyle(2, COLORS.green, 0.5);
    descBorder.strokeRoundedRect(cx - 200, 150, 400, 120, 10);

    this.add.text(cx, 175, '📷', { fontSize: '32px' }).setOrigin(0.5);
    this.add
      .text(cx, 220, t(this.card.imageDescription), {
        fontSize: '14px', fontFamily: FONT.body, color: HEX.white,
        wordWrap: { width: 360 }, align: 'center', fontStyle: 'italic',
      })
      .setOrigin(0.5);

    // Options
    const optionLabels = ['A', 'B', 'C', 'D'];
    const startY = 310;
    const optH = 55;
    const optW = 400;

    this.card.options.forEach((opt, i) => {
      const y = startY + i * (optH + 10);
      const bg = this.add.rectangle(cx, y, optW, optH, COLORS.darkNavy, 0.8).setInteractive({ useHandCursor: true });
      const border = this.add.graphics();
      border.lineStyle(1, COLORS.textDark, 0.4);
      border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6);

      this.add.text(cx - optW / 2 + 20, y, optionLabels[i], { fontSize: '18px', fontFamily: FONT.title, color: HEX.green }).setOrigin(0, 0.5);
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
        this.timerEvent?.destroy();
        const correct = i === this.card.answerIndex;
        const color = correct ? COLORS.green : COLORS.crimson;
        border.clear(); border.lineStyle(3, color, 1); border.strokeRoundedRect(cx - optW / 2, y - optH / 2, optW, optH, 6);
        bg.setFillStyle(color, 0.3);
        this.showResult(correct);
      });
    });

    // Start timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: TIMER_SECONDS - 1,
      callback: () => {
        this.timeLeft--;
        this.timerText?.setText(`${this.timeLeft}`);
        this.timerGfx?.destroy();
        this.timerGfx = drawTimerRing(this, cx, 100, 25, this.timeLeft / TIMER_SECONDS);
        if (this.timeLeft <= 5) {
          this.timerText?.setColor(HEX.crimson);
          playTick();
        }
        if (this.timeLeft <= 0 && !this.answered) {
          this.answered = true;
          this.showResult(false);
        }
      },
    });
  }

  private showResult(correct: boolean): void {
    const cx = this.scale.width / 2;
    const player = getCurrentPlayer();

    if (correct) {
      playCorrect();
      awardPoints(player.id, 1, 'flashback', true);
      spawnConfetti(this, cx, 400);
      scorePopAnimation(this, cx, 350, '+1');
    } else {
      playWrong();
      awardPoints(player.id, 0, 'flashback', false);
    }

    const resultText = correct ? 'CORRECT! ✅' : (this.timeLeft <= 0 ? 'TIME\'S UP! ⏰' : 'WRONG! ❌');
    this.add.text(cx, 610, resultText, { fontSize: '28px', fontFamily: FONT.title, color: correct ? HEX.green : HEX.crimson }).setOrigin(0.5);

    if (this.card.explanation) {
      this.add.text(cx, 645, t(this.card.explanation), { fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted, wordWrap: { width: 400 }, align: 'center' }).setOrigin(0.5);
    }

    advancePlayer();
    createButton(this, this.scale.width / 2, 720, isGameOver() ? 'SEE RESULTS' : 'NEXT', () => {
      this.scene.start(isGameOver() ? 'FinalResultScene' : 'GameplayScene');
    }, { fontSize: '22px', paddingX: 24, paddingY: 10 });
  }
}
