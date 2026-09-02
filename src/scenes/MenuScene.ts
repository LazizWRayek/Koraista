import Phaser from 'phaser';
import { initGame } from '../GameState';
import { HEX, FONT, COLORS } from '../utils/theme';
import { createButton, createPanel, createPill, drawGrassBackground, slideIn } from '../utils/ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    drawGrassBackground(this);
    slideIn(this, 'right');

    createPill(this, cx, 60, 'CLASSIC SHOOTOUT', HEX.cyan);
    this.add
      .text(cx, 110, '⚽ KORAISTA', {
        fontSize: '48px',
        fontFamily: FONT.title,
        color: HEX.white,
        stroke: HEX.crimson,
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 155, 'All is fair in war, love… and football.', {
        fontSize: '16px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    // Player name inputs (simple — use default names for now)
    const p1Name = 'Player 1';
    const p2Name = 'Player 2';

    createPanel(this, cx, cy - 10, 420, 220, COLORS.cyan, 0.78);
    this.add
      .text(cx, cy - 70, 'PENALTY SHOOTOUT', {
        fontSize: '26px',
        fontFamily: FONT.title,
        color: HEX.white,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 30, 'Best of 5 · Pass & Play', {
        fontSize: '14px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 8, 'Read the kick. Pick the corner. Win the mind game.', {
        fontSize: '16px',
        fontFamily: FONT.title,
        color: HEX.cyan,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 44, 'A fast local duel for two players when you want pure penalty-box drama.', {
        fontSize: '12px',
        fontFamily: FONT.body,
        color: HEX.white,
        wordWrap: { width: 360 },
        align: 'center',
      })
      .setOrigin(0.5);

    // Play button
    createButton(this, cx, cy + 125, '▶  PLAY', () => {
      initGame(p1Name, p2Name, 5);
      this.scene.start('PenaltyScene');
    }, { fontSize: '28px', paddingX: 28, paddingY: 12 });

    this.add
      .text(cx, cy + 178, 'Two players • Shared screen • Instant rematch', {
        fontSize: '12px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);
  }
}
