import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { PenaltyScene } from './scenes/PenaltyScene';
import { ResultScene } from './scenes/ResultScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#16213e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 854,
  },
  scene: [MenuScene, PenaltyScene, ResultScene],
};

new Phaser.Game(config);
