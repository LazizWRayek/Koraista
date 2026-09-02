import Phaser from 'phaser';
import { HEX, FONT, COLORS, TEAM_COLORS } from '../utils/theme';
import { createButton, createPanel, createPill, drawGrassBackground, slideIn, drawHeaderBar } from '../utils/ui';
import {
  createPlayer,
  initGame,
  createDefaultConfig,
  type PlayMode,
  type QuestionPool,
  type WinCondition,
  type Player,
  type Team,
  type GameConfig,
} from '../managers/GameState';
import type { Edition } from '../data/types';

interface LobbyData {
  editions: Edition[];
  playerNames?: string[];
  playMode?: PlayMode;
  questionPool?: QuestionPool;
  winCondition?: WinCondition;
  hasReferee?: boolean;
  maxCards?: number;
  maxTime?: number;
  targetScore?: number;
}

export class LobbyScene extends Phaser.Scene {
  private playMode: PlayMode = 'solo';
  private questionPool: QuestionPool = 'elite';
  private winCondition: WinCondition = 'cards';
  private playerNames: string[] = ['Player 1', 'Player 2'];
  private hasReferee = false;
  private maxCards = 20;
  private maxTime = 300;
  private targetScore = 10;
  private editions: Edition[] = ['kickoff', 'secondhalf'];

  constructor() {
    super({ key: 'LobbyScene' });
  }

  private getLobbyData(): LobbyData {
    return {
      editions: this.editions,
      playerNames: [...this.playerNames],
      playMode: this.playMode,
      questionPool: this.questionPool,
      winCondition: this.winCondition,
      hasReferee: this.hasReferee,
      maxCards: this.maxCards,
      maxTime: this.maxTime,
      targetScore: this.targetScore,
    };
  }

  init(data: LobbyData): void {
    if (data?.editions) this.editions = data.editions;
    if (data?.playerNames) this.playerNames = data.playerNames;
    if (data?.playMode) this.playMode = data.playMode;
    if (data?.questionPool) this.questionPool = data.questionPool;
    if (data?.winCondition) this.winCondition = data.winCondition;
    if (data?.hasReferee !== undefined) this.hasReferee = data.hasReferee;
    if (data?.maxCards !== undefined) this.maxCards = data.maxCards;
    if (data?.maxTime !== undefined) this.maxTime = data.maxTime;
    if (data?.targetScore !== undefined) this.targetScore = data.targetScore;
  }

