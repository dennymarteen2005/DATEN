// ============================================================
// LOBBY SCENE — Waiting room before the game starts
// ============================================================
// After creating/joining a room, players wait here.
// Shows:
// - Room code (share with friends!)
// - Player slots (1-4), with "AI" for empty slots
// - "Start Game" button (host only)
// ============================================================

class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    init(data) {
        this.roomCode = data.roomCode;
        this.playerName = data.playerName;
        this.playerIndex = data.playerIndex;
        this.isHost = data.isHost;
        this.players = [];
        this.aiEnabled = true; // Default to AI on
    }

    create() {
        const { width, height } = this.scale;

        // --- Background ---
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1040, 0x1a1040, 1);
        bg.fillRect(0, 0, width, height);

        // --- "DATEN — LOBBY" Title ---
        this.add.text(width / 2, 30, 'DATEN — LOBBY', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#5a4dff',
            strokeThickness: 3
        }).setOrigin(0.5);

        // --- Room Code Display ---
        this.add.text(width / 2, 65, 'ROOM CODE:', {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            color: '#8888cc'
        }).setOrigin(0.5);

        const codeText = this.add.text(width / 2, 90, this.roomCode, {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            color: '#ffdd44',
            backgroundColor: 'rgba(30, 30, 60, 0.8)',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Click to copy room code
        codeText.on('pointerdown', () => {
            navigator.clipboard.writeText(this.roomCode).then(() => {
                codeText.setColor('#66dd66');
                this.time.delayedCall(1000, () => codeText.setColor('#ffdd44'));
            }).catch(() => {});
        });

        this.add.text(width / 2, 115, '(click to copy)', {
            fontFamily: 'Inter',
            fontSize: '10px',
            color: '#555588'
        }).setOrigin(0.5);

        // --- Player Slots ---
        this.add.text(width / 2, 145, 'PLAYERS', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const slotColors = ['#ff4d6a', '#4d9fff', '#4dff7c', '#ffdd4d'];
        const slotNames = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
        this.slotTexts = [];

        for (let i = 0; i < 4; i++) {
            const slotY = 175 + i * 38;
            const slotX = width / 2;

            // Slot background
            const slotBg = this.add.graphics();
            slotBg.fillStyle(0x1a1a30, 0.8);
            slotBg.fillRoundedRect(slotX - 140, slotY - 14, 280, 30, 6);
            slotBg.lineStyle(1, Phaser.Display.Color.HexStringToColor(slotColors[i]).color, 0.5);
            slotBg.strokeRoundedRect(slotX - 140, slotY - 14, 280, 30, 6);

            // Color dot
            const dotColor = Phaser.Display.Color.HexStringToColor(slotColors[i]).color;
            this.add.circle(slotX - 120, slotY, 6, dotColor);

            // Player name/status text
            const slotText = this.add.text(slotX - 100, slotY, `${slotNames[i]}: Waiting...`, {
                fontFamily: '"Press Start 2P"',
                fontSize: '7px',
                color: '#666688'
            }).setOrigin(0, 0.5);

            this.slotTexts.push(slotText);
        }

        // --- Start Game Button (host only) ---
        if (this.isHost) {
            this.startBtn = this.add.text(width / 2, height - 50, 'START GAME', {
                fontFamily: '"Press Start 2P"',
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#5a4dff',
                padding: { x: 24, y: 12 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            this.startBtn.on('pointerover', () => this.startBtn.setScale(1.05));
            this.startBtn.on('pointerout', () => this.startBtn.setScale(1));
            this.startBtn.on('pointerdown', () => {
                window.networkManager.startGame();
            });
        } else {
            this.add.text(width / 2, height - 50, 'Waiting for host to start...', {
                fontFamily: '"Press Start 2P"',
                fontSize: '8px',
                color: '#666688'
            }).setOrigin(0.5);
        }

        // --- Back button ---
        const backBtn = this.add.text(20, 20, '← BACK', {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            color: '#666688'
        }).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // --- AI Bots Toggle (host only) ---
        const toggleY = height - 100;
        this.aiToggleText = this.add.text(width / 2, toggleY, 'AI BOTS: ON', {
            fontFamily: '"Press Start 2P"',
            fontSize: '9px',
            color: '#66dd66',
            backgroundColor: 'rgba(102,221,102,0.15)',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5);

        if (this.isHost) {
            this.aiToggleText.setInteractive({ useHandCursor: true });
            this.aiToggleText.on('pointerdown', () => {
                this.aiEnabled = !this.aiEnabled;
                window.networkManager.updateRoomSettings({ aiEnabled: this.aiEnabled });
                this.updateAIToggleDisplay();
                // Send visual update immediately for host feel
                this.updatePlayerSlots(this.players);
            });
            this.add.text(width / 2, toggleY + 18, '(Click to toggle empty slots)', {
                fontFamily: 'Inter', fontSize: '9px', color: '#555588'
            }).setOrigin(0.5);
        }

        // --- Listen for updates from server ---
        window.networkManager.onRoomUpdate = (data) => {
            if (data.settings !== undefined && data.settings.aiEnabled !== undefined) {
                this.aiEnabled = data.settings.aiEnabled;
                this.updateAIToggleDisplay();
            }
            this.updatePlayerSlots(data.players);
        };

        window.networkManager.onGameStart = (data) => {
            this.scene.start('GameScene', {
                level: data.level,
                players: data.players,
                localPlayerIndex: this.playerIndex,
                playerName: this.playerName,
                aiEnabled: this.aiEnabled 
            });
        };
    }

    updateAIToggleDisplay() {
        if (this.aiEnabled) {
            this.aiToggleText.setText('AI BOTS: ON');
            this.aiToggleText.setColor('#66dd66');
            this.aiToggleText.setBackgroundColor('rgba(102,221,102,0.15)');
        } else {
            this.aiToggleText.setText('AI BOTS: OFF');
            this.aiToggleText.setColor('#ff4444');
            this.aiToggleText.setBackgroundColor('rgba(255,68,68,0.15)');
        }
    }

    // --- Update the player slots display ---
    updatePlayerSlots(players) {
        this.players = players;
        const slotNames = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

        for (let i = 0; i < 4; i++) {
            const player = players.find(p => p.colorIndex === i);
            if (player) {
                const hostBadge = player.isHost ? ' ★' : '';
                this.slotTexts[i].setText(`${slotNames[i]}: ${player.name}${hostBadge}`);
                this.slotTexts[i].setColor('#ffffff');
            } else if (this.aiEnabled) {
                this.slotTexts[i].setText(`${slotNames[i]}: [AI Bot]`);
                this.slotTexts[i].setColor('#ffdd44');
            } else {
                this.slotTexts[i].setText(`${slotNames[i]}: [Empty Slot]`);
                this.slotTexts[i].setColor('#444455');
            }
        }
    }
}

// Make it available globally
window.LobbyScene = LobbyScene;
