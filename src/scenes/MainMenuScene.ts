import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../utils/theme';
import { createButton, createPanel, createPill, drawGrassBackground, slideIn, getLang, setLang } from '../utils/ui';
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

    createPill(this, cx, 52, 'MATCHDAY EDITION', HEX.gold);

    this.add
      .text(cx, 95, '⚽ KORAISTA', {
        fontSize: '48px',
        fontFamily: FONT.title,
        color: HEX.white,
        stroke: HEX.crimson,
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 148, 'All is fair in war, love… and football.', {
        fontSize: '13px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    createPanel(this, cx, 208, 410, 62, COLORS.gold, 0.72);
    this.add
      .text(cx, 192, 'Sharper questions. Team rivalries. Referee drama.', {
        fontSize: '16px',
        fontFamily: FONT.title,
        color: HEX.gold,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 220, 'Build a premium local match with elite trivia and social chaos.', {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.white,
      })
      .setOrigin(0.5);

    // Edition cards
    const kickoffY = 325;
    this.drawEditionCard(cx, kickoffY, 'THE KICKOFF', 'النسخة الأولى', ['RANK', 'HEADLINE', 'HOME/AWAY'], () => {
      this.scene.start('LobbyScene', { editions: ['kickoff'] });
    });

    const secondY = 485;
    this.drawEditionCard(cx, secondY, 'THE SECOND HALF', 'النسخة التانية', ['FLASHBACK', 'VAR', 'PENALTY'], () => {
      this.scene.start('LobbyScene', { editions: ['secondhalf'] });
    });

    // Mix mode
    createButton(this, cx, 642, '🔥  MIX MODE', () => {
      this.scene.start('LobbyScene', { editions: ['kickoff', 'secondhalf'] });
    }, { fontSize: '22px', paddingX: 24, paddingY: 10 });

    this.add
      .text(cx, 680, 'All card types combined!', {
        fontSize: '12px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);

    // Penalty Shootout (legacy mode)
    const penaltyBtn = this.add
      .text(cx, 730, '⚽ PENALTY SHOOTOUT', {
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
    const h = 132;

    // Card background
    const bg = createPanel(this, x, y, w, h, COLORS.crimson, 0.82).setInteractive({ useHandCursor: true });
    const border = this.add.graphics();
    border.lineStyle(2, COLORS.crimson, 0.5);
    border.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    this.add
      .text(x, y - 38, title, {
        fontSize: '22px',
        fontFamily: FONT.title,
        color: HEX.white,
      })
      .setOrigin(0.5);

    this.add
      .text(x, y - 8, subtitle, {
        fontSize: '14px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 24, modes.join('  •  '), {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.gold,
      })
      .setOrigin(0.5);

    createPill(this, x, y + 47, 'ELITE LOBBY READY', HEX.cyan);

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
