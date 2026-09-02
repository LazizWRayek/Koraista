import Phaser from 'phaser';
import { getState, resetState } from '../GameState';
import { HEX, FONT, COLORS } from '../utils/theme';
import { createButton, createPanel, createPill, drawGrassBackground, slideIn, spawnConfetti } from '../utils/ui';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const gs = getState();
    const p1 = gs.players[0];
    const p2 = gs.players[1];
    drawGrassBackground(this);
    slideIn(this, 'up');

    const winner =
      p1.score > p2.score ? p1.name : p2.score > p1.score ? p2.name : null;

    if (winner) {
      this.time.delayedCall(250, () => spawnConfetti(this, cx, 110));
    }

    // Trophy / Draw
    this.add
      .text(cx, 105, winner ? '🏆' : '🤝', { fontSize: '72px' })
      .setOrigin(0.5);
    createPill(this, cx, 170, winner ? 'SHOOTOUT CHAMPION' : 'LEVEL SCORE', winner ? HEX.gold : HEX.cyan);

    createPanel(this, cx, 315, 420, 180, winner ? COLORS.gold : COLORS.cyan, 0.78);
    this.add
      .text(cx, 240, winner ? `${winner} WINS!` : "IT'S A DRAW!", {
        fontSize: '36px',
        fontFamily: FONT.title,
        color: winner ? HEX.crimson : HEX.cyan,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 302, `${p1.name}  ${p1.score} – ${p2.score}  ${p2.name}`, {
        fontSize: '22px',
        fontFamily: FONT.body,
        color: HEX.white,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 350, winner ? `${winner} owned the box under pressure.` : 'Nothing separated the keepers or the finishers.', {
        fontSize: '13px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        wordWrap: { width: 360 },
        align: 'center',
      })
      .setOrigin(0.5);

    // Replay
    createButton(this, cx, 445, '🔄  PLAY AGAIN', () => {
      resetState();
      this.scene.start('MenuScene');
    }, { fontSize: '24px', paddingX: 24, paddingY: 10 });

    // Menu
    createButton(this, cx, 515, 'MAIN MENU', () => {
      resetState();
      this.scene.start('MainMenuScene');
    }, { fontSize: '18px', paddingX: 20, paddingY: 8, bgColor: '#333355', textColor: HEX.white });
  }
}
