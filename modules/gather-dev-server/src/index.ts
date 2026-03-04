import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Supabase client (service role for server-side operations)
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNjQ0OTcwMCwiZXhwIjoxOTcyMDI1NzAwfQ.demo';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PORT = process.env.PORT || 3001;

// Types
interface Player {
  id: string;
  userId: string;
  x: number;
  y: number;
  roomId: string;
  avatarUrl?: string;
}

interface Room {
  id: string;
  mapId: string;
  mapData?: any;
  players: Map<string, Player>;
  collisionLayer?: number[][];
}

// In-memory state
const rooms = new Map<string, Room>();
const socketToPlayer = new Map<string, { playerId: string; roomId: string }>();

// Collision layer placeholder (will be loaded from map_data)
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 19;

// Mock collision layer - 1 = blocked, 0 = walkable
// This should be loaded from map_data in production
function createDefaultCollisionLayer(): number[][] {
  const layer: number[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    layer[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      // Border walls
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        layer[y][x] = 1;
      } else {
        layer[y][x] = 0;
      }
    }
  }
  // Add some random obstacles
  layer[5][5] = 1;
  layer[5][6] = 1;
  layer[10][10] = 1;
  layer[10][11] = 1;
  layer[10][12] = 1;
  return layer;
}

// Validate movement against collision layer
function isValidMove(x: number, y: number, collisionLayer?: number[][]): boolean {
  const layer = collisionLayer || createDefaultCollisionLayer();
  
  // Convert pixel coordinates to grid coordinates
  const gridX = Math.floor(x / TILE_SIZE);
  const gridY = Math.floor(y / TILE_SIZE);
  
  // Check bounds
  if (gridX < 0 || gridX >= MAP_WIDTH || gridY < 0 || gridY >= MAP_HEIGHT) {
    return false;
  }
  
  // Check collision
  return layer[gridY][gridX] === 0;
}

// Auth middleware for Socket.io
async function authenticateSocket(socket: Socket): Promise<{ userId: string | null; isAnonymous: boolean }> {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    // Allow anonymous for development
    return { userId: null, isAnonymous: true };
  }
  
  try {
    // First try to validate as JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // If not a valid JWT, check if it's an anonymous ID
      console.log('Token validation failed, treating as anonymous');
      return { userId: null, isAnonymous: true };
    }
    
    // User authenticated via JWT - create/update profile
    await ensureUserProfile(user.id, user.email || undefined);
    
    return { userId: user.id, isAnonymous: false };
  } catch (err) {
    console.log('Auth error:', err);
    return { userId: null, isAnonymous: true };
  }
}

