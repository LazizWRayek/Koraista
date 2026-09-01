import Phaser from 'phaser';
import { SplashScene } from './scenes/SplashScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { LobbyScene } from './scenes/LobbyScene';
import { GameplayScene } from './scenes/GameplayScene';
import { FinalResultScene } from './scenes/FinalResultScene';
import { RankCardScene } from './scenes/cards/RankCardScene';
import { HeadlineCardScene } from './scenes/cards/HeadlineCardScene';
import { HomeAwayCardScene } from './scenes/cards/HomeAwayCardScene';
import { FlashbackCardScene } from './scenes/cards/FlashbackCardScene';
import { VARCardScene } from './scenes/cards/VARCardScene';
import { PenaltyCardScene } from './scenes/cards/PenaltyCardScene';
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
  scene: [
    SplashScene,
    MainMenuScene,
    LobbyScene,
    GameplayScene,
    FinalResultScene,
    RankCardScene,
    HeadlineCardScene,
    HomeAwayCardScene,
    FlashbackCardScene,
    VARCardScene,
    PenaltyCardScene,
    MenuScene,
    PenaltyScene,
    ResultScene,
  ],
};

new Phaser.Game(config);
