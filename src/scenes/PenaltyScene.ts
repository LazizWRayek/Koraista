import Phaser from 'phaser';
import { getState } from '../GameState';

/**
 * Penalty Shootout – the core mini-game.
 *
 * Flow per turn:
 *  1. Kicker sees a 3×3 grid overlaid on the goal.  They tap a cell to aim.
 *  2. Screen briefly says "Pass to goalkeeper…"
 *  3. Goalkeeper sees the same grid and taps to dive.
 *  4. Result is shown (GOAL! or SAVED!), scores update, next turn.
 *
 * After all rounds (or when the result is mathematically decided) → ResultScene.
 */

const GRID_COLS = 3;
const GRID_ROWS = 3;
const CELL_W = 120;
const CELL_H = 80;

type Phase = 'kicker' | 'handoff' | 'keeper' | 'result';

export class PenaltyScene extends Phaser.Scene {
  private phase: Phase = 'kicker';
  private kickTarget = -1;
  private keeperTarget = -1;
  private turnInRound = 0; // 0 = first player kicks, 1 = second player kicks

  constructor() {
    super({ key: 'PenaltyScene' });
  }

  create(): void {
    this.phase = 'kicker';
    this.kickTarget = -1;
    this.keeperTarget = -1;
    this.showKickerPhase();
  }

  /* ---- UI Builders ---- */

  private clear(): void {
    this.children.removeAll(true);
  }

  private gridOriginX(): number {
    return (this.scale.width - GRID_COLS * CELL_W) / 2;
  }

  private gridOriginY(): number {
    return 300;
  }