// Ensure user profile exists in database
async function ensureUserProfile(userId: string, email?: string) {
  try {
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single();
    
    if (!existing) {
      // Create profile for new user
      await supabase
        .from('players')
        .insert({
          user_id: userId,
          room_id: null,
          status: 'online',
          x: 400,
          y: 300
        });
      console.log('Created profile for user:', userId);
    }
  } catch (err) {
    console.error('Error ensuring user profile:', err);
  }
}

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  const authResult = await authenticateSocket(socket);
  if (authResult.userId) {
    console.log(`Authenticated user: ${authResult.userId}`);
  } else if (authResult.isAnonymous) {
    console.log(`Anonymous user connected`);
  }

  // Join room
  socket.on('join-room', async (data: { 
    roomId: string; 
    playerId?: string;
    x?: number;
    y?: number;
  }) => {
    const { roomId, playerId, x = 400, y = 300 } = data;
    
    socket.join(roomId);
    
    // Get or create room
    let room = rooms.get(roomId);
    if (!room) {
      // Try to load from database
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*, map_data(*)')
        .eq('id', roomId)
        .single();
      
      if (roomData?.map_data) {
        room = {
          id: roomId,
          mapId: roomData.map_data.id,
          mapData: roomData.map_data,
          collisionLayer: roomData.map_data.collision_layer || createDefaultCollisionLayer(),
          players: new Map()
        };
      } else {
        // Create default room
        room = {
          id: roomId,
          mapId: 'default',
          collisionLayer: createDefaultCollisionLayer(),
          players: new Map()
        };
      }
      rooms.set(roomId, room);
    }
    
    // Create player
    const finalPlayerId = playerId || authResult.userId || `player-${socket.id.slice(0, 8)}`;
    const player: Player = {
      id: finalPlayerId,
      userId: authResult.userId || 'anonymous',
      x,
      y,
      roomId,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${finalPlayerId}`
    };
    
    room.players.set(socket.id, player);
    socketToPlayer.set(socket.id, { playerId: finalPlayerId, roomId });
    
    // Send current players to new player
    socket.emit('current-players', {
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        avatarUrl: p.avatarUrl
      })),
      collisionLayer: room.collisionLayer
    });
    
    // Notify others
    socket.to(roomId).emit('player-joined', {
      id: player.id,
      x: player.x,
      y: player.y,
      avatarUrl: player.avatarUrl
    });
    
    console.log(`Player ${finalPlayerId} joined room ${roomId}`);
  });

  // Handle movement intent
  socket.on('move-intent', (data: { x: number; y: number; ghostMode?: boolean }) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;
    
    const room = rooms.get(mapping.roomId);
    if (!room) return;
    
    const player = room.players.get(socket.id);
    if (!player) return;
    
    // Validate against collision layer (skip if ghost mode)
    const isGhostMode = data.ghostMode === true;
    
    if (!isGhostMode && !isValidMove(data.x, data.y, room.collisionLayer)) {
      // Reject invalid move
      socket.emit('move-rejected', {
        playerId: player.id,
        x: player.x,
        y: player.y
      });
      return;
    }
    
    // Update position
    player.x = data.x;
    player.y = data.y;
    
    // Broadcast validated position to all in room
    io.to(mapping.roomId).emit('player-moved', {
      playerId: player.id,
      x: player.x,
      y: player.y,
      ghostMode: isGhostMode
    });
    
    // Calculate and broadcast proximity for the moved player
    broadcastProximity(mapping.roomId, player.id);
  });

  // Broadcast proximity data for a specific player to all in room
  function broadcastProximity(roomId: string, playerId: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = Array.from(room.players.values()).find(p => p.id === playerId);
    if (!player) return;
    
    const PROXIMITY_THRESHOLD = 200;
    
    // Calculate distances to all other players
    const proximityData: { playerId: string; distance: number; x: number; y: number; inRange: boolean }[] = [];
    
    room.players.forEach((p) => {
      if (p.id === player.id) return;
      
      const distance = Math.sqrt(
        Math.pow(p.x - player.x, 2) + Math.pow(p.y - player.y, 2)
      );
      
      proximityData.push({
        playerId: p.id,
        distance,
        x: p.x,
        y: p.y,
        inRange: distance < PROXIMITY_THRESHOLD
      });
    });
    
    // Send to the player who moved
    const socketId = Array.from(room.players.entries()).find(([, p]) => p.id === playerId)?.[0];
    if (socketId) {
      io.to(socketId).emit('proximity-update', proximityData);
    }
  }

  // Handle proximity update request
  socket.on('request-proximity', () => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;
    
    const room = rooms.get(mapping.roomId);
    if (!room) return;
    
    const player = room.players.get(socket.id);
    if (!player) return;
    
    // Calculate distances to all other players
    const proximityData: { playerId: string; distance: number; x: number; y: number }[] = [];
    
    room.players.forEach((p) => {
      if (p.id === player.id) return;
      
      const distance = Math.sqrt(
        Math.pow(p.x - player.x, 2) + Math.pow(p.y - player.y, 2)
      );
      
      proximityData.push({
        playerId: p.id,
        distance,
        x: p.x,
        y: p.y
      });
    });
    
    socket.emit('proximity-update', proximityData);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const mapping = socketToPlayer.get(socket.id);
    if (mapping) {
      const room = rooms.get(mapping.roomId);
      if (room) {
        room.players.delete(socket.id);
        socket.to(mapping.roomId).emit('player-left', { playerId: mapping.playerId });
        
        if (room.players.size === 0) {
          rooms.delete(mapping.roomId);
        }
      }
      socketToPlayer.delete(socket.id);
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// REST endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    players: Array.from(socketToPlayer.keys()).length,
    rooms: rooms.size 
  });
});

// Get room info
app.get('/api/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*, map_data(*)')
    .eq('id', roomId)
    .single();
  
  if (error) {
    return res.status(404).json({ error: error.message });
  }
  
  res.json(room);
});

// Create room
app.post('/api/rooms', async (req, res) => {
  const { name, ownerId, mapId, isPublic = true } = req.body;
  
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      name,
      owner_id: ownerId,
      map_id: mapId,
      is_public: isPublic
    })
    .select()
    .single();
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  res.json(room);
});

// Get public rooms
app.get('/api/rooms', async (req, res) => {
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  res.json(rooms || []);
});

// Auth endpoint (for testing - in production use Supabase Auth directly)
app.post('/api/auth/anonymous', async (req, res) => {
  const { userId } = req.body;
  
  // Create anonymous player record
  const { data: player, error } = await supabase
    .from('players')
    .upsert({
      user_id: userId,
      room_id: null,
      status: 'online'
    }, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  res.json({ player });
});

// LiveKit token generation
app.post('/api/livekit/token', async (req, res) => {
  const { roomName, participantName, userId } = req.body;
  
  const livekitUrl = process.env.LIVEKIT_URL;
  const livekitApiKey = process.env.LIVEKIT_API_KEY;
  const livekitApiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    return res.status(500).json({ error: 'LiveKit not configured' });
  }
  
  try {
    // In production, use livekit-server-sdk to generate token
    // For now, return a placeholder that the client can use to connect
    const token = Buffer.from(JSON.stringify({
      room: roomName,
      identity: participantName,
      userId: userId,
      grants: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true
      }
    })).toString('base64');
    
    res.json({ token, url: livekitUrl });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
