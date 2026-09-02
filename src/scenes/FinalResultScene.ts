import Phaser from 'phaser';
import { HEX, FONT, COLORS } from '../utils/theme';
import { createButton, createPanel, createPill, drawGrassBackground, slideIn, spawnConfetti } from '../utils/ui';
import { createRematch, getState, getStandings, getTeamScores, getMVP, getReferee, markScene, markSummaryRecorded, resetState } from '../managers/GameState';
import { buildMatchHighlights, getPlayerBadges, getRecentMatches, recordMatch } from '../managers/ProfileManager';
import { playWin, stopCrowdAmbience } from '../managers/SoundManager';

export class FinalResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinalResultScene' });
  }

  create(): void {
    markScene('FinalResultScene');
    drawGrassBackground(this);
    slideIn(this, 'up');

    const cx = this.scale.width / 2;
    const gs = getState();
    const standings = getStandings();
    const mvp = getMVP();
    const referee = getReferee();
    if (!gs.summaryRecorded) {
      recordMatch(gs.players);
      markSummaryRecorded();
    }
    const highlights = buildMatchHighlights(gs.players);
    const recentMatches = getRecentMatches(2);

    // Trophy + confetti
    stopCrowdAmbience();
    playWin();
    this.add.text(cx, 60, '🏆', { fontSize: '64px' }).setOrigin(0.5);
    this.time.delayedCall(300, () => spawnConfetti(this, cx, 60));
    createPill(this, cx, 110, gs.config.questionPool === 'elite' ? 'ELITE MATCH COMPLETE' : 'ALL-STAR MATCH COMPLETE', gs.config.questionPool === 'elite' ? HEX.gold : HEX.cyan);

    // Winner
    if (standings.length > 0) {
      const winner = standings[0];
      const isTeams = gs.config.playMode === 'teams';

      if (isTeams) {
        const teamScores = getTeamScores();
        const winningTeam = teamScores[0];
        this.add
          .text(cx, 140, `${winningTeam.team.name} WINS!`, {
            fontSize: '32px', fontFamily: FONT.title, color: winningTeam.team.color,
          })
          .setOrigin(0.5);
        this.add
          .text(cx, 180, `Score: ${winningTeam.score}`, {
            fontSize: '20px', fontFamily: FONT.body, color: HEX.white,
          })
          .setOrigin(0.5);
      } else {
        const isTie = standings.length > 1 && standings[0].score === standings[1].score;
        this.add
          .text(cx, 140, isTie ? "IT'S A DRAW!" : `${winner.name} WINS!`, {
            fontSize: '32px', fontFamily: FONT.title, color: HEX.crimson,
          })
          .setOrigin(0.5);
      }
    }

    // Standings table
    let y = 230;
    createPanel(this, cx, y + 84, 430, Math.max(170, standings.length * 38 + 56), COLORS.gold, 0.72);
    this.add
      .text(cx, y, 'FINAL STANDINGS', {
        fontSize: '16px', fontFamily: FONT.title, color: HEX.gold,
      })
      .setOrigin(0.5);

    y += 30;
    standings.forEach((player, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const color = i === 0 ? HEX.gold : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : HEX.white;

      this.add
        .text(40, y + i * 35, `${medal}`, { fontSize: '18px' })
        .setOrigin(0, 0.5);

      this.add
        .text(80, y + i * 35, player.name, {
          fontSize: '16px', fontFamily: FONT.body, color,
        })
        .setOrigin(0, 0.5);

      this.add
        .text(this.scale.width - 40, y + i * 35, `${player.score} pts`, {
          fontSize: '16px', fontFamily: FONT.title, color,
        })
        .setOrigin(1, 0.5);

      // Stats
      this.add
        .text(80, y + i * 35 + 14, `✅${player.stats.correct} ❌${player.stats.wrong} 🔥${player.stats.bestStreak}`, {
          fontSize: '10px', fontFamily: FONT.body, color: HEX.textMuted,
        })
        .setOrigin(0, 0.5);

      const badges = getPlayerBadges(player);
      if (badges.length) {
        this.add
          .text(this.scale.width - 40, y + i * 35 + 14, badges.join(' • '), {
            fontSize: '9px',
            fontFamily: FONT.body,
            color: HEX.textMuted,
          })
          .setOrigin(1, 0.5);
      }
    });

    y += standings.length * 35 + 30;

    // MVP
    if (mvp) {
      this.add
        .text(cx, y, `⭐ MVP: ${mvp.name}`, {
          fontSize: '18px', fontFamily: FONT.title, color: HEX.gold,
        })
        .setOrigin(0.5);
      y += 25;
      this.add
        .text(cx, y, `Best streak: ${mvp.stats.bestStreak} | Correct: ${mvp.stats.correct}`, {
          fontSize: '12px', fontFamily: FONT.body, color: HEX.textMuted,
        })
        .setOrigin(0.5);
      y += 40;
    }

    if (referee) {
      this.add
        .text(cx, y, `🟨 Referee: ${referee.name}`, {
          fontSize: '14px',
          fontFamily: FONT.body,
          color: HEX.white,
        })
        .setOrigin(0.5);
      y += 26;
    }

    if (highlights.length) {
      this.add
        .text(cx, y, 'MATCH HIGHLIGHTS', {
          fontSize: '13px',
          fontFamily: FONT.title,
          color: HEX.cyan,
        })
        .setOrigin(0.5);
      y += 18;
      highlights.forEach((highlight) => {
        this.add
          .text(cx, y, `${highlight.title}: ${highlight.value}`, {
            fontSize: '11px',
            fontFamily: FONT.body,
            color: HEX.white,
          })
          .setOrigin(0.5);
        y += 16;
      });
      y += 10;
    }

    if (recentMatches[1]) {
      this.add
        .text(cx, y, `Previous winner: ${recentMatches[1].winnerName ?? 'Draw'}`, {
          fontSize: '11px',
          fontFamily: FONT.body,
          color: HEX.textMuted,
        })
        .setOrigin(0.5);
      y += 24;
    }

    // Game summary
    this.add
      .text(cx, y, `Cards played: ${gs.cardsPlayed} • ${gs.config.playMode === 'teams' ? 'Team mode' : 'Solo rivals'} • ${gs.config.questionPool === 'elite' ? 'Elite pool' : 'Full pool'}`, {
        fontSize: '13px', fontFamily: FONT.body, color: HEX.textMuted,
        wordWrap: { width: 410 },
        align: 'center',
      })
      .setOrigin(0.5);

    // Buttons
    y += 50;
    createButton(this, cx, y, '🔄 PLAY AGAIN', () => {
      createRematch();
      this.scene.start('LobbyScene', { editions: gs.config.editions });
    }, { fontSize: '24px', paddingX: 28, paddingY: 12 });

    createButton(this, cx, y + 70, '🏠 MAIN MENU', () => {
      resetState();
      this.scene.start('MainMenuScene');
    }, { fontSize: '18px', paddingX: 20, paddingY: 8, bgColor: '#333355', textColor: HEX.white });
  }
}
