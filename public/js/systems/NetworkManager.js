// ============================================================
// NETWORK MANAGER — Handles all multiplayer communication
// ============================================================
// This is a "singleton" — only one instance exists.
// It wraps Socket.IO to provide clean methods for:
// - Creating/joining rooms
// - Sending player position updates
// - Receiving other players' positions
// ============================================================

class NetworkManager {
    constructor() {
        // Connect to the Socket.IO server
        this.socket = io();
        this.roomCode = null;
        this.playerId = null;
        this.playerIndex = 0;
        this.isHost = false;

        // Callbacks that game scenes can subscribe to
        this.onRoomUpdate = null;
        this.onGameStart = null;
        this.onPlayerMoved = null;
        this.onPlayerLeft = null;
        this.onGameStateChanged = null;
        this.onPlayerCompleted = null;
        this.onNextLevel = null;
        this.onGameWon = null;

        this._setupListeners();
    }

    // --- Set up event listeners from the server ---
    _setupListeners() {
        // Room info updated (player joined/left)
        this.socket.on('roomUpdate', (data) => {
            if (this.onRoomUpdate) this.onRoomUpdate(data);
        });

        // Game has started
        this.socket.on('gameStart', (data) => {
            if (this.onGameStart) this.onGameStart(data);
        });

        // Another player moved
        this.socket.on('playerMoved', (data) => {
            if (this.onPlayerMoved) this.onPlayerMoved(data);
        });

        // A player disconnected
        this.socket.on('playerLeft', (data) => {
            if (this.onPlayerLeft) this.onPlayerLeft(data);
        });

        // Game state changed (button pressed, door opened)
        this.socket.on('gameStateChanged', (data) => {
            if (this.onGameStateChanged) this.onGameStateChanged(data);
        });

        // A player reached the goal
        this.socket.on('playerCompleted', (data) => {
            if (this.onPlayerCompleted) this.onPlayerCompleted(data);
        });

        // Advance to next level
        this.socket.on('nextLevel', (data) => {
            if (this.onNextLevel) this.onNextLevel(data);
        });

        // Game completed!
        this.socket.on('gameWon', () => {
            if (this.onGameWon) this.onGameWon();
        });
    }

    // --- Create a new room (you become the host) ---
    createRoom(playerName) {
        return new Promise((resolve, reject) => {
            this.socket.emit('createRoom', { name: playerName }, (response) => {
                if (response.success) {
                    this.roomCode = response.roomCode;
                    this.playerId = response.playerId;
                    this.playerIndex = response.playerIndex;
                    this.isHost = true;
                    resolve(response);
                } else {
                    reject(response.error);
                }
            });
        });
    }

    // --- Join an existing room with a code ---
    joinRoom(roomCode, playerName) {
        return new Promise((resolve, reject) => {
            this.socket.emit('joinRoom', { roomCode, name: playerName }, (response) => {
                if (response.success) {
                    this.roomCode = response.roomCode;
                    this.playerId = response.playerId;
                    this.playerIndex = response.playerIndex;
                    this.isHost = false;
                    resolve(response);
                } else {
                    reject(response.error);
                }
            });
        });
    }

    // --- Update room settings (host only) ---
    updateRoomSettings(settings) {
        this.socket.emit('updateRoomSettings', settings);
    }

    // --- Tell the server to start the game ---
    startGame() {
        this.socket.emit('startGame');
    }

    // --- Send your player's position to others ---
    sendPlayerUpdate(data) {
        this.socket.emit('playerUpdate', data);
    }

    // --- Send a game state change (button pressed, etc.) ---
    sendGameStateUpdate(data) {
        this.socket.emit('gameStateUpdate', data);
    }

    // --- Tell the server you reached the goal ---
    sendPlayerReachedGoal() {
        this.socket.emit('playerReachedGoal');
    }
}

// Create a single global instance
window.networkManager = new NetworkManager();
