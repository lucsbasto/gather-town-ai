import Phaser from 'phaser';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const GRID_SIZE = 32;
const PROXIMITY_THRESHOLD = 200;

interface Player {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
}

const players = new Map<string, Player>();
let currentPlayer: Player | null = null;
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
let wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; G: Phaser.Input.Keyboard.Key };
let ghostMode = false;

function preload() {
  // Placeholder - replace with actual assets
  this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGfSURBVFiF7ZY9SwNBEIafuVyOgoWFhY2VjY2FhYUf4A/wC2xsbGxsbGxsLPwAf4CttbGxsbCwsLCwsLDwA6wsLCwsLPwACwsLCwsLC74gce/NJheXu0Tu4oFhc2F25s3MvNm9A1VV+cEppf6L6LpuQUpZGWOuAcbY0FoPrLVxHEfGmBKAi4i+McZsGGM2AdbA0HXdJoDjOPI8LwHwPO8vgDnnfNd1HwC4rivP8/4TQJZlXxJC3AK4VFU9NMa8iMgyxrwBaIxx3/f/AfA8L00cxwCQ57kPYIyJU0o9AyiKwlvnfABAGsfxGsdxB4BjY8w1gDTP8xrP8/oA6jiOrwGEQgifOH4BEMdxfAsgFEL4Qgjf87y2MSb2ff8jgDCO4xqA0BjzCCDM8/wKQBhFkQ8gSJKkC0AYx/EtgDCO4waAMATwD0CSJNUAIgiCJoAgiqIm1wB2fd9vAQiDILgFEARBcA0g8H3/JoAgCIIbAEEQBNcAfN//9w8A3/f/AfA87x8A3/f/AfA87x8A3/f/AfA87x8A3/f/AfB9/x8Az/P+AfA87x8A3/f/AfA87x8A3/f/AfA87x8A3/f/AfA87x8A3/f/AfB9/x8A3/f/AfB9/x+qqqoHABRFUQ+AEARBkKYpVFWFYRifAJIk6QIAhCGEPwB8AKdN1y7sWgAAAABJRU5ErkJggg==');
  this.load.image('tiles', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABgSURBVFiF7dGxDQAgCATQ+5+3uIAESdLkXkq2JNsCAID/bgEAsC8AALYFAIB9AQCwLwAAtgUAgH0BALAtAAC2BQCAfQEAsC8AALYFAIB9AQCwLwAAtgUAgH0BALAtAAD+DwArlQgR2x5qKgAAAABJRU5ErkJggg==');
}

function create() {
  // Create grid background
  const graphics = this.add.graphics();
  graphics.lineStyle(1, 0x333366, 0.5);
  
  for (let x = 0; x < 800; x += GRID_SIZE) {
    graphics.moveTo(x, 0);
    graphics.lineTo(x, 600);
  }
  for (let y = 0; y < 600; y += GRID_SIZE) {
    graphics.moveTo(0, y);
    graphics.lineTo(800, y);
  }
  graphics.strokePath();

  // Setup keyboard input
  cursors = this.input.keyboard.createCursorKeys();
  wasd = {
    W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    G: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G)
  };

  // Create current player sprite
  const playerSprite = this.add.sprite(400, 300, 'player');
  playerSprite.setScale(GRID_SIZE / 32);
  currentPlayer = {
    id: 'local-player',
    sprite: playerSprite,
    x: 400,
    y: 300
  };

  // Add some other players for testing
  addRemotePlayer(this, 'player-2', 500, 400);
  addRemotePlayer(this, 'player-3', 300, 200);

  // Add UI text
  this.add.text(10, 10, 'WASD to move | G for ghost mode', {
    fontSize: '14px',
    color: '#ffffff'
  });
}

function addRemotePlayer(scene: Phaser.Scene, id: string, x: number, y: number): Player {
  const sprite = scene.add.sprite(x, y, 'player');
  sprite.setScale(GRID_SIZE / 32);
  sprite.setTint(0xff0000); // Different color for remote players
  
  const player: Player = { id, sprite, x, y };
  players.set(id, player);
  return player;
}

function update() {
  if (!currentPlayer) return;

  let targetX = currentPlayer.x;
  let targetY = currentPlayer.y;

  // Ghost mode toggle
  ghostMode = wasd.G.isDown;
  currentPlayer.sprite.setAlpha(ghostMode ? 0.5 : 1);

  // Grid-based movement
  if (cursors.left.isDown || wasd.A.isDown) {
    targetX -= GRID_SIZE;
  } else if (cursors.right.isDown || wasd.D.isDown) {
    targetX += GRID_SIZE;
  }

  if (cursors.up.isDown || wasd.W.isDown) {
    targetY -= GRID_SIZE;
  } else if (cursors.down.isDown || wasd.S.isDown) {
    targetY += GRID_SIZE;
  }

  // Only move if target is within bounds
  if (targetX >= GRID_SIZE / 2 && targetX < 800 - GRID_SIZE / 2) {
    currentPlayer.x = targetX;
    currentPlayer.sprite.x = currentPlayer.x;
  }
  if (targetY >= GRID_SIZE / 2 && targetY < 600 - GRID_SIZE / 2) {
    currentPlayer.y = targetY;
    currentPlayer.sprite.y = currentPlayer.y;
  }

  // Proximity check for all players
  checkProximity();
}

function checkProximity() {
  if (!currentPlayer) return;

  players.forEach((player) => {
    if (player.id === currentPlayer?.id) return;

    const distance = Math.sqrt(
      Math.pow(player.x - currentPlayer.x, 2) +
      Math.pow(player.y - currentPlayer.y, 2)
    );

    if (distance < PROXIMITY_THRESHOLD) {
      // Player is within proximity - enable audio/video
      player.sprite.setTint(0x00ff00); // Green = connected
    } else {
      player.sprite.setTint(0xff0000); // Red = disconnected
    }
  });
}

// Start the game
new Phaser.Game(config);
