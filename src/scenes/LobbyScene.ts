import Phaser from 'phaser';
import { HEX, FONT, COLORS, TEAM_COLORS } from '../utils/theme';
import { createButton, createPanel, createPill, drawGrassBackground, slideIn, drawHeaderBar } from '../utils/ui';
import {
  createPlayer,
  createPlayerWithId,
  initGame,
  createDefaultConfig,
  type NetworkMode,
  type PlayMode,
  type QuestionPool,
  type WinCondition,
  type Player,
  type Team,
  type GameConfig,
} from '../managers/GameState';
import { getPlayerProfile } from '../managers/ProfileManager';
import { onlineManager, type OnlineRoomState } from '../managers/OnlineManager';
import type { CardType, Edition } from '../data/types';

interface LobbyData {
  editions: Edition[];
  playerNames?: string[];
  networkMode?: NetworkMode;
  playMode?: PlayMode;
  questionPool?: QuestionPool;
  winCondition?: WinCondition;
  hasReferee?: boolean;
  maxCards?: number;
  maxTime?: number;
  targetScore?: number;
  selectedCardTypes?: CardType[] | null;
}

export class LobbyScene extends Phaser.Scene {
  private networkMode: NetworkMode = 'local';
  private playMode: PlayMode = 'solo';
  private questionPool: QuestionPool = 'elite';
  private winCondition: WinCondition = 'cards';
  private playerNames: string[] = ['Player 1', 'Player 2'];
  private selectedCardTypes: CardType[] | null = null;
  private hasReferee = false;
  private maxCards = 20;
  private maxTime = 300;
  private targetScore = 10;
  private editions: Edition[] = ['kickoff', 'secondhalf'];
  private onlineRoom: OnlineRoomState | null = null;
  private onlineStatus = 'offline';

  constructor() {
    super({ key: 'LobbyScene' });
  }

  private getLobbyData(): LobbyData {
    return {
      editions: this.editions,
      playerNames: [...this.playerNames],
      networkMode: this.networkMode,
      playMode: this.playMode,
      questionPool: this.questionPool,
      winCondition: this.winCondition,
      hasReferee: this.hasReferee,
      maxCards: this.maxCards,
      maxTime: this.maxTime,
      targetScore: this.targetScore,
      selectedCardTypes: this.selectedCardTypes ? [...this.selectedCardTypes] : null,
    };
  }

  init(data: LobbyData): void {
    if (data?.editions) this.editions = data.editions;
    if (data?.playerNames) this.playerNames = data.playerNames;
    if (data?.networkMode) this.networkMode = data.networkMode;
    if (data?.playMode) this.playMode = data.playMode;
    if (data?.questionPool) this.questionPool = data.questionPool;
    if (data?.winCondition) this.winCondition = data.winCondition;
    if (data?.hasReferee !== undefined) this.hasReferee = data.hasReferee;
    if (data?.maxCards !== undefined) this.maxCards = data.maxCards;
    if (data?.maxTime !== undefined) this.maxTime = data.maxTime;
    if (data?.targetScore !== undefined) this.targetScore = data.targetScore;
    if (data?.selectedCardTypes !== undefined) this.selectedCardTypes = data.selectedCardTypes;
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

    let firstRoomSync = true;
    const offRoom = onlineManager.onRoomChange((room) => {
      this.onlineRoom = room;
      if (firstRoomSync) {
        firstRoomSync = false;
        return;
      }
      if (this.scene.isActive()) this.scene.restart(this.getLobbyData());
    });
    const offStatus = onlineManager.onStatus((status) => {
      this.onlineStatus = status;
    });
    const offMatch = onlineManager.onMatchStarted((payload) => {
      initGame(payload.config, payload.players, payload.teams);
      this.scene.start('GameplayScene');
    });
    this.events.once('shutdown', () => {
      offRoom();
      offStatus();
      offMatch();
    });

    this.onlineRoom = onlineManager.getRoom();
    this.onlineStatus = onlineManager.getStatus();

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

    this.addSectionLabel(cx, y, 'MATCH TYPE');
    y += 30;
    this.addToggle(cx, y, ['LOCAL', 'ONLINE'], this.networkMode === 'local' ? 0 : 1, (idx) => {
      this.networkMode = idx === 0 ? 'local' : 'online';
    });
    createPill(this, cx, y + 34, this.networkMode === 'local' ? 'PASS & PLAY' : 'ROOM-CODE LOBBY', this.networkMode === 'local' ? HEX.cyan : HEX.gold);

    // Play mode toggle
    y += 62;
    this.addSectionLabel(cx, y, 'MODE');
    y += 30;
    this.addToggle(cx, y, ['SOLO', 'TEAMS'], this.playMode === 'solo' ? 0 : 1, (idx) => {
      this.playMode = idx === 0 ? 'solo' : 'teams';
    });

    createPill(this, cx, y + 34, this.playMode === 'solo' ? 'LOCAL RIVALS' : 'TEAM DERBY', this.playMode === 'solo' ? HEX.cyan : HEX.gold);

    y += 62;
    y = this.networkMode === 'local' ? this.drawLocalPlayers(cx, y) : this.drawOnlineLobby(cx, y);

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
    this.addSectionLabel(cx, y, 'CATEGORIES');
    y += 22;
    y = this.drawCategoryToggles(cx, y);

    y += 14;
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
      if (this.networkMode === 'online' && onlineManager.isHost()) {
        onlineManager.updateConfig(this.buildConfig());
      }
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
      .text(cx, y + 14, `${this.winCondition === 'cards' ? `${this.maxCards} cards` : this.winCondition === 'timed' ? `${Math.floor(this.maxTime / 60)} minute clock` : `Race to ${this.targetScore} points`} • ${this.hasReferee ? 'Referee active' : 'Self-officiated'} • ${this.selectedCardTypes?.length ? this.selectedCardTypes.length : 'All'} categories`, {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
        wordWrap: { width: 390 },
        align: 'center',
      })
      .setOrigin(0.5);

    y += 78;
    createButton(this, cx, y, this.networkMode === 'online' ? '🌐 HOST START MATCH' : '▶  START GAME', () => this.startGame(), {
      fontSize: '28px',
      paddingX: 36,
      paddingY: 14,
    });
  }

