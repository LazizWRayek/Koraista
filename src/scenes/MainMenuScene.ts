import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../utils/theme';
import { createButton, drawGrassBackground, slideIn, getLang, setLang } from '../utils/ui';
import { initAudio, playTap, startCrowdAmbience, isMuted, toggleMute, updateCrowdVolume } from '../managers/SoundManager';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const cx = this.scale.width / 2;

    initAudio();
    startCrowdAmbience();

    this.cameras.main.fadeIn(300);
    drawGrassBackground(this);
    slideIn(this, 'up');

    // Title
    this.add
      .text(cx, 80, '⚽ KORAISTA', {
        fontSize: '44px',
        fontFamily: FONT.title,
        color: HEX.crimson,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 135, 'All is fair in war, love… and football.', {
        fontSize: '13px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    // Edition cards
    const kickoffY = 220;
    this.drawEditionCard(cx, kickoffY, 'THE KICKOFF', 'النسخة الأولى', ['RANK', 'HEADLINE', 'HOME/AWAY'], () => {
      this.scene.start('LobbyScene', { editions: ['kickoff'] });
    });

    const secondY = 380;
    this.drawEditionCard(cx, secondY, 'THE SECOND HALF', 'النسخة التانية', ['FLASHBACK', 'VAR', 'PENALTY'], () => {
      this.scene.start('LobbyScene', { editions: ['secondhalf'] });
    });

    // Mix mode
    createButton(this, cx, 530, '🔥  MIX MODE', () => {
      this.scene.start('LobbyScene', { editions: ['kickoff', 'secondhalf'] });
    }, { fontSize: '22px', paddingX: 24, paddingY: 10 });

    this.add
      .text(cx, 570, 'All card types combined!', {
        fontSize: '12px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);

    // Penalty Shootout (legacy mode)
    const penaltyBtn = this.add
      .text(cx, 630, '⚽ PENALTY SHOOTOUT', {
        fontSize: '18px',
        fontFamily: FONT.body,
        color: HEX.cyan,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    penaltyBtn.on('pointerover', () => penaltyBtn.setColor(HEX.white));
    penaltyBtn.on('pointerout', () => penaltyBtn.setColor(HEX.cyan));
    penaltyBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Language toggle
    const lang = getLang();
    const langBtn = this.add
      .text(this.scale.width - 20, this.scale.height - 30, lang === 'ar' ? '🌐 EN' : '🌐 عربي', {
        fontSize: '14px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    langBtn.on('pointerdown', () => {
      setLang(lang === 'ar' ? 'en' : 'ar');
      this.scene.restart();
    });

    // Settings gear
    const settingsBtn = this.add
      .text(20, this.scale.height - 30, isMuted() ? '🔇' : '🔊', {
        fontSize: '22px',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    settingsBtn.on('pointerdown', () => {
      playTap();
      toggleMute();
      updateCrowdVolume();
      settingsBtn.setText(isMuted() ? '🔇' : '🔊');
    });

    // Version
    this.add
      .text(cx, this.scale.height - 15, 'v1.0 — The Kickoff + The Second Half', {
        fontSize: '10px',
        fontFamily: FONT.body,
        color: '#333355',
      })
      .setOrigin(0.5);
  }

  private drawEditionCard(
    x: number,
    y: number,
    title: string,
    subtitle: string,
    modes: string[],
    onClick: () => void,
  ): void {
    const w = 360;
    const h = 120;

    // Card background
    const bg = this.add.rectangle(x, y, w, h, COLORS.darkNavy, 0.8).setInteractive({ useHandCursor: true });
    const border = this.add.graphics();
    border.lineStyle(2, COLORS.crimson, 0.5);
    border.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    this.add
      .text(x, y - 30, title, {
        fontSize: '22px',
        fontFamily: FONT.title,
        color: HEX.crimson,
      })
      .setOrigin(0.5);

    this.add
      .text(x, y - 5, subtitle, {
        fontSize: '14px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 25, modes.join('  •  '), {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.gold,
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => {
      border.clear();
      border.lineStyle(2, COLORS.gold, 0.8);
      border.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    });
    bg.on('pointerout', () => {
      border.clear();
      border.lineStyle(2, COLORS.crimson, 0.5);
      border.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    });
    bg.on('pointerdown', onClick);
  }
}
