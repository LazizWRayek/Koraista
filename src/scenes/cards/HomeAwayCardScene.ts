import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../../utils/theme';
import { createButton, createPanel, createPill, drawGrassBackground, drawHeaderBar, slideIn, scorePopAnimation, spawnConfetti, t } from '../../utils/ui';
import { getCurrentPlayer, getReferee, getState, awardPoints, advancePlayer, isGameOver } from '../../managers/GameState';
import { getCardManager } from '../GameplayScene';
import { playCorrect, playWrong } from '../../managers/SoundManager';
import type { HomeAwayCard } from '../../data/types';

export class HomeAwayCardScene extends Phaser.Scene {
  private card!: HomeAwayCard;
  private choice: 'home' | 'away' | null = null;
  private answered = false;

  constructor() {
    super({ key: 'HomeAwayCardScene' });
  }

  create(): void {
    const card = getCardManager().draw('homeaway');
    if (!card || card.type !== 'homeaway') {
      this.scene.start('GameplayScene');
      return;
    }
    this.card = card;
    this.choice = null;
    this.answered = false;

    this.showChoiceScreen();
  }

  private showChoiceScreen(): void {
    this.children.removeAll(true);
    drawGrassBackground(this);
    drawHeaderBar(this);
    slideIn(this, 'right');

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const player = getCurrentPlayer();

    this.add
      .text(cx, 20, '🏟️ HOME / AWAY', { fontSize: '18px', fontFamily: FONT.title, color: HEX.gold })
      .setOrigin(0.5);
    this.add
      .text(cx, 45, player.name, { fontSize: '14px', fontFamily: FONT.body, color: HEX.gold })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 120, 'Choose your ground!', {
        fontSize: '24px', fontFamily: FONT.title, color: HEX.white,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 80, 'Pick before you see the question — no backing out!', {
        fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted, fontStyle: 'italic',
      })
      .setOrigin(0.5);

    // Home button
    const homeW = 180;
    const homeH = 140;
    const homeX = cx - 100;
    const homeY = cy + 20;

    const homeBg = this.add
      .rectangle(homeX, homeY, homeW, homeH, COLORS.grassGreen, 0.6)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, COLORS.green, 0.8)
      .strokeRoundedRect(homeX - homeW / 2, homeY - homeH / 2, homeW, homeH, 10);

    this.add.text(homeX, homeY - 30, '🏠', { fontSize: '36px' }).setOrigin(0.5);
    this.add.text(homeX, homeY + 15, 'HOME', { fontSize: '20px', fontFamily: FONT.title, color: HEX.green }).setOrigin(0.5);
    this.add.text(homeX, homeY + 40, 'Easier · 1 pt', { fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted }).setOrigin(0.5);

    homeBg.on('pointerdown', () => {
      this.choice = 'home';
      this.showQuestion();
    });

    // Away button
    const awayX = cx + 100;
    const awayBg = this.add
      .rectangle(awayX, homeY, homeW, homeH, COLORS.darkNavy, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, COLORS.crimson, 0.8)
      .strokeRoundedRect(awayX - homeW / 2, homeY - homeH / 2, homeW, homeH, 10);

    this.add.text(awayX, homeY - 30, '✈️', { fontSize: '36px' }).setOrigin(0.5);
    this.add.text(awayX, homeY + 15, 'AWAY', { fontSize: '20px', fontFamily: FONT.title, color: HEX.crimson }).setOrigin(0.5);
    this.add.text(awayX, homeY + 40, 'Harder · 2 pts', { fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted }).setOrigin(0.5);