  private drawGoalGrid(onCellClick: (idx: number) => void): void {
    const ox = this.gridOriginX();
    const oy = this.gridOriginY();

    // Goal frame
    const gfx = this.add.graphics();
    gfx.lineStyle(4, 0xffffff, 1);
    gfx.strokeRect(ox - 4, oy - 4, GRID_COLS * CELL_W + 8, GRID_ROWS * CELL_H + 8);

    // Net pattern
    gfx.lineStyle(1, 0x556688, 0.3);
    for (let x = ox; x <= ox + GRID_COLS * CELL_W; x += 20) {
      gfx.lineBetween(x, oy, x, oy + GRID_ROWS * CELL_H);
    }
    for (let y = oy; y <= oy + GRID_ROWS * CELL_H; y += 20) {
      gfx.lineBetween(ox, y, ox + GRID_COLS * CELL_W, y);
    }

    // Cells
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const idx = r * GRID_COLS + c;
        const cellX = ox + c * CELL_W;
        const cellY = oy + r * CELL_H;

        const zone = this.add
          .rectangle(cellX + CELL_W / 2, cellY + CELL_H / 2, CELL_W - 4, CELL_H - 4, 0x1a1a3e, 0.4)
          .setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => zone.setFillStyle(0xe94560, 0.5));
        zone.on('pointerout', () => zone.setFillStyle(0x1a1a3e, 0.4));
        zone.on('pointerdown', () => onCellClick(idx));
      }
    }
  }

  private showKickerPhase(): void {
    this.clear();
    this.phase = 'kicker';
    const gs = getState();
    const kicker = gs.players[gs.kickerIndex];

    this.drawHUD();

    this.add
      .text(this.scale.width / 2, 200, `${kicker.name} — KICK!`, {
        fontSize: '26px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#e94560',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 240, 'Tap where you want to shoot', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#a0a0c0',
      })
      .setOrigin(0.5);

    // Ball emoji under goal
    this.add
      .text(this.scale.width / 2, this.gridOriginY() + GRID_ROWS * CELL_H + 50, '⚽', {
        fontSize: '48px',
      })
      .setOrigin(0.5);

    this.drawGoalGrid((idx) => {
      this.kickTarget = idx;
      this.showHandoff();
    });
  }

  private showHandoff(): void {
    this.clear();
    this.phase = 'handoff';
    const gs = getState();
    const keeper = gs.players[1 - gs.kickerIndex];

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 40, `Pass the phone to\n${keeper.name}`, {
        fontSize: '28px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    const btn = this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 60, 'READY', {
        fontSize: '28px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#0f3460',
        backgroundColor: '#e94560',
        padding: { x: 32, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => this.showKeeperPhase());
  }

  private showKeeperPhase(): void {
    this.clear();
    this.phase = 'keeper';
    const gs = getState();
    const keeper = gs.players[1 - gs.kickerIndex];

    this.drawHUD();

    this.add
      .text(this.scale.width / 2, 200, `${keeper.name} — SAVE!`, {
        fontSize: '26px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#53d8fb',
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 240, 'Tap where you want to dive', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#a0a0c0',
      })
      .setOrigin(0.5);

    // Glove emoji
    this.add
      .text(this.scale.width / 2, this.gridOriginY() + GRID_ROWS * CELL_H + 50, '🧤', {
        fontSize: '48px',
      })
      .setOrigin(0.5);

    this.drawGoalGrid((idx) => {
      this.keeperTarget = idx;
      this.resolveTurn();
    });
  }

  private resolveTurn(): void {
    this.clear();
    this.phase = 'result';
    const gs = getState();
    const scored = this.kickTarget !== this.keeperTarget;

    if (scored) {
      gs.players[gs.kickerIndex].score++;
    }

    // Show result cells
    const ox = this.gridOriginX();
    const oy = this.gridOriginY();
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const idx = r * GRID_COLS + c;
        const cellX = ox + c * CELL_W;
        const cellY = oy + r * CELL_H;
        let color = 0x1a1a3e;
        let alpha = 0.3;
        if (idx === this.kickTarget) {
          color = scored ? 0x00cc66 : 0xe94560;
          alpha = 0.7;
        }
        if (idx === this.keeperTarget) {
          color = 0x53d8fb;
          alpha = 0.6;
        }
        this.add.rectangle(cellX + CELL_W / 2, cellY + CELL_H / 2, CELL_W - 4, CELL_H - 4, color, alpha);
        if (idx === this.kickTarget) {
          this.add.text(cellX + CELL_W / 2, cellY + CELL_H / 2, '⚽', { fontSize: '28px' }).setOrigin(0.5);
        }
        if (idx === this.keeperTarget) {
          this.add.text(cellX + CELL_W / 2, cellY + CELL_H / 2, '🧤', { fontSize: '28px' }).setOrigin(0.5);
        }
      }
    }

    const resultText = scored ? 'GOAL! 🎉' : 'SAVED! 🛡️';
    const resultColor = scored ? '#00cc66' : '#e94560';

    this.add
      .text(this.scale.width / 2, 180, resultText, {
        fontSize: '42px',
        fontFamily: 'Arial Black, sans-serif',
        color: resultColor,
      })
      .setOrigin(0.5);

    // Camera shake for goal
    if (scored) {
      this.cameras.main.shake(300, 0.01);
    }

    this.drawHUD();

    // Advance
    this.turnInRound++;

    // Each round has 2 kicks (each player kicks once)
    if (this.turnInRound >= 2) {
      this.turnInRound = 0;
      gs.currentRound++;
    }
    gs.kickerIndex = 1 - gs.kickerIndex;

    const gameOver = this.isGameOver(gs);

    const nextLabel = gameOver ? 'SEE RESULTS' : 'NEXT';
    const btn = this.add
      .text(this.scale.width / 2, this.gridOriginY() + GRID_ROWS * CELL_H + 80, nextLabel, {
        fontSize: '26px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#0f3460',
        backgroundColor: '#e94560',
        padding: { x: 28, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      if (gameOver) {
        this.scene.start('ResultScene');
      } else {
        this.showKickerPhase();
      }
    });
  }

  private isGameOver(gs: ReturnType<typeof getState>): boolean {
    if (gs.currentRound > gs.maxRounds) return true;
    // Early win: if the gap is insurmountable
    const remaining = (gs.maxRounds - gs.currentRound) * 2 + (this.turnInRound === 0 ? 2 : 1);
    const diff = Math.abs(gs.players[0].score - gs.players[1].score);
    return diff > remaining;
  }

  private drawHUD(): void {
    const gs = getState();
    const p1 = gs.players[0];
    const p2 = gs.players[1];

    this.add
      .text(20, 20, `${p1.name}: ${p1.score}`, {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#e94560',
      });

    this.add
      .text(this.scale.width - 20, 20, `${p2.name}: ${p2.score}`, {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#53d8fb',
      })
      .setOrigin(1, 0);

    this.add
      .text(this.scale.width / 2, 20, `Round ${Math.min(gs.currentRound, gs.maxRounds)} / ${gs.maxRounds}`, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#a0a0c0',
      })
      .setOrigin(0.5, 0);
  }
}
