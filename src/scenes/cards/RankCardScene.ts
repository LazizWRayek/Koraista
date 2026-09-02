import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../../utils/theme';
import { createButton, createPill, drawGrassBackground, drawHeaderBar, slideIn, scorePopAnimation, spawnConfetti, t } from '../../utils/ui';
import { getCurrentPlayer, awardPoints, advancePlayer, isGameOver } from '../../managers/GameState';
import { getCardManager } from '../GameplayScene';
import { playCorrect, playWrong } from '../../managers/SoundManager';
import type { RankCard } from '../../data/types';

export class RankCardScene extends Phaser.Scene {
  private card!: RankCard;
  private playerOrder: number[] = [];
  private slots: Phaser.GameObjects.Container[] = [];
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private selectedIdx = -1;
  private answered = false;

  constructor() {
    super({ key: 'RankCardScene' });
  }

  create(): void {
    const card = getCardManager().draw('rank');
    if (!card || card.type !== 'rank') {
      this.scene.start('GameplayScene');
      return;
    }
    this.card = card;
    this.answered = false;

    // Shuffle the items for the player to sort
    this.playerOrder = Array.from({ length: this.card.items.length }, (_, i) => i);
    this.shuffleArray(this.playerOrder);

    drawGrassBackground(this);
    drawHeaderBar(this);
    slideIn(this, 'right');

    const cx = this.scale.width / 2;
    const player = getCurrentPlayer();

    // Header
    this.add
      .text(cx, 20, `📊 RANK`, {
        fontSize: '18px',
        fontFamily: FONT.title,
        color: HEX.crimson,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 45, player.name, {
        fontSize: '14px',
        fontFamily: FONT.body,
        color: HEX.gold,
      })
      .setOrigin(0.5);
    createPill(this, cx, 70, 'NO FREE HINTS', HEX.crimson);

    // Question
    this.add
      .text(cx, 90, t(this.card.question), {
        fontSize: '16px',
        fontFamily: FONT.body,
        color: HEX.white,
        wordWrap: { width: 420 },
        align: 'center',
      })
      .setOrigin(0.5);

    // Instructions
    this.add
      .text(cx, 135, 'Tap two items to swap their positions', {
        fontSize: '12px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    // Draw sortable items
    this.drawItems();

    // Submit button
    createButton(this, cx, 700, '✓  SUBMIT', () => this.checkAnswer(), {
      fontSize: '22px',
      paddingX: 24,
      paddingY: 10,
      bgColor: HEX.green,
    });
  }

  private drawItems(): void {
    const cx = this.scale.width / 2;
    const startY = 180;
    const itemH = 55;
    const itemW = 400;

    this.slots = [];
    this.itemTexts = [];

    this.playerOrder.forEach((itemIdx, slotIdx) => {
      const y = startY + slotIdx * (itemH + 8);
      const item = this.card.items[itemIdx];

      // Slot number
      this.add
        .text(cx - itemW / 2 - 10, y, `${slotIdx + 1}.`, {
          fontSize: '18px',
          fontFamily: FONT.title,
          color: HEX.gold,
        })
        .setOrigin(1, 0.5);

      // Item background
      const bg = this.add
        .rectangle(cx, y, itemW, itemH, COLORS.darkNavy, 0.8)
        .setInteractive({ useHandCursor: true });

      const border = this.add.graphics();
      border.lineStyle(1, COLORS.textDark, 0.4);
      border.strokeRoundedRect(cx - itemW / 2, y - itemH / 2, itemW, itemH, 6);

      // Item text
      const txt = this.add
        .text(cx, y, this.getDisplayItemText(t(item)), {
          fontSize: '14px',
          fontFamily: FONT.body,
          color: HEX.white,
          wordWrap: { width: itemW - 20 },
          align: 'center',
        })
        .setOrigin(0.5);

      this.itemTexts.push(txt);

      // Click to swap
      bg.on('pointerdown', () => {
        if (this.answered) return;
        if (this.selectedIdx === -1) {
          this.selectedIdx = slotIdx;
          border.clear();
          border.lineStyle(2, COLORS.gold, 1);
          border.strokeRoundedRect(cx - itemW / 2, y - itemH / 2, itemW, itemH, 6);
        } else if (this.selectedIdx === slotIdx) {
          this.selectedIdx = -1;
          border.clear();
          border.lineStyle(1, COLORS.textDark, 0.4);
          border.strokeRoundedRect(cx - itemW / 2, y - itemH / 2, itemW, itemH, 6);
        } else {
          // Swap
          [this.playerOrder[this.selectedIdx], this.playerOrder[slotIdx]] =
            [this.playerOrder[slotIdx], this.playerOrder[this.selectedIdx]];
          this.selectedIdx = -1;
          this.refreshItems();
        }
      });

      const container = this.add.container(0, 0, [bg, border, txt]);
      this.slots.push(container);
    });
  }

  private refreshItems(): void {
    // Remove all items and redraw
    this.children.removeAll(true);

    const cx = this.scale.width / 2;
    const player = getCurrentPlayer();

    drawGrassBackground(this);
    drawHeaderBar(this);

    this.add
      .text(cx, 20, `📊 RANK`, { fontSize: '18px', fontFamily: FONT.title, color: HEX.crimson })
      .setOrigin(0.5);
    this.add
      .text(cx, 45, player.name, { fontSize: '14px', fontFamily: FONT.body, color: HEX.gold })
      .setOrigin(0.5);
    createPill(this, cx, 70, 'NO FREE HINTS', HEX.crimson);
    this.add
      .text(cx, 90, t(this.card.question), {
        fontSize: '16px', fontFamily: FONT.body, color: HEX.white,
        wordWrap: { width: 420 }, align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 135, 'Tap two items to swap their positions', {
        fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted, fontStyle: 'italic',
      })
      .setOrigin(0.5);

    this.drawItems();

    if (!this.answered) {
      createButton(this, cx, 700, '✓  SUBMIT', () => this.checkAnswer(), {
        fontSize: '22px', paddingX: 24, paddingY: 10, bgColor: HEX.green,
      });
    }
  }

  private checkAnswer(): void {
    if (this.answered) return;
    this.answered = true;

    const correct = this.playerOrder.every((itemIdx, slotIdx) => itemIdx === slotIdx);
    const player = getCurrentPlayer();

    if (correct) {
      playCorrect();
      awardPoints(player.id, 1, 'rank', true);
      spawnConfetti(this, this.scale.width / 2, 400);
      scorePopAnimation(this, this.scale.width / 2, 350, '+1');
      this.cameras.main.shake(200, 0.005);
    } else {
      playWrong();
      awardPoints(player.id, 0, 'rank', false);
    }

    const cx = this.scale.width / 2;

    // Show result
    const resultText = correct ? 'CORRECT! ✅' : 'WRONG! ❌';
    const resultColor = correct ? HEX.green : HEX.crimson;

    this.add
      .text(cx, 660, resultText, {
        fontSize: '28px',
        fontFamily: FONT.title,
        color: resultColor,
      })
      .setOrigin(0.5);

    if (!correct && this.card.explanation) {
      this.add
        .text(cx, 695, t(this.card.explanation), {
          fontSize: '12px',
          fontFamily: FONT.body,
          color: HEX.textMuted,
          wordWrap: { width: 400 },
          align: 'center',
        })
        .setOrigin(0.5);
    }

    // Next button
    advancePlayer();
    const nextLabel = isGameOver() ? 'SEE RESULTS' : 'NEXT';
    createButton(this, cx, 760, nextLabel, () => {
      if (isGameOver()) {
        this.scene.start('FinalResultScene');
      } else {
        this.scene.start('GameplayScene');
      }
    }, { fontSize: '22px', paddingX: 24, paddingY: 10 });
  }

  private shuffleArray(arr: number[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private getDisplayItemText(value: string): string {
    return value
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/\s*[–-]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December|يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر).*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
