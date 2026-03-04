import Phaser from 'phaser';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { io, Socket } from 'socket.io-client';
import { LiveKitService, liveKitService } from './livekit';
import { tokens } from './components/designTokens';

// Supabase configuration - use env variables via Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 608, // 19 tiles * 32px
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

// Constants
const GRID_SIZE = 32;
const PROXIMITY_THRESHOLD = 200;
const PROXIMITY_QUIET_THRESHOLD = 100;

// Types
interface Player {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  avatarUrl?: string;
  isLocal: boolean;
}

interface ProximityInfo {
  playerId: string;
  distance: number;
  x: number;
  y: number;
  isTalking?: boolean;
}

interface AuthState {
  user: User | null;
  client: SupabaseClient;
  isAuthenticated: boolean;
}

// Global state
let supabase: SupabaseClient;
let socket: Socket;
let currentPlayer: Player | null = null;
let players = new Map<string, Player>();
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
let wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; G: Phaser.Input.Keyboard.Key; M: Phaser.Input.Keyboard.Key };
let ghostMode = false;
let authState: AuthState;
let authToken: string | null = null; // Store JWT token for socket auth
let currentRoomId: string = 'default-room';
let collisionLayer: number[][] = [];
let proximityPlayers = new Map<string, ProximityInfo>();
let pendingMoves: { x: number; y: number }[] = [];
let lastMoveTime = 0;
const MOVE_COOLDOWN = 100; // ms

// Audio state
let isMuted = true; // Muted by default (Gather.town style)
let isMicEnabled = false;
let audioStatusText: Phaser.GameObjects.Text;

// Proximity indicator UI element
let proximityIndicatorText: Phaser.GameObjects.Text;

// Auth functions
async function initAuth(): Promise<AuthState> {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  
  // Check for existing session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    console.log('Existing session found:', session.user.id);
    authToken = session.access_token;
    return { user: session.user, client: supabase, isAuthenticated: true };
  }
  
  // Try anonymous sign in for development
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (data?.user && data.session) {
      console.log('Anonymous user signed in:', data.user.id);
      authToken = data.session.access_token;
      return { user: data.user, client: supabase, isAuthenticated: true };
    }
  } catch (e) {
    console.log('Anonymous auth not available, continuing without auth');
  }
  
  return { user: null, client: supabase, isAuthenticated: false };
}