  create(): void {
    drawGrassBackground(this);
    drawHeaderBar(this);
    slideIn(this, 'right');

    const cx = this.scale.width / 2;

    // Back button
    const backBtn = this.add
      .text(20, 20, '← BACK', {
        fontSize: '16px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

    this.add
      .text(cx, 30, '⚙️ GAME SETUP', {
        fontSize: '22px',
        fontFamily: FONT.title,
        color: HEX.crimson,
      })
      .setOrigin(0.5);

    this.drawFullUI();
  }

  private drawFullUI(): void {
    const cx = this.scale.width / 2;
    let y = 92;

    createPanel(this, cx, y + 30, 420, 86, COLORS.gold, 0.76);
    this.add
      .text(cx, y + 8, 'Build your dream matchday', {
        fontSize: '20px',
        fontFamily: FONT.title,
        color: HEX.white,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, y + 34, 'Pick the format, crank up the difficulty, then let the ref keep everyone honest.', {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        wordWrap: { width: 380 },
        align: 'center',
      })
      .setOrigin(0.5);
    y += 90;

    // Play mode toggle
    this.addSectionLabel(cx, y, 'MODE');
    y += 30;
    this.addToggle(cx, y, ['SOLO', 'TEAMS'], this.playMode === 'solo' ? 0 : 1, (idx) => {
      this.playMode = idx === 0 ? 'solo' : 'teams';
    });

    createPill(this, cx, y + 34, this.playMode === 'solo' ? 'LOCAL RIVALS' : 'TEAM DERBY', this.playMode === 'solo' ? HEX.cyan : HEX.gold);

    // Player management
    y += 62;
    this.addSectionLabel(cx, y, 'PLAYERS');
    y += 15;
    this.add
      .text(cx, y, '(tap name to edit)', {
        fontSize: '10px',
        fontFamily: FONT.body,
        color: HEX.textDark,
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
    y += 18;

    for (let i = 0; i < this.playerNames.length; i++) {
      const playerY = y + i * 35;
      const label = this.add
        .text(cx - 90, playerY, `${i + 1}. ${this.playerNames[i]}${this.hasReferee && i === this.playerNames.length - 1 ? '  🟨 REF' : ''}`, {
          fontSize: '16px',
          fontFamily: FONT.body,
          color: HEX.white,
        })
        .setOrigin(0, 0.5);

      // Edit icon
      this.add
        .text(cx + 90, playerY, '✏️', { fontSize: '14px' })
        .setOrigin(0.5);

      // Remove button (if more than 2 players)
      if (this.playerNames.length > 2) {
        const removeBtn = this.add
          .text(cx + 120, playerY, '✕', {
            fontSize: '18px',
            color: HEX.crimson,
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        removeBtn.on('pointerdown', () => {
          this.playerNames.splice(i, 1);
          this.scene.restart(this.getLobbyData());
        });
      }

      // Edit name on click — use browser prompt for text input
      label.setInteractive({ useHandCursor: true });
      label.on('pointerdown', () => {
        const newName = window.prompt('Enter player name:', this.playerNames[i]);
        if (newName && newName.trim().length > 0) {
          this.playerNames[i] = newName.trim().substring(0, 20);
          label.setText(`${i + 1}. ${this.playerNames[i]}`);
        }
      });
    }

    y += this.playerNames.length * 35 + 10;

    // Add player button
    if (this.playerNames.length < 8) {
      const addBtn = this.add
        .text(cx, y, '+ ADD PLAYER', {
          fontSize: '14px',
          fontFamily: FONT.body,
          color: HEX.cyan,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      addBtn.on('pointerdown', () => {
        this.playerNames.push(`Player ${this.playerNames.length + 1}`);
        this.scene.restart(this.getLobbyData());
      });
      y += 30;
    }

    // Referee toggle
    y += 10;
    this.addSectionLabel(cx, y, 'REFEREE');
    y += 30;
    this.addToggle(cx, y, ['NO', 'YES'], this.hasReferee ? 1 : 0, (idx) => {
      this.hasReferee = idx === 1;
    });
    this.add
      .text(cx, y + 28, this.hasReferee
        ? 'Last player becomes the local referee for judgment calls.'
        : 'Turn this on to add a neutral ref for reveal-and-judge rounds.', {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);

    y += 56;
    this.addSectionLabel(cx, y, 'QUESTION POOL');
    y += 30;
    this.addToggle(cx, y, ['ALL-STAR', 'ELITE'], this.questionPool === 'all' ? 0 : 1, (idx) => {
      this.questionPool = idx === 0 ? 'all' : 'elite';
    });
    this.add
      .text(cx, y + 28, this.questionPool === 'elite'
        ? 'Elite favors the hard side of the card decks.'
        : 'All-Star mixes the full party-friendly card set.', {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: this.questionPool === 'elite' ? HEX.gold : HEX.textMuted,
      })
      .setOrigin(0.5);

    // Win condition
    y += 58;
    this.addSectionLabel(cx, y, 'WIN CONDITION');
    y += 30;
    const wcLabels = ['CARDS', 'TIMED', 'POINTS'];
    const wcIdx = wcLabels.indexOf(this.winCondition.toUpperCase());
    this.addToggle(cx, y, wcLabels, wcIdx >= 0 ? wcIdx : 0, (idx) => {
      this.winCondition = (['cards', 'timed', 'points'] as WinCondition[])[idx];
    });

    // Win condition value
    y += 40;
    let wcValueText = '';
    if (this.winCondition === 'cards') wcValueText = `${this.maxCards} cards`;
    else if (this.winCondition === 'timed') wcValueText = `${Math.floor(this.maxTime / 60)} min`;
    else wcValueText = `${this.targetScore} pts`;

    const wcValue = this.add
      .text(cx, y, wcValueText, {
        fontSize: '18px',
        fontFamily: FONT.body,
        color: HEX.gold,
      })
      .setOrigin(0.5);

    // +/- buttons
    const minusBtn = this.add
      .text(cx - 80, y, '−', {
        fontSize: '24px',
        fontFamily: FONT.title,
        color: HEX.crimson,
        backgroundColor: '#1a1a3e',
        padding: { x: 10, y: 2 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const plusBtn = this.add
      .text(cx + 80, y, '+', {
        fontSize: '24px',
        fontFamily: FONT.title,
        color: HEX.green,
        backgroundColor: '#1a1a3e',
        padding: { x: 10, y: 2 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const updateValue = () => {
      let text = '';
      if (this.winCondition === 'cards') text = `${this.maxCards} cards`;
      else if (this.winCondition === 'timed') text = `${Math.floor(this.maxTime / 60)} min`;
      else text = `${this.targetScore} pts`;
      wcValue.setText(text);
    };

    minusBtn.on('pointerdown', () => {
      if (this.winCondition === 'cards') this.maxCards = Math.max(5, this.maxCards - 5);
      else if (this.winCondition === 'timed') this.maxTime = Math.max(60, this.maxTime - 60);
      else this.targetScore = Math.max(5, this.targetScore - 5);
      updateValue();
    });

    plusBtn.on('pointerdown', () => {
      if (this.winCondition === 'cards') this.maxCards = Math.min(100, this.maxCards + 5);
      else if (this.winCondition === 'timed') this.maxTime = Math.min(1800, this.maxTime + 60);
      else this.targetScore = Math.min(100, this.targetScore + 5);
      updateValue();
    });

    // Start button
    y += 70;
    createPanel(this, cx, y - 18, 420, 74, COLORS.cyan, 0.74);
    this.add
      .text(cx, y - 34, 'MATCH BRIEF', {
        fontSize: '12px',
        fontFamily: FONT.title,
        color: HEX.cyan,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, y - 10, `${this.playMode === 'solo' ? 'Solo rivals' : 'Two-team showdown'} • ${this.playerNames.length - (this.hasReferee ? 1 : 0)} active players • ${this.questionPool === 'elite' ? 'Elite' : 'All-Star'} pool`, {
        fontSize: '12px',
        fontFamily: FONT.body,
        color: HEX.white,
        wordWrap: { width: 390 },
        align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, y + 14, `${this.winCondition === 'cards' ? `${this.maxCards} cards` : this.winCondition === 'timed' ? `${Math.floor(this.maxTime / 60)} minute clock` : `Race to ${this.targetScore} points`} • ${this.hasReferee ? 'Referee active' : 'Self-officiated'}`, {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        wordWrap: { width: 390 },
        align: 'center',
      })
      .setOrigin(0.5);

    y += 78;
    createButton(this, cx, y, '▶  START GAME', () => this.startGame(), {
      fontSize: '28px',
      paddingX: 36,
      paddingY: 14,
    });
  }

  private startGame(): void {
    const config: GameConfig = {
      ...createDefaultConfig(),
      playMode: this.playMode,
      hasReferee: this.hasReferee,
      questionPool: this.questionPool,
      winCondition: this.winCondition,
      maxCards: this.maxCards,
      maxTime: this.maxTime,
      targetScore: this.targetScore,
      editions: this.editions,
    };

    const players: Player[] = this.playerNames.map((name) => createPlayer(name));
    let teams: Team[] = [];

    if (this.playMode === 'teams') {
      const half = Math.ceil(players.length / 2);
      teams = [
        {
          id: 't1',
          name: 'Team A',
          color: TEAM_COLORS[0].hex,
          playerIds: players.slice(0, half).map((p) => p.id),
        },
        {
          id: 't2',
          name: 'Team B',
          color: TEAM_COLORS[1].hex,
          playerIds: players.slice(half).map((p) => p.id),
        },
      ];
      players.slice(0, half).forEach((p) => (p.teamId = 't1'));
      players.slice(half).forEach((p) => (p.teamId = 't2'));
    }

    if (this.hasReferee && players.length > 2) {
      // Last player becomes referee
      players[players.length - 1].isReferee = true;
    }

    initGame(config, players, teams);
    this.scene.start('GameplayScene');
  }

  private addSectionLabel(x: number, y: number, text: string): void {
    this.add
      .text(x, y, text, {
        fontSize: '12px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        letterSpacing: 2,
      })
      .setOrigin(0.5);
  }

  private addToggle(x: number, y: number, labels: string[], activeIdx: number, onChange: (idx: number) => void): void {
    const gap = 10;
    const totalWidth = labels.length * 90 + (labels.length - 1) * gap;
    const startX = x - totalWidth / 2 + 45;

    labels.forEach((label, i) => {
      const isActive = i === activeIdx;
      const btn = this.add
        .text(startX + i * (90 + gap), y, label, {
          fontSize: '14px',
          fontFamily: FONT.title,
          color: isActive ? HEX.navy : HEX.textMuted,
          backgroundColor: isActive ? HEX.crimson : '#1a1a3e',
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        onChange(i);
        this.scene.restart(this.getLobbyData());
      });
    });
  }
}
