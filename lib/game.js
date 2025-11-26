import render from './util/render';
import input from './util/input';
import animation from './util/animation';
import movement from './util/movement';
import physics from './util/physics';

import { levelOne } from './map/level_1-1';
import MapBuilder from './map/map_builder';

import Mario from './entities/mario';
import Goomba from './entities/goomba';
import Koopa from './entities/koopa';
import Score from './entities/score';
import * as Scenery from './entities/scenery';


// todos: animate blocks. mario duck/run. enemy collisions

class Game {
  constructor() {
    this.gameLoopRunning = false;
    this.audioStarted = false;
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
  }

  init() {
    const canvasEl = document.getElementById('game-canvas');
    const ctx = canvasEl.getContext('2d');

    if (window && window.IS_MOBILE_BLOCKED) {
      console.warn('Mobile browser detected. Game loop halted.');
      return;
    }

    // Prevent multiple game loops
    if (this.gameLoopRunning) {
      console.warn('Game loop already running. Skipping initialization.');
      return;
    }

    ctx.scale(3, 3);

    const canvas = {
      canvas: canvasEl,
      ctx,
    };

    const viewport = {
      width: 760,
      height: 600,
      vX: 0,
      vY: 0,
    };

    const backgroundMusic = document.getElementById('background_music');

    // Start audio after user interaction
    const startAudio = () => {
      if (!this.audioStarted && backgroundMusic) {
        backgroundMusic.play().catch((err) => {
          console.warn('Audio autoplay prevented:', err);
        });
        this.audioStarted = true;
      }
    };

    // Try to start audio on any user interaction
    const userInteractionEvents = ['click', 'keydown', 'touchstart'];
    userInteractionEvents.forEach((eventType) => {
      document.addEventListener(eventType, startAudio, { once: true });
    });

    // Add mute button
    this.muted = false;

    document.getElementById('mute-button').addEventListener('click', (e) => {
      backgroundMusic.muted = !backgroundMusic.muted;
      if (this.muted) {
        this.muted = false;
        e.target.className = '';
      } else {
        this.muted = true;
        e.target.className += 'muted';
      }
      e.preventDefault();
      startAudio(); // Also start audio on mute button click
    }, false);

    const spriteSheet = new Image();
    spriteSheet.src = './assets/sprites/jihadospritesheet.png';

    const marioSprite = new Image();
    marioSprite.src = './assets/sprites/MiniAndJihadio.svg';

    const tileset = new Image();
    tileset.src = './assets/sprites/tileset_gutter.png';

    spriteSheet.addEventListener('load', () => {
      const data = {
        spriteSheet,
        canvas,
        viewport,
        animationFrame: 0,
        mapBuilder: new MapBuilder(levelOne, tileset, spriteSheet),
        entities: {},
        sounds: {
          backgroundMusic,
          breakSound: new Audio('./assets/audio/sounds/break_block.wav'),
          levelFinish: new Audio('./assets/audio/music/level_complete.mp3'),
        },
        userControl: true,
        reset: this.reset,
      };

      const mario = new Mario(marioSprite, 175, 0, 30, 40);
      const score = new Score(270, 15);

      input.init(data);
      data.entities.mario = mario;
      data.entities.score = score;
      data.entities.coins = [];
      data.entities.mushrooms = [];
      data.entities.goombas = [];
      data.entities.koopas = [];

      const radarImage = new Image(30, 30);
      radarImage.src = './assets/sprites/radar.png';
      // Load enemies from map
      levelOne.koopas.forEach((koopa) => {
        data.entities.koopas.push(
          new Koopa(radarImage, koopa[0], koopa[1], koopa[2], koopa[3]));
      });

      levelOne.goombas.forEach((goomba) => {
        data.entities.goombas.push(
          new Goomba(radarImage, goomba[0], goomba[1], goomba[2], goomba[3]));
      });

      render.init(data);
      this.run(data);
    });
  }

  run(data) {
    this.gameLoopRunning = true;
    
    const loop = (currentTime) => {
      // Frame rate limiting - cap at 60fps
      const elapsed = currentTime - this.lastFrameTime;
      
      if (elapsed >= this.frameInterval) {
        this.lastFrameTime = currentTime - (elapsed % this.frameInterval);
        
        input.update(data);
        animation.update(data);
        movement.update(data);
        physics.update(data);

        Game.updateView(data);
        render.update(data);

        data.animationFrame += 1;
      }
      
      window.requestAnimationFrame(loop);
    };

    this.lastFrameTime = performance.now();
    loop(this.lastFrameTime);
  }

  // Update viewport to follow Mario
  static updateView(data) {
    const viewport = data.viewport;
    const margin = viewport.width / 6;
    const center = {
      x: data.entities.mario.xPos + (data.entities.mario.width * 0.5),
      y: data.entities.mario.yPos + (data.entities.mario.height * 0.5),
    };

    if (center.x < viewport.vX + (margin * 2)) {
      viewport.vX = Math.max(center.x - margin, 0);
    } else if (center.x > (viewport.vX + viewport.width) - (margin * 2)) {
      viewport.vX = Math.min((center.x + margin) - viewport.width, 3400 - viewport.width);
    }
  }

  reset() {
    location.reload();
  }
}

const game = new Game();
game.init();
