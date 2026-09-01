import Phaser from 'phaser';
import { getState, resetState } from '../GameState';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const gs = getState();
    const p1 = gs.players[0];
    const p2 = gs.players[1];

    const winner =
      p1.score > p2.score ? p1.name : p2.score > p1.score ? p2.name : null;

    // Trophy / Draw
    this.add
      .text(cx, 120, winner ? '🏆' : '🤝', { fontSize: '72px' })
      .setOrigin(0.5);

    this.add
      .text(cx, 220, winner ? `${winner} WINS!` : "IT'S A DRAW!", {
        fontSize: '36px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#e94560',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 290, `${p1.name}  ${p1.score} – ${p2.score}  ${p2.name}`, {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Replay
    const btn = this.add
      .text(cx, 400, '🔄  PLAY AGAIN', {
        fontSize: '26px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#0f3460',
        backgroundColor: '#e94560',
        padding: { x: 28, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      resetState();
      this.scene.start('MenuScene');
    });

    // Menu
    const menuBtn = this.add
      .text(cx, 480, 'MAIN MENU', {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#a0a0c0',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      resetState();
      this.scene.start('MainMenuScene');
    });
  }
}
