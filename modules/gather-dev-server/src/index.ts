import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Player state
interface Player {
  id: string;
  x: number;
  y: number;
  roomId: string;
}

const players = new Map<string, Player>();

// Room state
interface Room {
  id: string;
  players: Map<string, Player>;
}

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join room
  socket.on('join-room', (data: { roomId: string; playerId: string }) => {
    const { roomId, playerId } = data;
    
    socket.join(roomId);

    // Initialize room if not exists
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { id: roomId, players: new Map() });
    }

    const room = rooms.get(roomId)!;
    
    // Add player to room
    const player: Player = { id: playerId, x: 400, y: 300, roomId };
    players.set(socket.id, player);
    room.players.set(socket.id, player);

    // Send current players to new player
    socket.emit('current-players', Array.from(room.players.values()));

    // Notify others
    socket.to(roomId).emit('player-joined', player);

    console.log(`Player ${playerId} joined room ${roomId}`);
  });

  // Handle movement intent
  socket.on('move-intent', (data: { x: number; y: number }) => {
    const player = players.get(socket.id);
    if (!player) return;

    // TODO: Validate move against collision layer
    // For now, accept all moves within bounds
    if (data.x >= 0 && data.x <= 800 && data.y >= 0 && data.y <= 600) {
      player.x = data.x;
      player.y = data.y;

      // Broadcast validated position to all in room
      io.to(player.roomId).emit('player-moved', {
        playerId: player.id,
        x: player.x,
        y: player.y
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      const room = rooms.get(player.roomId);
      if (room) {
        room.players.delete(socket.id);
        socket.to(player.roomId).emit('player-left', { playerId: player.id });
        
        if (room.players.size === 0) {
          rooms.delete(player.roomId);
        }
      }
      players.delete(socket.id);
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', players: players.size, rooms: rooms.size });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
