import Phaser from 'phaser';
import { initGame } from '../GameState';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = +this.scale.width / 2;
    const cy = +this.scale.height / 2;

    // Title
    this.add
      .text(cx, 120, '⚽ KORAISTA', {
        fontSize: '48px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#e94560',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 180, 'All is fair in war, love… and football.', {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#a0a0c0',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    // Player name inputs (simple — use default names for now)
    const p1Name = 'Player 1';
    const p2Name = 'Player 2';

    // Mode selector
    this.add
      .text(cx, cy - 40, 'PENALTY SHOOTOUT', {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy, 'Best of 5 · Pass & Play', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#a0a0c0',
      })
      .setOrigin(0.5);

    // Play button
    const btn = this.add
      .text(cx, cy + 80, '▶  PLAY', {
        fontSize: '32px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#0f3460',
        backgroundColor: '#e94560',
        padding: { x: 32, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ color: '#ffffff' }));
    btn.on('pointerout', () => btn.setStyle({ color: '#0f3460' }));
    btn.on('pointerdown', () => {
      initGame(p1Name, p2Name, 5);
      this.scene.start('PenaltyScene');
    });

    // Coming soon modes
    const modes = ['RANK', 'HEADLINE', 'HOME / AWAY', 'FLASHBACK', 'VAR'];
    modes.forEach((mode, i) => {
      this.add
        .text(cx, cy + 180 + i * 36, mode, {
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif',
          color: '#555580',
        })
        .setOrigin(0.5);
    });

    this.add
      .text(cx, cy + 180 + modes.length * 36 + 8, '(coming soon)', {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#333355',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
  }
}
