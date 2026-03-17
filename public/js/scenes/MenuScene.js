// ============================================================
// MENU SCENE — DATEN: Premium Animated Title Screen
// ============================================================
// Features:
// - Animated starfield background
// - Glowing pulsing title with color-shifting effect
// - Animated player characters walking across screen
// - Persistent name (saved in localStorage)
// - Smooth button hover animations
// ============================================================

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Load saved name from localStorage
        this.playerName = localStorage.getItem('daten_playerName') || 'Player';

        // --- ANIMATED STARFIELD BACKGROUND ---
        this.createStarfield(width, height);

        // --- ANIMATED GROUND with tiles ---
        this.createAnimatedGround(width, height);

        // --- Floating characters in background ---
        this.createWalkingCharacters(width, height);

        // --- Glowing gradient bar at top ---
        const topBar = this.add.graphics();
        topBar.fillGradientStyle(0x5a4dff, 0x8a2be2, 0x5a4dff, 0x8a2be2, 0.3, 0.3, 0, 0);
        topBar.fillRect(0, 0, width, 6);
        topBar.setDepth(50);

        // --- DATEN TITLE (large, with glow & animation) ---
        this.titleText = this.add.text(width / 2, height * 0.15, 'DATEN', {
            fontFamily: '"Press Start 2P"',
            fontSize: '64px', // Increased from 52px
            color: '#ffffff',
            align: 'center',
            stroke: '#5a4dff',
            strokeThickness: 8,
            shadow: {
                offsetX: 0, offsetY: 0,
                color: '#7b68ee',
                blur: 30,
                fill: true
            }
        }).setOrigin(0.5).setDepth(50);

        // Title pulse animation
        this.tweens.add({
            targets: this.titleText,
            scaleX: 1.04, scaleY: 1.04,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Title color shift (subtle)
        this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => {
                const colors = ['#ffffff', '#e8e0ff', '#d0c0ff', '#e8e0ff'];
                const idx = Math.floor(Date.now() / 2000) % colors.length;
                this.titleText.setColor(colors[idx]);
            }
        });

        // --- Subtitle with typing effect ---
        const subtitleFull = 'Co-op Puzzle Platformer';
        this.subtitleText = this.add.text(width / 2, height * 0.28, '', {
            fontFamily: 'Inter',
            fontSize: '20px', // Increased from 15px
            color: '#8888cc',
            align: 'center'
        }).setOrigin(0.5).setDepth(50);

        // Type out subtitle letter by letter
        let charIndex = 0;
        this.time.addEvent({
            delay: 50,
            repeat: subtitleFull.length - 1,
            callback: () => {
                charIndex++;
                this.subtitleText.setText(subtitleFull.substring(0, charIndex));
            }
        });

        // --- Feature badges ---
        const badgeY = height * 0.34;
        const badges = ['4 Players', 'AI Bots', '3 Levels', 'WASD + Arrows'];
        const badgeColors = [0xff4d6a, 0x4d9fff, 0x4dff7c, 0xffdd4d];
        const spacing = width / (badges.length + 1);

        badges.forEach((text, i) => {
            const bx = spacing * (i + 1);
            const badge = this.add.text(bx, badgeY, text, {
                fontFamily: '"Press Start 2P"',
                fontSize: '6px',
                color: '#ffffff',
                backgroundColor: `rgba(${(badgeColors[i] >> 16) & 0xff}, ${(badgeColors[i] >> 8) & 0xff}, ${badgeColors[i] & 0xff}, 0.3)`,
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5).setDepth(50).setAlpha(0);

            // Fade in with delay
            this.tweens.add({
                targets: badge,
                alpha: 1,
                y: badgeY - 3,
                duration: 500,
                delay: 800 + i * 150,
                ease: 'Back.easeOut'
            });
        });

        // --- Divider line ---
        const divider = this.add.graphics().setDepth(50);
        divider.lineStyle(1, 0x5a4dff, 0.3);
        divider.lineBetween(width * 0.2, height * 0.40, width * 0.8, height * 0.40);

        // --- PLAYER NAME SECTION ---
        this.add.text(width / 2, height * 0.46, 'YOUR NAME', {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            color: '#6a5acd'
        }).setOrigin(0.5).setDepth(50);

        // Name display box with border
        const nameBoxWidth = 200;
        const nameBoxHeight = 36;
        const nameBoxX = width / 2 - nameBoxWidth / 2;
        const nameBoxY = height * 0.51;

        const nameBox = this.add.graphics().setDepth(49);
        nameBox.fillStyle(0x12122a, 0.9);
        nameBox.fillRoundedRect(nameBoxX, nameBoxY, nameBoxWidth, nameBoxHeight, 8);
        nameBox.lineStyle(2, 0x5a4dff, 0.6);
        nameBox.strokeRoundedRect(nameBoxX, nameBoxY, nameBoxWidth, nameBoxHeight, 8);

        this.nameDisplay = this.add.text(width / 2, nameBoxY + nameBoxHeight / 2, this.playerName, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(50);

        // Blinking cursor after name
        this.nameCursor = this.add.text(0, 0, '▌', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#5a4dff'
        }).setOrigin(0, 0.5).setDepth(50);

        this.tweens.add({
            targets: this.nameCursor,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.updateCursorPosition();

        // Click to edit hint
        this.add.text(width / 2, height * 0.59, '✏ click name to edit', {
            fontFamily: 'Inter',
            fontSize: '9px',
            color: '#444466'
        }).setOrigin(0.5).setDepth(50);

        // Make name area clickable
        const nameHitArea = this.add.rectangle(width / 2, nameBoxY + nameBoxHeight / 2, nameBoxWidth, nameBoxHeight)
            .setInteractive({ useHandCursor: true }).setDepth(51).setAlpha(0.001);

        nameHitArea.on('pointerdown', () => {
            const name = prompt('Enter your name:', this.playerName);
            if (name && name.trim()) {
                this.playerName = name.trim().substring(0, 12);
                this.nameDisplay.setText(this.playerName);
                this.updateCursorPosition();
                // Save to localStorage so it persists!
                localStorage.setItem('daten_playerName', this.playerName);
            }
        });

        // --- SINGLE PLAYER BUTTON ---
        this.createAnimatedButton(
            width / 2, height * 0.63,
            '👤  SINGLE PLAYER',
            0xff8c00, 0xffa500, // Orange theme for solo
            () => {
                this.scene.start('GameScene', {
                    singlePlayer: true,
                    localPlayerIndex: 0,
                    playerName: this.playerName
                });
            }
        );

        // --- CREATE ROOM BUTTON ---
        this.createAnimatedButton(
            width / 2, height * 0.74,
            '🎮  CREATE ROOM',
            0x5a4dff, 0x7b68ee,
            () => this.createRoom()
        );

        // --- JOIN ROOM BUTTON ---
        this.createAnimatedButton(
            width / 2, height * 0.85,
            '🤝  JOIN ROOM',
            0x2a8a4a, 0x3ab85a,
            () => this.joinRoom()
        );

        // --- Bottom bar ---
        const bottomBar = this.add.graphics().setDepth(50);
        bottomBar.fillGradientStyle(0x5a4dff, 0x8a2be2, 0x5a4dff, 0x8a2be2, 0, 0, 0.2, 0.2);
        bottomBar.fillRect(0, height - 6, width, 6);

        // --- Controls hint ---
        this.add.text(width / 2, height * 0.92, '⌨ Controls: WASD or Arrow Keys to move', {
            fontFamily: 'Inter',
            fontSize: '10px',
            color: '#444466'
        }).setOrigin(0.5).setDepth(50);

        // --- Version ---
        this.add.text(width - 12, height - 14, 'v1.1', {
            fontFamily: 'Inter',
            fontSize: '10px',
            color: '#222244'
        }).setOrigin(1, 1).setDepth(50);
    }

    // --- Update blinking cursor position ---
    updateCursorPosition() {
        const bounds = this.nameDisplay.getBounds();
        this.nameCursor.setPosition(bounds.right + 2, bounds.centerY);
    }

    // --- ANIMATED BUTTON with glow hover ---
    createAnimatedButton(x, y, text, color, hoverColor, callback) {
        const btnWidth = 240;
        const btnHeight = 40;

        // Button background (drawn with graphics for rounded corners)
        const bg = this.add.graphics().setDepth(49);
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);

        // Glow outline
        const glow = this.add.graphics().setDepth(48);
        glow.lineStyle(2, hoverColor, 0);
        glow.strokeRoundedRect(x - btnWidth / 2 - 2, y - btnHeight / 2 - 2, btnWidth + 4, btnHeight + 4, 11);

        // Button label
        const label = this.add.text(x, y, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px', // Increased from 10px
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(50);

        // Hit area
        const hitArea = this.add.rectangle(x, y, btnWidth, btnHeight)
            .setInteractive({ useHandCursor: true }).setDepth(51).setAlpha(0.001);

        // Hover: glow + scale
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(hoverColor, 1);
            bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);
            glow.clear();
            glow.lineStyle(3, hoverColor, 0.8);
            glow.strokeRoundedRect(x - btnWidth / 2 - 3, y - btnHeight / 2 - 3, btnWidth + 6, btnHeight + 6, 12);
            label.setScale(1.05);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);
            glow.clear();
            glow.lineStyle(2, hoverColor, 0);
            glow.strokeRoundedRect(x - btnWidth / 2 - 2, y - btnHeight / 2 - 2, btnWidth + 4, btnHeight + 4, 11);
            label.setScale(1);
        });

        hitArea.on('pointerdown', callback);
    }

    // --- STARFIELD BACKGROUND (animated stars) ---
    createStarfield(width, height) {
        // Dark gradient base
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x060618, 0x0a0a20, 0x0e0e30, 0x12122a, 1);
        bg.fillRect(0, 0, width, height);

        // Stars — multiple layers for depth
        this.stars = [];
        for (let layer = 0; layer < 3; layer++) {
            const count = 30 + layer * 15;
            const speed = 0.2 + layer * 0.15;
            const sizeRange = [1, 1 + layer];
            const alphaRange = [0.2, 0.4 + layer * 0.15];

            for (let i = 0; i < count; i++) {
                const sx = Phaser.Math.Between(0, width);
                const sy = Phaser.Math.Between(0, height);
                const size = Phaser.Math.Between(sizeRange[0], sizeRange[1]);
                const alpha = Phaser.Math.FloatBetween(alphaRange[0], alphaRange[1]);
                const starColor = Phaser.Math.RND.pick([0x5a4dff, 0x8a6dff, 0x4d9fff, 0xaaaaff, 0xffffff]);

                const star = this.add.circle(sx, sy, size, starColor, alpha).setDepth(1);

                // Twinkling
                this.tweens.add({
                    targets: star,
                    alpha: alpha * 0.3,
                    duration: Phaser.Math.Between(1500, 4000),
                    yoyo: true,
                    repeat: -1,
                    delay: Phaser.Math.Between(0, 2000)
                });

                // Slow drift
                this.tweens.add({
                    targets: star,
                    y: sy + Phaser.Math.Between(-30, 30),
                    duration: Phaser.Math.Between(8000, 15000),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }

        // Nebula glow spots
        const nebulaColors = [0x5a4dff, 0x8a2be2, 0xff4d6a, 0x4d9fff];
        for (let i = 0; i < 4; i++) {
            const nx = Phaser.Math.Between(width * 0.1, width * 0.9);
            const ny = Phaser.Math.Between(height * 0.1, height * 0.6);
            const nebula = this.add.circle(nx, ny, Phaser.Math.Between(60, 120), nebulaColors[i], 0.04).setDepth(0);
            this.tweens.add({
                targets: nebula,
                alpha: 0.08,
                scaleX: 1.3, scaleY: 1.3,
                duration: Phaser.Math.Between(4000, 7000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    // --- ANIMATED GROUND (tile strip at bottom) ---
    createAnimatedGround(width, height) {
        const groundY = height - 30;
        for (let x = 0; x < width + 32; x += 32) {
            if (this.textures.exists('tile_ground_top')) {
                const tile = this.add.image(x, groundY, 'tile_ground_top').setScale(2).setDepth(5).setAlpha(0.15);
            }
        }
    }

    // --- WALKING CHARACTERS (animated across screen) ---
    createWalkingCharacters(width, height) {
        for (let i = 0; i < 4; i++) {
            const key = `player_${i}_run_0`;
            if (!this.textures.exists(key)) continue;

            const startX = -40 - i * 80;
            const y = height - 46;
            const char = this.add.image(startX, y, key).setScale(2.5).setAlpha(0.12).setDepth(6);

            // Walk across screen continuously
            this.tweens.add({
                targets: char,
                x: width + 40,
                duration: 15000 + i * 3000,
                repeat: -1,
                delay: i * 2000,
                onRepeat: () => {
                    char.x = -40;
                    // Cycle through run frames
                    const frame = Phaser.Math.Between(0, 3);
                    char.setTexture(`player_${i}_run_${frame}`);
                }
            });
        }
    }

    // --- CREATE ROOM ---
    async createRoom() {
        try {
            const result = await window.networkManager.createRoom(this.playerName);
            this.scene.start('LobbyScene', {
                roomCode: result.roomCode,
                playerName: this.playerName,
                playerIndex: result.playerIndex,
                isHost: true
            });
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Failed to create room. Please try again.');
        }
    }

    // --- JOIN ROOM ---
    async joinRoom() {
        const code = prompt('Enter 4-digit room code:');
        if (!code || code.trim().length === 0) return;
        try {
            const result = await window.networkManager.joinRoom(code.trim(), this.playerName);
            this.scene.start('LobbyScene', {
                roomCode: result.roomCode,
                playerName: this.playerName,
                playerIndex: result.playerIndex,
                isHost: false,
                settings: result.settings
            });
        } catch (error) {
            alert(error || 'Failed to join room. Check the code and try again.');
        }
    }
}

window.MenuScene = MenuScene;
