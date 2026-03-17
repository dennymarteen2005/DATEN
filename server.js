// ============================================================
// SERVER.JS — The brain of your multiplayer game
// ============================================================
// This file does 3 things:
// 1. Serves your game files (HTML, CSS, JS) to the browser
// 2. Manages multiplayer rooms (create/join with room codes)
// 3. Syncs all player actions in real-time via WebSockets
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// --- Setup Express (serves your game files) ---
const app = express();
const server = http.createServer(app);

// --- Setup Socket.IO (real-time multiplayer communication) ---
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve everything inside the "public" folder as static files
// Serve static files with no-cache to prevent stale deployments
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // HTML files: always revalidate
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // JS/CSS files: revalidate every time (browser still uses etag for efficiency)
    else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));

// --- Game State Storage ---
// Each room stores: players, game state, which level they're on
const rooms = new Map();

// Generate a random 4-digit room code like "A3F7"
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Player colors — each player gets a unique color
const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'];

// ============================================================
// SOCKET.IO — Handle real-time multiplayer events
// ============================================================
io.on('connection', (socket) => {
  console.log(`🟢 Player connected: ${socket.id}`);

  // --- CREATE ROOM ---
  // When a player clicks "Create Room", we make a new room
  socket.on('createRoom', (data, callback) => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      host: socket.id,
      players: new Map(),
      currentLevel: 0,
      gameStarted: false,
      isPlaying: false, // Added isPlaying
      settings: { aiEnabled: true }, // Added default settings
      gameState: {
        buttons: {},
        doors: {},
        completedPlayers: []
      }
    };

    // Add the host as player 0 (red)
    room.players.set(socket.id, {
      id: socket.id,
      name: data.name || 'Player 1',
      colorIndex: 0,
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      animation: 'idle',
      isHost: true
    });

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    console.log(`🏠 Room created: ${roomCode} by ${data.name}`);

    callback({
      success: true,
      roomCode: roomCode,
      playerIndex: 0,
      playerId: socket.id
    });

    // Tell everyone in the room about the updated player list
    broadcastRoomUpdate(roomCode);
  });

  // --- JOIN ROOM ---
  // When a player enters a room code and clicks "Join"
  socket.on('joinRoom', (data, callback) => {
    const roomCode = data.roomCode.toUpperCase();
    const room = rooms.get(roomCode);

    if (!room) {
      callback({ success: false, error: 'Room not found! Check the code.' });
      return;
    }

    if (room.players.size >= 4) {
      callback({ success: false, error: 'Room is full! (max 4 players)' });
      return;
    }

    if (room.gameStarted) {
      callback({ success: false, error: 'Game already in progress!' });
      return;
    }

    // Find the next available color
    const usedColors = [...room.players.values()].map(p => p.colorIndex);
    let colorIndex = 0;
    while (usedColors.includes(colorIndex)) colorIndex++;

    room.players.set(socket.id, {
      id: socket.id,
      name: data.name || `Player ${room.players.size + 1}`,
      colorIndex: colorIndex,
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      animation: 'idle',
      isHost: false
    });

    socket.join(roomCode);
    socket.roomCode = roomCode;

    console.log(`👤 ${data.name} joined room: ${roomCode}`);

    callback({
      success: true,
      roomCode: roomCode,
      playerIndex: colorIndex,
      playerId: socket.id,
      settings: room.settings
    });

    broadcastRoomUpdate(roomCode);
  });

  // --- START GAME ---
  // Only the host can start the game
  socket.on('startGame', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || socket.id !== room.host) return;

    room.gameStarted = true;
    room.isPlaying = true; // Set isPlaying to true
    room.currentLevel = 0;

    console.log(`🎮 Game started in room: ${socket.roomCode}`);

    // Tell all players to load the game scene
    io.to(socket.roomCode).emit('gameStart', {
      level: room.currentLevel,
      players: getPlayersArray(room), // Using existing helper
      settings: room.settings // Added settings
    });
  });

  // --- UPDATE ROOM SETTINGS ---
  // Only the host can update room settings
  socket.on('updateRoomSettings', (settings) => {
    const room = rooms.get(socket.roomCode);
    if (!room || socket.id !== room.host) return;

    // Merge new settings
    room.settings = { ...room.settings, ...settings };

    console.log(`⚙️ Room ${socket.roomCode} settings updated:`, room.settings);

    // Broadcast new settings to lobby
    broadcastRoomUpdate(socket.roomCode);
  });

  // --- PLAYER MOVEMENT ---
  // Sent ~30 times per second from each player to keep positions synced
  socket.on('playerUpdate', (data) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Update the player's position on the server
    player.x = data.x;
    player.y = data.y;
    player.velocityX = data.velocityX || 0;
    player.velocityY = data.velocityY || 0;
    player.animation = data.animation || 'idle';
    player.flipX = data.flipX || false;

    // Send this player's position to all OTHER players in the room
    socket.to(socket.roomCode).emit('playerMoved', {
      id: socket.id,
      x: data.x,
      y: data.y,
      velocityX: data.velocityX,
      velocityY: data.velocityY,
      animation: data.animation,
      flipX: data.flipX
    });
  });

  // --- GAME STATE UPDATES ---
  // When a player presses a button, opens a door, etc.
  socket.on('gameStateUpdate', (data) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    // Merge the update into the room's game state
    Object.assign(room.gameState, data);

    // Broadcast to all players
    io.to(socket.roomCode).emit('gameStateChanged', room.gameState);
  });

  // --- GLOBAL PAUSE / RESUME ---
  socket.on('pauseGame', () => {
    if (!socket.roomCode) return;
    io.to(socket.roomCode).emit('gamePaused');
  });

  socket.on('resumeGame', () => {
    if (!socket.roomCode) return;
    io.to(socket.roomCode).emit('gameResumed');
  });

  // --- PLAYER REACHED GOAL ---
  socket.on('playerReachedGoal', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    if (!room.gameState.completedPlayers.includes(socket.id)) {
      room.gameState.completedPlayers.push(socket.id);
    }

    // Check if all players (human) have reached the goal
    const totalPlayers = room.players.size;
    if (room.gameState.completedPlayers.length >= totalPlayers) {
      // Level complete! Move to next level
      room.currentLevel++;
      room.gameState.completedPlayers = [];
      room.gameState.buttons = {};
      room.gameState.doors = {};

      if (room.currentLevel >= 3) {
        // Game won!
        io.to(socket.roomCode).emit('gameWon');
        console.log(`🏆 Room ${socket.roomCode} completed the game!`);
        room.isPlaying = false; // Game ended
        room.gameStarted = false; // Reset game started state
      } else {
        io.to(socket.roomCode).emit('nextLevel', {
          level: room.currentLevel,
          players: getPlayersArray(room)
        });
        console.log(`⭐ Room ${socket.roomCode} advancing to level ${room.currentLevel}`);
      }
    } else {
      io.to(socket.roomCode).emit('playerCompleted', {
        playerId: socket.id,
        completed: room.gameState.completedPlayers.length,
        total: totalPlayers
      });
    }
  });

  // --- PLAYER DISCONNECT ---
  socket.on('disconnect', () => {
    console.log(`🔴 Player disconnected: ${socket.id}`);
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const disconnectedPlayer = room.players.get(socket.id);
    room.players.delete(socket.id);

    if (room.players.size === 0) {
      // Last player left — delete the room
      rooms.delete(roomCode);
      console.log(`🗑️ Room ${roomCode} deleted (empty)`);
    } else {
      // If the host left, assign a new host
      if (socket.id === room.host) {
        const newHost = room.players.keys().next().value;
        room.host = newHost;
        room.players.get(newHost).isHost = true;
      }

      // Notify remaining players
      io.to(roomCode).emit('playerLeft', {
        playerId: socket.id,
        playerColor: disconnectedPlayer?.colorIndex,
        players: getPlayersArray(room)
      });

      broadcastRoomUpdate(roomCode);
    }
  });
});

// --- Helper: Send updated room info to all players in a room ---
function broadcastRoomUpdate(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  io.to(roomCode).emit('roomUpdate', {
    roomCode: roomCode,
    players: getPlayersArray(room),
    hostId: room.host,
    settings: room.settings // Added settings to roomUpdate
  });
}

// --- Helper: Convert players Map to Array for sending ---
function getPlayersArray(room) {
  return [...room.players.values()].map(p => ({
    id: p.id,
    name: p.name,
    colorIndex: p.colorIndex,
    isHost: p.isHost
  }));
}

// --- Start the server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('');
  console.log('🎮 ═══════════════════════════════════════');
  console.log(`🚀 DATEN server running!`);
  console.log(`🌐 Open in browser: http://localhost:${PORT}`);
  console.log('🎮 ═══════════════════════════════════════');
  console.log('');
});
