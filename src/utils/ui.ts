import Phaser from 'phaser';
import { HEX, FONT, COLORS } from './theme';

/** Reusable UI component helpers for Phaser scenes */

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options?: {
    fontSize?: string;
    bgColor?: string;
    textColor?: string;
    paddingX?: number;
    paddingY?: number;
  },
): Phaser.GameObjects.Text {
  const {
    fontSize = '26px',
    bgColor = HEX.crimson,
    textColor = HEX.navy,
    paddingX = 28,
    paddingY = 12,
  } = options ?? {};

  const btn = scene.add
    .text(x, y, label, {
      fontSize,
      fontFamily: FONT.title,
      color: textColor,
      backgroundColor: bgColor,
      padding: { x: paddingX, y: paddingY },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  btn.setShadow(0, 6, 'rgba(0,0,0,0.35)', 10, false, true);
  btn.on('pointerover', () => btn.setStyle({ color: HEX.white }));
  btn.on('pointerout', () => btn.setStyle({ color: textColor }));
  btn.on('pointerdown', onClick);

  return btn;
}

export function createTitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  fontSize = '32px',
  color = HEX.crimson,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontSize,
      fontFamily: FONT.title,
      color,
    })
    .setOrigin(0.5);
}

export function createSubtitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  fontSize = '14px',
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontSize,
      fontFamily: FONT.body,
      color: HEX.textMuted,
      fontStyle: 'italic',
    })
    .setOrigin(0.5);
}

/** Draw grass-stripe background */
export function drawGrassBackground(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  const w = scene.scale.width;
  const h = scene.scale.height;
  const stripeH = 40;

  gfx.fillStyle(COLORS.navy, 1);
  gfx.fillRect(0, 0, w, h);

  for (let y = 0; y < h; y += stripeH) {
    const dark = Math.floor(y / stripeH) % 2 === 0;
    gfx.fillStyle(dark ? COLORS.grassDark : COLORS.grassGreen, 0.22);
    gfx.fillRect(0, y, w, stripeH);
  }

  gfx.lineStyle(2, COLORS.white, 0.08);
  gfx.strokeCircle(w / 2, h * 0.56, 78);
  gfx.lineBetween(w / 2, 0, w / 2, h);
  gfx.strokeRect(w * 0.16, h * 0.14, w * 0.68, h * 0.72);

  gfx.fillStyle(COLORS.white, 0.05);
  gfx.fillEllipse(w / 2, 40, w * 0.95, 90);
  gfx.fillEllipse(w / 2, h - 10, w * 0.9, 70);
}

/** Draw top header bar with glow */
export function drawHeaderBar(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  gfx.fillStyle(COLORS.darkNavy, 0.9);
  gfx.fillRect(0, 0, scene.scale.width, 60);
  gfx.fillStyle(COLORS.white, 0.04);
  gfx.fillRect(0, 0, scene.scale.width, 3);
  // Subtle bottom glow
  gfx.fillStyle(COLORS.crimson, 0.3);
  gfx.fillRect(0, 58, scene.scale.width, 2);
}

export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  accent = COLORS.crimson,
  alpha = 0.88,
): Phaser.GameObjects.Rectangle {
  const panel = scene.add.rectangle(x, y, width, height, COLORS.darkNavy, alpha);
  panel.setStrokeStyle(2, accent, 0.45);
  return panel;
}

export function createPill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  color = HEX.gold,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, label, {
    fontSize: '11px',
    fontFamily: FONT.title,
    color,
    backgroundColor: 'rgba(15,27,48,0.88)',
    padding: { x: 10, y: 5 },
  }).setOrigin(0.5);
}

/** Confetti particle burst */
export function spawnConfetti(scene: Phaser.Scene, x: number, y: number): void {
  const colors = [COLORS.crimson, COLORS.cyan, COLORS.gold, COLORS.green, COLORS.white];
  for (let i = 0; i < 30; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const rect = scene.add.rectangle(x, y, 6, 10, color);
    scene.tweens.add({
      targets: rect,
      x: x + Phaser.Math.Between(-150, 150),
      y: y + Phaser.Math.Between(-200, 100),
      angle: Phaser.Math.Between(-360, 360),
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: Phaser.Math.Between(600, 1200),
      ease: 'Cubic.easeOut',
      onComplete: () => rect.destroy(),
    });
  }
}

/** Animate score pop */
export function scorePopAnimation(scene: Phaser.Scene, x: number, y: number, text: string, color = HEX.gold): void {
  const pop = scene.add
    .text(x, y, text, {
      fontSize: '36px',
      fontFamily: FONT.title,
      color,
    })
    .setOrigin(0.5);

  scene.tweens.add({
    targets: pop,
    y: y - 80,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 800,
    ease: 'Cubic.easeOut',
    onComplete: () => pop.destroy(),
  });
}

/** Card flip animation (scale X from 1 → 0, change content, 0 → 1) */
export function cardFlipAnimation(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Container | Phaser.GameObjects.Text,
  onFlipMid: () => void,
  duration = 400,
): void {
  scene.tweens.add({
    targets: target,
    scaleX: 0,
    duration: duration / 2,
    ease: 'Cubic.easeIn',
    onComplete: () => {
      onFlipMid();
      scene.tweens.add({
        targets: target,
        scaleX: 1,
        duration: duration / 2,
        ease: 'Cubic.easeOut',
      });
    },
  });
}

/** Slide-in transition for scene entry */
export function slideIn(scene: Phaser.Scene, direction: 'left' | 'right' | 'up' | 'down' = 'right'): void {
  const cam = scene.cameras.main;
  const offsets: Record<string, { x: number; y: number }> = {
    left: { x: -scene.scale.width, y: 0 },
    right: { x: scene.scale.width, y: 0 },
    up: { x: 0, y: -scene.scale.height },
    down: { x: 0, y: scene.scale.height },
  };
  const off = offsets[direction];
  cam.setScroll(off.x, off.y);
  scene.tweens.add({
    targets: cam,
    scrollX: 0,
    scrollY: 0,
    duration: 400,
    ease: 'Cubic.easeOut',
  });
}

/** Timer ring (circular countdown) */
export function drawTimerRing(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  progress: number, // 0 to 1
): Phaser.GameObjects.Graphics {
  const gfx = scene.add.graphics();
  // Background ring
  gfx.lineStyle(6, COLORS.textDark, 0.3);
  gfx.beginPath();
  gfx.arc(x, y, radius, 0, Math.PI * 2);
  gfx.strokePath();

  // Progress ring
  const color = progress > 0.5 ? COLORS.green : progress > 0.2 ? COLORS.gold : COLORS.crimson;
  gfx.lineStyle(6, color, 1);
  gfx.beginPath();
  gfx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  gfx.strokePath();

  return gfx;
}

/** Get current language preference */
export function getLang(): 'ar' | 'en' {
  try {
    return (localStorage.getItem('koraista_lang') as 'ar' | 'en') || 'ar';
  } catch {
    return 'ar';
  }
}

/** Set language preference */
export function setLang(lang: 'ar' | 'en'): void {
  try {
    localStorage.setItem('koraista_lang', lang);
  } catch {
    // unavailable
  }
}

/** Get localized text */
export function t(text: { ar: string; en: string }): string {
  return text[getLang()];
}