// Socket.io functions
function initSocket() {
  socket = io(SOCKET_URL, {
    auth: {
      token: authToken || authState.user?.id || undefined
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    joinRoom();
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('current-players', (data: { 
    players: { id: string; x: number; y: number; avatarUrl?: string }[];
    collisionLayer?: number[][];
  }) => {
    console.log('Received current players:', data.players.length);
    
    if (data.collisionLayer) {
      collisionLayer = data.collisionLayer;
      drawCollisionLayer();
    }
    
    // Add remote players
    data.players.forEach(p => {
      if (!players.has(p.id)) {
        addRemotePlayer(p.id, p.x, p.y, p.avatarUrl);
      }
    });
  });

  socket.on('player-joined', (data: { id: string; x: number; y: number; avatarUrl?: string }) => {
    console.log('Player joined:', data.id);
    if (!players.has(data.id)) {
      addRemotePlayer(data.id, data.x, data.y, data.avatarUrl);
    }
  });

  socket.on('player-moved', (data: { playerId: string; x: number; y: number; ghostMode?: boolean }) => {
    const player = players.get(data.playerId);
    if (player && !player.isLocal) {
      // Set target position for interpolation
      player.targetX = data.x;
      player.targetY = data.y;
      
      // Handle ghost mode visual
      if (data.ghostMode) {
        player.sprite.setAlpha(0.5);
      } else {
        player.sprite.setAlpha(1);
      }
    }
  });

  socket.on('player-left', (data: { playerId: string }) => {
    console.log('Player left:', data.playerId);
    const player = players.get(data.playerId);
    if (player) {
      player.sprite.destroy();
      player.label.destroy();
      players.delete(data.playerId);
    }
  });

  socket.on('move-rejected', (data: { x: number; y: number }) => {
    if (currentPlayer) {
      currentPlayer.x = data.x;
      currentPlayer.y = data.y;
      currentPlayer.sprite.x = data.x;
      currentPlayer.sprite.y = data.y;
    }
  });

  socket.on('proximity-update', (data: ProximityInfo[]) => {
    proximityPlayers.clear();
    data.forEach(p => proximityPlayers.set(p.playerId, p));
    updateProximityVisuals();
    updateLiveKitConnections(data);
  });
}

// Update LiveKit connections based on proximity
let liveKitConnected = false;
let nearbyParticipants = new Set<string>();

async function updateLiveKitConnections(proximityData: ProximityInfo[]) {
  // Only connect if we have a user and room
  if (!authState.user || !currentRoomId) return;
  
  const newNearby = new Set<string>();
  let hasNewNearby = false;
  
  // Check which players are now in range
  for (const p of proximityData) {
    if (p.distance < PROXIMITY_THRESHOLD) {
      newNearby.add(p.playerId);
      if (!nearbyParticipants.has(p.playerId)) {
        hasNewNearby = true;
      }
    }
  }
  
  // Check if anyone left proximity
  for (const old of nearbyParticipants) {
    if (!newNearby.has(old)) {
      // Player left proximity - could disconnect their audio here
      console.log('Player left proximity:', old);
    }
  }
  
  // Connect to LiveKit if there are nearby players and not yet connected
  if (newNearby.size > 0 && !liveKitConnected) {
    try {
      await connectToLiveKit();
    } catch (err) {
      console.error('Failed to connect to LiveKit:', err);
    }
  }
  
  // Update spatial audio positions for nearby players
  if (liveKitConnected && currentPlayer) {
    for (const p of proximityData) {
      if (p.distance < PROXIMITY_THRESHOLD) {
        liveKitService.setSpatialPosition(p.playerId, currentPlayer.x, currentPlayer.y, p.x, p.y);
      }
    }
  }
  
  nearbyParticipants = newNearby;
}

async function connectToLiveKit() {
  if (liveKitConnected || !currentRoomId || !authState.user) return;
  
  try {
    // Get LiveKit token from server
    const response = await fetch(`${SOCKET_URL}/api/livekit/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: `room-${currentRoomId}`,
        participantName: authState.user.id,
        userId: authState.user.id
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      if (err.error === 'LiveKit not configured') {
        console.log('LiveKit not configured, skipping audio');
        return;
      }
      throw new Error(err.error || 'Failed to get token');
    }
    
    const { token, url } = await response.json();
    
    // Connect to LiveKit (without enabling audio - muted by default)
    await liveKitService.connect({ url, token });
    
    // Don't enable audio yet - user must unmute first (Gather.town style)
    // isMuted = true by default
    
    liveKitConnected = true;
    console.log('Connected to LiveKit (muted by default)');
  } catch (err) {
    console.error('LiveKit connection failed:', err);
    liveKitConnected = false;
  }
}

function joinRoom() {
  socket.emit('join-room', {
    roomId: currentRoomId,
    playerId: authState.user?.id || `player-${Date.now()}`,
    x: 400,
    y: 300
  });
}

function sendMove(x: number, y: number) {
  const now = Date.now();
  if (now - lastMoveTime < MOVE_COOLDOWN) return;
  
  lastMoveTime = now;
  
  socket.emit('move-intent', {
    x,
    y,
    ghostMode
  });
}

function requestProximity() {
  socket.emit('request-proximity');
}

// Phaser functions
function preload() {
  // Placeholder player sprite
  this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGfSURBVFiF7ZY9SwNBEIafuVyOgoWFhY2VjY2FhYUf4A/wC2xsbGxsbGxsLPwAf4CttbGxsbCwsLCwsLDwA6wsLCwsLPwACwsLCwsLC74gce/NJheXu0Tu4oFhc2F25s3MvNm9A1VV+cEppf6L6LpuQUpZGWOuAcbY0FoPrLVxHEfGmBKAi4i+McZsGGM2AdbA0HXdJoDjOPI8LwHwPO8vgDnnfNd1HwC4rivP8/4TQJZlXxJC3AK4VFU9NMa8iMgyxrwBaIxx3/f/AfA8L00cxwCQ57kPYIyJU0o9AyiKwlvnfABAGsfxGsdxB4BjY8w1gDTP8xrP8/oA6jiOrwGEQgifOH4BEMdxfAsgFEL4Qgjf87y2MSb2ff8jgDCO4xqA0BjzCCDM8/wKQBhFkQ8gSJKkC0AYx/EtgDCO4waAMATwD0CSJNUAIgiCJoAgiqIm1wB2fd9vAQiDILgFEARBcA0g8H3/JoAgCIIbAEEQBNcAfN//9w8A3/f/AfA87x8A3/f/AfA87x8A3/f/AfA87x8A3/f/AfB9/x8A3vf/AhCGYf+AYRj2D2CMiUM//A9VVX+AMQYRAPl3MAAIIYQQQgghhBBCCCH+F/4A3mM0Ict9u+MAAAAASUVORK5CYII=');
  this.load.image('player-remote', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGfSURBVFiF7ZY9SwNBEIafuVyOgoWFhY2VjY2FhYUf4A/wC2xsbGxsbGxsLPwAf4CttbGxsbCwsLCwsLDwA6wsLCwsLPwACwsLCwsLC74gce/NJheXu0Tu4oFhc2F25s3MvNm9A1VV+cEppf6L6LpuQUpZGWOuAcbY0FoPrLVxHEfGmBKAi4i+McZsGGM2AdbA0HXdJoDjOPI8LwHwPO8vgDnnfNd1HwC4rivP8/4TQJZlXxJC3AK4VFU9NMa8iMgyxrwBaIxx3/f/AfA8L00cxwCQ57kPYIyJU0o9AyiKwlvnfABAGsfxGsdxB4BjY8w1gDTP8xrP8/oA6jiOrwGEQgifOH4BEMdxfAsgFEL4Qgjf87y2MSb2ff8jgDCO4xqA0BjzCCDM8/wKQBhFkQ8gSJKkC0AYx/EtgDCO4waAMATwD0CSJNUAIgiCJoAgiqIm1wB2fd9vAQiDILgFEARBcA0g8H3/JoAgCIIbAEEQBNcAfN//9w8A3/f/AfA87x8A3/f/AfA87x8A3/f/AfA87x8A3/f/AfB9/x8A3vf/AhCGYf+AYRj2D2CMiUM//A9VVX+AMQYRAPl3MAAIIYQQQgghhBBCCCH+F/4A3mM0Ict9u+MAAAAASUVORK5CYII=');
}

function create() {
  // Create grid background
  const graphics = this.add.graphics();
  graphics.lineStyle(1, 0x333366, 0.5);
  
  for (let x = 0; x < 800; x += GRID_SIZE) {
    graphics.moveTo(x, 0);
    graphics.lineTo(x, 608);
  }
  for (let y = 0; y < 608; y += GRID_SIZE) {
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
    G: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G),
    M: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
  };

  // Create current player sprite
  const playerSprite = this.add.sprite(400, 300, 'player');
  playerSprite.setScale(GRID_SIZE / 32);
  
  // Add label
  const label = this.add.text(400, 260, authState.user?.id?.slice(0, 8) || 'You', {
    fontSize: '10px',
    color: '#ffffff'
  }).setOrigin(0.5);
  
  currentPlayer = {
    id: authState.user?.id || 'local',
    sprite: playerSprite,
    label,
    x: 400,
    y: 300,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authState.user?.id || 'local'}`,
    isLocal: true
  };
  
  players.set(currentPlayer.id, currentPlayer);

  // Add UI text
  this.add.text(10, 10, 'WASD to move | G for ghost mode', {
    fontSize: '14px',
    color: '#ffffff'
  });
  
  // Auth status
  const authText = authState.isAuthenticated 
    ? `Logged in: ${authState.user?.id?.slice(0, 8)}`
    : 'Anonymous';
  this.add.text(10, 30, authText, {
    fontSize: '12px',
    color: '#aaaaaa'
  });
  
  // Room info
  this.add.text(10, 50, `Room: ${currentRoomId}`, {
    fontSize: '12px',
    color: '#aaaaaa'
  });
  
  // Proximity indicator UI
  proximityIndicatorText = this.add.text(10, 70, 'Nearby: 0 players', {
    fontSize: '12px',
    color: '#ffff00'
  });
  
  // Audio status UI
  audioStatusText = this.add.text(10, 90, '🎤 Muted (Press M to unmute)', {
    fontSize: '12px',
    color: '#ff6666'
  });
}

function update() {
  if (!currentPlayer) return;

  let targetX = currentPlayer.x;
  let targetY = currentPlayer.y;
  let moved = false;

  // Ghost mode toggle
  ghostMode = wasd.G.isDown;
  currentPlayer.sprite.setAlpha(ghostMode ? 0.5 : 1);

  // Grid-based movement
  if (cursors.left.isDown || wasd.A.isDown) {
    targetX -= GRID_SIZE;
    moved = true;
  } else if (cursors.right.isDown || wasd.D.isDown) {
    targetX += GRID_SIZE;
    moved = true;
  }

  if (cursors.up.isDown || wasd.W.isDown) {
    targetY -= GRID_SIZE;
    moved = true;
  } else if (cursors.down.isDown || wasd.S.isDown) {
    targetY += GRID_SIZE;
    moved = true;
  }

  // Boundary checks
  if (targetX < GRID_SIZE / 2) targetX = GRID_SIZE / 2;
  if (targetX > 800 - GRID_SIZE / 2) targetX = 800 - GRID_SIZE / 2;
  if (targetY < GRID_SIZE / 2) targetY = GRID_SIZE / 2;
  if (targetY > 608 - GRID_SIZE / 2) targetY = 608 - GRID_SIZE / 2;

  // Collision check (if not ghost mode)
  if (!ghostMode && isColliding(targetX, targetY)) {
    // Don't move
    return;
  }

  // Update position locally
  if (moved) {
    currentPlayer.x = targetX;
    currentPlayer.y = targetY;
    currentPlayer.sprite.x = currentPlayer.x;
    currentPlayer.sprite.y = currentPlayer.y;
    currentPlayer.label.x = currentPlayer.x;
    currentPlayer.label.y = currentPlayer.y - 30;
    
    // Send to server
    sendMove(currentPlayer.x, currentPlayer.y);
  }

  // Interpolate remote player positions
  const INTERPOLATION_SPEED = 0.2;
  players.forEach((player) => {
    if (player.isLocal) return;
    
    // Interpolate towards target position
    if (player.targetX !== undefined && player.targetY !== undefined) {
      player.sprite.x += (player.targetX - player.sprite.x) * INTERPOLATION_SPEED;
      player.sprite.y += (player.targetY - player.sprite.y) * INTERPOLATION_SPEED;
      player.label.x = player.sprite.x;
      player.label.y = player.sprite.y - 30;
      
      // Update logical position to match visual
      player.x = player.sprite.x;
      player.y = player.sprite.y;
    }
  });

  // Update proximity periodically
  if (Math.random() < 0.05) { // ~3 times per second at 60fps
    requestProximity();
  }
  
  // Client-side proximity check using Euclidean distance
  // Formula: d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
  checkProximityLocally();
}

// Collision detection
function isColliding(x: number, y: number): boolean {
  const gridX = Math.floor(x / GRID_SIZE);
  const gridY = Math.floor(y / GRID_SIZE);
  
  if (gridX < 0 || gridX >= 25 || gridY < 0 || gridY >= 19) {
    return true;
  }
  
  return collisionLayer[gridY]?.[gridX] === 1;
}

// Calculate Euclidean distance between two points
function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Client-side proximity check using Euclidean distance formula
// Formula: d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
function checkProximityLocally(): void {
  if (!currentPlayer) return;
  
  let nearbyCount = 0;
  const nearbyList: string[] = [];
  
  players.forEach((player) => {
    if (player.isLocal) return;
    
    // Use Euclidean distance formula: d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
    const distance = euclideanDistance(
      currentPlayer!.x, 
      currentPlayer!.y, 
      player.x, 
      player.y
    );
    
    // Update proximityPlayers with local calculation
    proximityPlayers.set(player.id, {
      playerId: player.id,
      distance,
      x: player.x,
      y: player.y
    });
    
    // Count players within 200px
    if (distance < PROXIMITY_THRESHOLD) {
      nearbyCount++;
      nearbyList.push(`${player.id.slice(0, 6)} (${Math.round(distance)}px)`);
    }
  });
  
  // Update proximity indicator UI
  if (proximityIndicatorText) {
    if (nearbyCount > 0) {
      proximityIndicatorText.setText(`Nearby: ${nearbyCount} player${nearbyCount > 1 ? 's' : ''}`);
      proximityIndicatorText.setColor('#00ff00'); // Green when players are near
    } else {
      proximityIndicatorText.setText('Nearby: 0 players');
      proximityIndicatorText.setColor('#ffff00'); // Yellow when alone
    }
  }
  
  // Update visual highlights for nearby players
  updateProximityVisuals();
}

function drawCollisionLayer() {
  // This would draw collision tiles - for now just log
  console.log('Collision layer loaded:', collisionLayer.length, 'rows');
}

// Proximity handling
function updateProximityVisuals() {
  players.forEach((player) => {
    if (player.isLocal) return;
    
    const proximity = proximityPlayers.get(player.id);
    
    if (proximity && proximity.distance < PROXIMITY_THRESHOLD) {
      // Within proximity - green tint
      if (proximity.distance < PROXIMITY_QUIET_THRESHOLD) {
        player.sprite.setTint(0x00ff00); // Close - bright green
      } else {
        player.sprite.setTint(0x88ff88); // Medium - light green
      }
    } else {
      // Out of proximity - red tint
      player.sprite.setTint(0xff6666);
    }
  });
}

function addRemotePlayer(id: string, x: number, y: number, avatarUrl?: string): Player {
  const scene = (currentPlayer?.sprite.scene) || null;
  if (!scene) {
    // Scene not ready yet, queue for later
    setTimeout(() => addRemotePlayer(id, x, y, avatarUrl), 100);
    return null as any;
  }
  
  const sprite = scene.add.sprite(x, y, 'player-remote');
  sprite.setScale(GRID_SIZE / 32);
  sprite.setTint(0xff6666);
  
  const label = scene.add.text(x, y - 30, id.slice(0, 8), {
    fontSize: '10px',
    color: '#cccccc'
  }).setOrigin(0.5);
  
  const player: Player = {
    id,
    sprite,
    label,
    x,
    y,
    targetX: x,
    targetY: y,
    avatarUrl,
    isLocal: false
  };
  
  players.set(id, player);
  return player;
}

// LiveKit integration (placeholder)
// In production, this would connect to LiveKit for spatial audio
class LiveKitManager {
  private isConnected = false;
  
  async connect(roomName: string, participantToken: string): Promise<void> {
    console.log('LiveKit: Would connect to', roomName);
    // TODO: Implement LiveKit connection
    this.isConnected = true;
  }
  
  async disconnect(): Promise<void> {
    console.log('LiveKit: Disconnecting');
    this.isConnected = false;
  }
  
  setSpatialPosition(playerId: string, x: number, y: number): void {
    // TODO: Implement spatial audio positioning
    // This would use Web Audio API PannerNode
  }
  
  setRemoteVolume(playerId: string, volume: number): void {
    // Adjust volume based on proximity
  }
}

const liveKitManager = new LiveKitManager();

// Initialize everything
async function init() {
  console.log('Initializing Gather Clone...');
  
  // Initialize auth
  authState = await initAuth();
  console.log('Auth state:', authState.isAuthenticated ? 'authenticated' : 'anonymous');
  
  // Initialize socket
  initSocket();
  
  // Start game
  new Phaser.Game(config);
}

init().catch(console.error);