  private startGame(): void {
    const config = this.buildConfig();
    const players = this.buildPlayers();
    const teams = this.buildTeams(players);

    if (this.networkMode === 'online') {
      const room = this.onlineRoom;
      const everyoneReady = room && room.players.length >= 2 && room.players.every((player) => player.ready);
      if (!room || !onlineManager.isHost() || !everyoneReady) {
        return;
      }
      onlineManager.startMatch({ config, players, teams });
      return;
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

  private drawLocalPlayers(cx: number, y: number): number {
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
      const profile = getPlayerProfile(this.playerNames[i]);
      const label = this.add
        .text(cx - 90, playerY, `${i + 1}. ${this.playerNames[i]}${this.hasReferee && i === this.playerNames.length - 1 ? '  🟨 REF' : ''}`, {
          fontSize: '16px',
          fontFamily: FONT.body,
          color: HEX.white,
        })
        .setOrigin(0, 0.5);

      if (profile) {
        this.add
          .text(cx + 18, playerY, `${profile.wins}W`, {
            fontSize: '10px',
            fontFamily: FONT.body,
            color: HEX.gold,
          })
          .setOrigin(0, 0.5);
      }

      this.add
        .text(cx + 90, playerY, '✏️', { fontSize: '14px' })
        .setOrigin(0.5);

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

      label.setInteractive({ useHandCursor: true });
      label.on('pointerdown', () => {
        const newName = window.prompt('Enter player name:', this.playerNames[i]);
        if (newName && newName.trim().length > 0) {
          this.playerNames[i] = newName.trim().substring(0, 20);
          this.scene.restart(this.getLobbyData());
        }
      });
    }

    y += this.playerNames.length * 35 + 10;

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

    return y;
  }

  private drawOnlineLobby(cx: number, y: number): number {
    this.addSectionLabel(cx, y, 'ONLINE ROOM');
    y += 32;

    createPanel(this, cx, y + 56, 420, 132, COLORS.cyan, 0.74);
    this.add
      .text(cx, y + 18, `Server: ${onlineManager.getDefaultUrl()}`, {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, y + 40, `Status: ${this.onlineStatus}`, {
        fontSize: '12px',
        fontFamily: FONT.body,
        color: this.onlineStatus === 'connected' ? HEX.green : HEX.gold,
      })
      .setOrigin(0.5);

    if (!this.onlineRoom) {
      createButton(this, cx - 90, y + 86, 'CREATE', () => this.createOnlineRoom(), {
        fontSize: '18px',
        paddingX: 16,
        paddingY: 8,
      });
      createButton(this, cx + 90, y + 86, 'JOIN', () => this.joinOnlineRoom(), {
        fontSize: '18px',
        paddingX: 24,
        paddingY: 8,
        bgColor: HEX.cyan,
      });
      return y + 134;
    }

    this.add
      .text(cx, y + 62, `Room code: ${this.onlineRoom.roomCode}`, {
        fontSize: '22px',
        fontFamily: FONT.title,
        color: HEX.white,
      })
      .setOrigin(0.5);

    this.onlineRoom.players.slice(0, 4).forEach((player, index) => {
      this.add
        .text(cx - 165, y + 92 + index * 24, `${index + 1}. ${player.name}`, {
          fontSize: '13px',
          fontFamily: FONT.body,
          color: HEX.white,
        })
        .setOrigin(0, 0.5);
      this.add
        .text(cx + 165, y + 92 + index * 24, `${player.connected ? '🟢' : '⚫'} ${player.ready ? 'READY' : 'WAITING'}${player.id === this.onlineRoom?.hostId ? ' • HOST' : ''}`, {
          fontSize: '10px',
          fontFamily: FONT.body,
          color: player.ready ? HEX.green : HEX.textMuted,
        })
        .setOrigin(1, 0.5);
    });

    createButton(this, cx - 90, y + 156, this.isLocalOnlinePlayerReady() ? 'UNREADY' : 'READY', () => {
      onlineManager.setReady(!this.isLocalOnlinePlayerReady());
    }, {
      fontSize: '16px',
      paddingX: 14,
      paddingY: 8,
      bgColor: this.isLocalOnlinePlayerReady() ? '#333355' : HEX.green,
      textColor: HEX.white,
    });

    createButton(this, cx + 90, y + 156, 'LEAVE', () => {
      onlineManager.leaveRoom();
      this.scene.restart(this.getLobbyData());
    }, {
      fontSize: '16px',
      paddingX: 18,
      paddingY: 8,
      bgColor: '#333355',
      textColor: HEX.white,
    });

    return y + 190;
  }

  private drawCategoryToggles(cx: number, y: number): number {
    const categories: { type: CardType; label: string }[] = [
      { type: 'rank', label: 'RANK' },
      { type: 'headline', label: 'HEADLINE' },
      { type: 'homeaway', label: 'HOME/AWAY' },
      { type: 'flashback', label: 'FLASHBACK' },
      { type: 'var', label: 'VAR' },
      { type: 'penalty', label: 'PENALTY' },
    ];

    const active = this.selectedCardTypes ?? categories.map((entry) => entry.type);
    categories.forEach((category, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = cx + (col === 0 ? -90 : 90);
      const yy = y + row * 30;
      const isActive = active.includes(category.type);
      const chip = this.add
        .text(x, yy, category.label, {
          fontSize: '12px',
          fontFamily: FONT.title,
          color: isActive ? HEX.navy : HEX.textMuted,
          backgroundColor: isActive ? HEX.gold : '#1a1a3e',
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      chip.on('pointerdown', () => {
        this.toggleCardType(category.type);
      });
    });

    this.add
      .text(cx, y + 96, active.length === categories.length ? 'All categories active' : `${active.length} categories selected`, {
        fontSize: '11px',
        fontFamily: FONT.body,
        color: HEX.textMuted,
      })
      .setOrigin(0.5);

    return y + 98;
  }

  private toggleCardType(type: CardType): void {
    const allTypes: CardType[] = ['rank', 'headline', 'homeaway', 'flashback', 'var', 'penalty'];
    const current = [...(this.selectedCardTypes ?? allTypes)];
    const idx = current.indexOf(type);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(type);
    this.selectedCardTypes = current.length === 0 || current.length === allTypes.length ? null : current;
    if (this.networkMode === 'online' && onlineManager.isHost()) {
      onlineManager.updateConfig(this.buildConfig());
    }
    this.scene.restart(this.getLobbyData());
  }

  private buildConfig(): GameConfig {
    return {
      ...createDefaultConfig(),
      networkMode: this.networkMode,
      playMode: this.playMode,
      hasReferee: this.hasReferee,
      questionPool: this.questionPool,
      winCondition: this.winCondition,
      maxCards: this.maxCards,
      maxTime: this.maxTime,
      targetScore: this.targetScore,
      editions: this.editions,
      cardTypes: this.selectedCardTypes,
      deckSeed: Date.now(),
    };
  }

  private buildPlayers(): Player[] {
    const onlinePlayers = this.onlineRoom?.players;
    const players = this.networkMode === 'online' && onlinePlayers?.length
      ? onlinePlayers.map((player) => createPlayerWithId(player.id, player.name))
      : this.playerNames.map((name) => createPlayer(name));

    if (this.hasReferee && players.length > 2) {
      players[players.length - 1].isReferee = true;
    }

    return players;
  }

  private buildTeams(players: Player[]): Team[] {
    if (this.playMode !== 'teams') return [];
    const half = Math.ceil(players.length / 2);
    const teams = [
      {
        id: 't1',
        name: 'Team A',
        color: TEAM_COLORS[0].hex,
        playerIds: players.slice(0, half).map((player) => player.id),
      },
      {
        id: 't2',
        name: 'Team B',
        color: TEAM_COLORS[1].hex,
        playerIds: players.slice(half).map((player) => player.id),
      },
    ];
    players.slice(0, half).forEach((player) => { player.teamId = 't1'; });
    players.slice(half).forEach((player) => { player.teamId = 't2'; });
    return teams;
  }

  private async createOnlineRoom(): Promise<void> {
    const playerName = window.prompt('Enter your name for the online room:', this.playerNames[0]);
    if (!playerName) return;
    this.playerNames[0] = playerName.trim().substring(0, 20);
    await onlineManager.createRoom(this.playerNames[0], this.playMode);
  }

  private async joinOnlineRoom(): Promise<void> {
    const roomCode = window.prompt('Enter room code:');
    if (!roomCode) return;
    const playerName = window.prompt('Enter your player name:', this.playerNames[0]);
    if (!playerName) return;
    this.playerNames[0] = playerName.trim().substring(0, 20);
    await onlineManager.joinRoom(roomCode, this.playerNames[0]);
  }

  private isLocalOnlinePlayerReady(): boolean {
    const playerId = onlineManager.getPlayerId();
    return Boolean(this.onlineRoom?.players.find((player) => player.id === playerId)?.ready);
  }
}