    awayBg.on('pointerdown', () => {
      this.choice = 'away';
      this.showQuestion();
    });
  }

  private showQuestion(): void {
    this.children.removeAll(true);
    drawGrassBackground(this);
    drawHeaderBar(this);

    const cx = this.scale.width / 2;
    const isHome = this.choice === 'home';
    const player = getCurrentPlayer();
    const points = isHome ? 1 : 2;

    // Header
    const choiceEmoji = isHome ? '🏠' : '✈️';
    const choiceLabel = isHome ? 'HOME' : 'AWAY';
    const choiceColor = isHome ? HEX.green : HEX.crimson;

    this.add
      .text(cx, 20, `${choiceEmoji} ${choiceLabel} — ${points} pt${points > 1 ? 's' : ''}`, {
        fontSize: '18px', fontFamily: FONT.title, color: choiceColor,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 50, player.name, { fontSize: '14px', fontFamily: FONT.body, color: HEX.gold })
      .setOrigin(0.5);

    // Question (card flip animation)
    const question = isHome ? this.card.homeQuestion : this.card.awayQuestion;
    const answer = isHome ? this.card.homeAnswer : this.card.awayAnswer;

    // Card back → flip → reveal
    const cardBg = this.add.rectangle(cx, 200, 400, 150, COLORS.darkNavy, 0.9);
    const cardBorder = this.add.graphics();
    cardBorder.lineStyle(2, Phaser.Display.Color.HexStringToColor(choiceColor).color, 0.6);
    cardBorder.strokeRoundedRect(cx - 200, 125, 400, 150, 10);

    const questionText = this.add
      .text(cx, 200, t(question), {
        fontSize: '18px', fontFamily: FONT.body, color: HEX.white,
        wordWrap: { width: 360 }, align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Flip animation
    this.tweens.add({
      targets: [cardBg, cardBorder],
      scaleX: 0,
      duration: 200,
      delay: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        questionText.setAlpha(1);
        this.tweens.add({
          targets: [cardBg, cardBorder, questionText],
          scaleX: { from: 0, to: 1 },
          duration: 200,
          ease: 'Cubic.easeOut',
        });
      },
    });

    // Reveal answer button
    const revealBtn = createButton(this, cx, 400, '👁️  REVEAL ANSWER', () => {
      revealBtn.destroy();
      this.showAnswer(answer, points);
    }, { fontSize: '20px', paddingX: 20, paddingY: 10, bgColor: choiceColor });
  }

  private showAnswer(answer: { ar: string; en: string }, points: number): void {
    const cx = this.scale.width / 2;

    // Show the answer
    this.add.rectangle(cx, 440, 400, 80, COLORS.darkNavy, 0.9);
    this.add
      .text(cx, 430, 'ANSWER:', { fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted })
      .setOrigin(0.5);
    this.add
      .text(cx, 455, t(answer), {
        fontSize: '18px', fontFamily: FONT.title, color: HEX.gold,
        wordWrap: { width: 360 }, align: 'center',
      })
      .setOrigin(0.5);

    const referee = getState().config.hasReferee ? getReferee() : null;
    if (referee) {
      createPanel(this, cx, 560, 410, 118, COLORS.crimson, 0.78);
      createPill(this, cx, 518, 'REFEREE DECISION', HEX.crimson);
      this.add
        .text(cx, 548, `Pass the phone to ${referee.name}.`, {
          fontSize: '18px',
          fontFamily: FONT.title,
          color: HEX.white,
        })
        .setOrigin(0.5);
      this.add
        .text(cx, 578, 'The referee awards the points after hearing the answer.', {
          fontSize: '11px',
          fontFamily: FONT.body,
          color: HEX.textMuted,
        })
        .setOrigin(0.5);
      createButton(this, cx, 620, '🟨 REF READY', () => this.showRefereeDecision(points, referee.name), {
        fontSize: '18px',
        paddingX: 18,
        paddingY: 8,
      });
      return;
    }

    this.showJudgementButtons(points);
  }

  private showRefereeDecision(points: number, refereeName: string): void {
    const cx = this.scale.width / 2;
    createPanel(this, cx, 690, 410, 118, COLORS.gold, 0.82);
    this.add
      .text(cx, 654, `${refereeName}, make the call.`, {
        fontSize: '18px',
        fontFamily: FONT.title,
        color: HEX.gold,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 680, 'Was the answer good enough for the chosen side?', {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);
    this.showJudgementButtons(points, 710);
  }

  private showJudgementButtons(points: number, y = 560): void {
    const cx = this.scale.width / 2;
    const player = getCurrentPlayer();

    let buttonsHandled = false;
    const correctBtn = createButton(this, cx - 80, y, '✅ CORRECT', () => {
      if (buttonsHandled) return;
      buttonsHandled = true;
      correctBtn.destroy();
      wrongBtn.destroy();
      playCorrect();
      awardPoints(player.id, points, 'homeaway', true);
      spawnConfetti(this, cx, 500);
      scorePopAnimation(this, cx, 500, `+${points}`);
      this.showNext();
    }, { fontSize: '18px', paddingX: 16, paddingY: 8, bgColor: HEX.green });

    const wrongBtn = createButton(this, cx + 80, y, '❌ WRONG', () => {
      if (buttonsHandled) return;
      buttonsHandled = true;
      correctBtn.destroy();
      wrongBtn.destroy();
      playWrong();
      awardPoints(player.id, 0, 'homeaway', false);
      this.showNext();
    }, { fontSize: '18px', paddingX: 16, paddingY: 8, bgColor: HEX.crimson });
  }

  private showNext(): void {
    const cx = this.scale.width / 2;
    advancePlayer();
    const nextLabel = isGameOver() ? 'SEE RESULTS' : 'NEXT';
    createButton(this, cx, 680, nextLabel, () => {
      this.scene.start(isGameOver() ? 'FinalResultScene' : 'GameplayScene');
    }, { fontSize: '22px', paddingX: 24, paddingY: 10 });
  }
}
