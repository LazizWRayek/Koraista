import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../utils/theme';
import { initAudio, playWhistle } from '../managers/SoundManager';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    // Initialize audio on first scene (needs user gesture context)
    this.input.once('pointerdown', () => {
      initAudio();
    });
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Dark background
    this.cameras.main.setBackgroundColor(COLORS.darkNavy);

    // Ball emoji — starts big and shrinks in
    const ball = this.add
      .text(cx, cy - 60, '⚽', { fontSize: '1px' })
      .setOrigin(0.5)
      .setAlpha(0);

    // Title — fades in after ball
    const title = this.add
      .text(cx, cy + 40, 'KORAISTA', {
        fontSize: '52px',
        fontFamily: FONT.title,
        color: HEX.crimson,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Tagline
    const tagline = this.add
      .text(cx, cy + 100, 'All is fair in war, love… and football.', {
        fontSize: '14px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Animation sequence
    // 1. Ball pops in
    this.tweens.add({
      targets: ball,
      alpha: 1,
      duration: 300,
      delay: 200,
      onStart: () => ball.setFontSize(72),
    });

    this.tweens.add({
      targets: ball,
      scaleX: { from: 3, to: 1 },
      scaleY: { from: 3, to: 1 },
      duration: 500,
      delay: 200,
      ease: 'Back.easeOut',
    });

    // 2. Title slides up
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: cy + 30,
      duration: 500,
      delay: 600,
      ease: 'Cubic.easeOut',
    });

    // 3. Tagline fades in
    this.tweens.add({
      targets: tagline,
      alpha: 1,
      duration: 400,
      delay: 1000,
    });

    // Floodlight glow lines
    const gfx = this.add.graphics();
    this.time.delayedCall(800, () => {
      gfx.lineStyle(2, COLORS.gold, 0.15);
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const fromX = cx + Math.cos(angle) * 40;
        const fromY = (cy - 60) + Math.sin(angle) * 40;
        const toX = cx + Math.cos(angle) * 250;
        const toY = (cy - 60) + Math.sin(angle) * 250;
        gfx.lineBetween(fromX, fromY, toX, toY);
      }
      this.tweens.add({
        targets: gfx,
        alpha: { from: 0, to: 0.4 },
        duration: 600,
      });
    });

    // 4. Transition to MainMenu
    this.time.delayedCall(1800, () => playWhistle());
    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });

    // Tap to skip
    this.input.once('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
