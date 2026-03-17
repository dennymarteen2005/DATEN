// ============================================================
// GAME SCENE — DATEN Anti-Gravity Chain Co-op Game
// ============================================================
// The core gameplay scene with:
// - Chain physics connecting all 4 players
// - Gravity zones (flip gravity!)
// - Spikes, lasers, falling platforms
// - Stacking, buttons, doors
// - Checkpoints, respawn
// - Camera that follows all players
// - Full dashboard HUD
// ============================================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.currentLevel = data.level || 0;
        this.remotePlayers = data.players || [];
        this.localPlayerIndex = data.localPlayerIndex || 0;
        this.playerName = data.playerName || 'Player';
        this.singlePlayer = data.singlePlayer || false;
    }

    preload() {
        SpriteGenerator.generateAll(this);
    }

    create() {
        const { width, height } = this.scale;
        this.levelData = LevelManager.getLevel(0);

        const ts = this.levelData.tileSize;
        const scale = 2;
        const worldW = this.levelData.width * ts * scale;
        const worldH = this.levelData.height * ts * scale;

        this.physics.world.setBounds(0, 0, worldW, worldH);
        this.cameras.main.setBounds(0, 0, worldW, worldH);

        // Background
        this.createBackground(worldW, worldH);

        // Build tilemap
        this.groundTiles = this.physics.add.staticGroup();
        this.platformTiles = this.physics.add.staticGroup();
        this.buildLevel();

        // Interactive objects
        this.buttons = [];
        this.doors = [];
        this.goals = [];
        this.spikes = [];
        this.movingPlatforms = [];
        this.lasers = [];
        this.fallingPlatforms = [];
        this.gravityZones = [];
        this.checkpoints = [];
        this.exitDoor = null;
        this.createObjects();

        // Players
        this.localPlayer = null;
        this.remotePlayerSprites = {};
        this.aiCompanions = [];
        this.allPlayers = [];
        this.spawnPlayers();

        // Chain system
        this.chainSystem = new ChainSystem(this);
        if (!this.singlePlayer) {
            this.chainSystem.connectPlayers(this.allPlayers);
        }

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Camera: follow center of all players, zoom out when spread
        this.setupCamera();

        // HUD
        this.createHUD();

        // Level intro
        this.showLevelName();

        // Timers
        this.networkUpdateTimer = 0;
        this.dashboardTimer = 0;
    }

    // --- BUILD TILEMAP ---
    buildLevel() {
        const { map, tileSize } = this.levelData;
        const scale = 2;

        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                const t = map[r][c];
                const x = c * tileSize * scale + tileSize;
                const y = r * tileSize * scale + tileSize;

                if (t === 0) {
                    if (this.textures.exists('tile_bg'))
                        this.add.image(x, y, 'tile_bg').setScale(scale).setDepth(0);
                } else if (t === 1) {
                    this.groundTiles.create(x, y, 'tile_ground_top').setScale(scale).refreshBody().setDepth(1);
                } else if (t === 2) {
                    this.groundTiles.create(x, y, 'tile_wall').setScale(scale).refreshBody().setDepth(1);
                } else if (t === 3) {
                    const p = this.platformTiles.create(x, y, 'tile_platform');
                    p.setScale(scale).refreshBody().setDepth(1);
                    p.body.checkCollision.down = false;
                    p.body.checkCollision.left = false;
                    p.body.checkCollision.right = false;
                } else if (t === 4) {
                    this.groundTiles.create(x, y, 'tile_ceiling').setScale(scale).refreshBody().setDepth(1);
                }
            }
        }
    }

    // --- CREATE OBJECTS ---
    createObjects() {
        const { objects, tileSize } = this.levelData;
        const scale = 2;

        for (const obj of objects) {
            const x = obj.x * tileSize * scale + tileSize;
            const y = obj.y * tileSize * scale + tileSize;

            switch (obj.type) {
                case 'button': {
                    const btn = this.physics.add.staticImage(x, y + 6, 'button_off');
                    btn.setScale(scale).refreshBody().setDepth(2);
                    btn.id = obj.id; btn.linkedDoor = obj.linkedDoor; btn.isPressed = false;
                    btn.body.setSize(12*scale, 6*scale); btn.body.setOffset(2*scale, 10*scale);
                    this.buttons.push(btn);
                    break;
                }
                case 'door': {
                    const door = this.physics.add.staticImage(x, y - 8, 'door_closed');
                    door.setScale(scale).refreshBody().setDepth(2);
                    door.id = obj.id; door.isOpen = false;
                    this.doors.push(door);
                    break;
                }
                case 'exitDoor': {
                    this.exitDoor = this.physics.add.staticImage(x, y - 16, 'door_closed');
                    this.exitDoor.setScale(scale).refreshBody().setDepth(2);
                    this.exitDoor.id = obj.id; this.exitDoor.isOpen = false;

                    // "EXIT" label
                    this.add.text(x, y - 60, 'EXIT', {
                        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ff4444'
                    }).setOrigin(0.5).setDepth(3);
                    break;
                }
                case 'spike': {
                    const tex = obj.dir === 'down' ? 'spike_down' : 'spike_up';
                    const spike = this.physics.add.staticImage(x, y, tex);
                    spike.setScale(scale).refreshBody().setDepth(2);
                    spike.body.setSize(14*scale, 6*scale);
                    if (obj.dir === 'down') spike.body.setOffset(1*scale, 0);
                    else spike.body.setOffset(1*scale, 10*scale);
                    this.spikes.push(spike);
                    break;
                }
                case 'laser': {
                    const laserObj = {
                        x: x, y: y,
                        height: (obj.height || 10) * tileSize * scale,
                        onTime: obj.onTime || 2000,
                        offTime: obj.offTime || 1500,
                        isOn: true,
                        timer: 0,
                        emitter: this.add.image(x, y, 'laser_emitter').setScale(scale).setDepth(2),
                        beam: null,
                        hitbox: null
                    };
                    // Create beam and hitbox
                    laserObj.beam = this.add.rectangle(x, y + laserObj.height / 2, 6, laserObj.height, 0xff0044, 0.6).setDepth(2);
                    laserObj.hitbox = this.physics.add.staticImage(x, y + laserObj.height / 2, 'laser_on');
                    laserObj.hitbox.setScale(1, laserObj.height / 32);
                    laserObj.hitbox.body.setSize(6, laserObj.height);
                    laserObj.hitbox.setAlpha(0.001);
                    this.lasers.push(laserObj);
                    break;
                }
                case 'fallingPlatform': {
                    const fp = this.physics.add.image(x, y, 'falling_platform');
                    fp.setScale(scale).setImmovable(true);
                    fp.body.allowGravity = false; fp.setDepth(2);
                    fp.isFalling = false; fp.fallTimer = 0;
                    fp.originalY = y; fp.body.checkCollision.down = false;
                    this.fallingPlatforms.push(fp);
                    break;
                }
                case 'movingPlatform': {
                    const mp = this.physics.add.image(x, y, 'moving_platform');
                    mp.setScale(scale).setImmovable(true);
                    mp.body.allowGravity = false; mp.setDepth(2);
                    mp.startX = x; mp.startY = y;
                    mp.endX = obj.endX * tileSize * scale + tileSize;
                    mp.endY = obj.endY * tileSize * scale + tileSize;
                    mp.speed = obj.speed || 1; mp.progress = 0; mp.direction = 1;
                    this.movingPlatforms.push(mp);
                    break;
                }
                case 'gravityZone': {
                    const gzW = (obj.width || 10) * tileSize * scale;
                    const gzH = (obj.height || 10) * tileSize * scale;
                    const gz = this.add.rectangle(x + gzW/2 - tileSize, y + gzH/2 - tileSize, gzW, gzH, 0xff4d6a, 0.06);
                    gz.setDepth(0);
                    gz.gravityDir = obj.gravity || 'up';
                    gz.bounds = new Phaser.Geom.Rectangle(x - tileSize, y - tileSize, gzW, gzH);

                    // Floating arrows inside gravity zone
                    for (let i = 0; i < 8; i++) {
                        const ax = Phaser.Math.Between(gz.x - gzW/2 + 20, gz.x + gzW/2 - 20);
                        const ay = Phaser.Math.Between(gz.y - gzH/2 + 20, gz.y + gzH/2 - 20);
                        const arrow = this.add.image(ax, ay, 'grav_up').setScale(2).setAlpha(0.3).setDepth(1);
                        this.tweens.add({
                            targets: arrow, y: ay - 20, alpha: 0.1,
                            duration: Phaser.Math.Between(1500, 3000), yoyo: true, repeat: -1
                        });
                    }

                    this.gravityZones.push(gz);
                    break;
                }
                case 'checkpoint': {
                    const cp = this.add.image(x, y - 8, 'checkpoint').setScale(scale).setDepth(2);
                    cp.id = obj.id; cp.isActive = false;
                    cp.cpX = x; cp.cpY = y;
                    this.checkpoints.push(cp);
                    break;
                }
                case 'goal': {
                    const goal = this.physics.add.staticImage(x, y - 8, 'goal');
                    goal.setScale(scale).refreshBody().setDepth(2);
                    this.goals.push(goal);
                    break;
                }
            }
        }
    }

    // --- SPAWN PLAYERS ---
    spawnPlayers() {
        const { spawns, tileSize } = this.levelData;
        const scale = 2;
        const humanIndices = this.remotePlayers.map(p => p.colorIndex);

        // Local player
        const sp = spawns[this.localPlayerIndex] || spawns[0];
        this.localPlayer = new Player(this, sp.x * tileSize * scale + tileSize, sp.y * tileSize * scale + tileSize, this.localPlayerIndex, true);
        this.localPlayer.setPlayerName(this.playerName);
        this.physics.add.collider(this.localPlayer, this.groundTiles);
        this.physics.add.collider(this.localPlayer, this.platformTiles);
        this.allPlayers.push(this.localPlayer);

        // Remote players
        if (!this.singlePlayer) {
            for (const rp of this.remotePlayers) {
                if (rp.colorIndex === this.localPlayerIndex) continue;
                const rs = spawns[rp.colorIndex] || spawns[0];
                const remote = new Player(this, rs.x * tileSize * scale + tileSize, rs.y * tileSize * scale + tileSize, rp.colorIndex, false);
                remote.setPlayerName(rp.name);
                remote.body.allowGravity = false;
                this.remotePlayerSprites[rp.id] = remote;
                this.allPlayers.push(remote);
            }
        }

        // AI companions (copycat friends!)
        if (!this.singlePlayer) {
            const friendNames = ['Buddy', 'Echo', 'Shadow', 'Mimic'];
            for (let i = 0; i < 4; i++) {
                if (i === this.localPlayerIndex || humanIndices.includes(i)) continue;
                const as = spawns[i] || spawns[0];
                const ai = new AICompanion(this, as.x * tileSize * scale + tileSize, as.y * tileSize * scale + tileSize, i);
                ai.setPlayerName(friendNames[i] || 'Friend');
                ai.setLeader(this.localPlayer); // AI copies what YOU do!
                this.physics.add.collider(ai, this.groundTiles);
                this.physics.add.collider(ai, this.platformTiles);
                this.aiCompanions.push(ai);
                this.allPlayers.push(ai);
            }
        }

        // --- STACKING: players can stand on each other ---
        this.physics.add.collider(this.allPlayers, this.allPlayers);

        // --- Platform collisions ---
        for (const mp of this.movingPlatforms) {
            this.physics.add.collider(this.localPlayer, mp);
            this.aiCompanions.forEach(ai => this.physics.add.collider(ai, mp));
        }
        for (const fp of this.fallingPlatforms) {
            this.physics.add.collider(this.localPlayer, fp, () => this.triggerFallingPlatform(fp));
            this.aiCompanions.forEach(ai => this.physics.add.collider(ai, fp));
        }

        // --- Door collisions ---
        for (const door of this.doors) {
            this.physics.add.collider(this.localPlayer, door, null, (p, d) => !d.isOpen);
            this.aiCompanions.forEach(ai => this.physics.add.collider(ai, door, null, (p, d) => !d.isOpen));
        }
        if (this.exitDoor) {
            this.physics.add.collider(this.localPlayer, this.exitDoor, null, (p, d) => !d.isOpen);
            this.aiCompanions.forEach(ai => this.physics.add.collider(ai, this.exitDoor, null, (p, d) => !d.isOpen));
        }

        // --- Spike overlaps ---
        for (const spike of this.spikes) {
            this.physics.add.overlap(this.localPlayer, spike, () => this.localPlayer.die());
            this.aiCompanions.forEach(ai => this.physics.add.overlap(ai, spike, () => ai.die()));
        }

        // --- Laser overlaps ---
        for (const laser of this.lasers) {
            this.physics.add.overlap(this.localPlayer, laser.hitbox, () => {
                if (laser.isOn) this.localPlayer.die();
            });
        }
    }

    // --- CAMERA (follows center of all players, zooms out when spread) ---
    setupCamera() {
        this.cameras.main.setZoom(1.3);
    }

    updateCamera() {
        const activePlayers = this.allPlayers.filter(p => p && p.active && !p.isDead);
        if (activePlayers.length === 0) return;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of activePlayers) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Smooth follow
        const cam = this.cameras.main;
        cam.scrollX = Phaser.Math.Linear(cam.scrollX, centerX - cam.width / (2 * cam.zoom), 0.1);
        cam.scrollY = Phaser.Math.Linear(cam.scrollY, centerY - cam.height / (2 * cam.zoom), 0.1);

        // Zoom out when players spread
        const spreadX = maxX - minX;
        const spreadY = maxY - minY;
        const spread = Math.max(spreadX, spreadY);
        const targetZoom = spread > 400 ? Math.max(0.6, 300 / spread) : 1.3;
        cam.zoom = Phaser.Math.Linear(cam.zoom, targetZoom, 0.05);
    }

    // --- HUD ---
    createHUD() {
        const { width, height } = this.scale;
        const pad = 10;

        // Top-left: Level info
        this.hudBg = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.hudBg.fillStyle(0x0a0a1a, 0.8);
        this.hudBg.fillRoundedRect(pad, pad, 220, 50, 6);
        this.hudBg.lineStyle(1, 0x5a4dff, 0.5);
        this.hudBg.strokeRoundedRect(pad, pad, 220, 50, 6);

        this.add.text(pad + 6, pad + 4, 'DATEN', {
            fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#5a4dff'
        }).setScrollFactor(0).setDepth(101);

        this.hudText = this.add.text(pad + 6, pad + 16, 'Level 1 — Anti-Gravity Gauntlet', {
            fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ffffff'
        }).setScrollFactor(0).setDepth(101);

        this.hudStatus = this.add.text(pad + 6, pad + 30, 'SWITCHES: 0/3 • DOORS: 0/3', {
            fontFamily: '"Press Start 2P"', fontSize: '5px', color: '#888'
        }).setScrollFactor(0).setDepth(101);

        // Top-right: Player indicator + controls
        this.hudRight = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.hudRight.fillStyle(0x0a0a1a, 0.8);
        this.hudRight.fillRoundedRect(width - pad - 160, pad, 156, 50, 6);
        this.hudRight.lineStyle(1, 0x5a4dff, 0.5);
        this.hudRight.strokeRoundedRect(width - pad - 160, pad, 156, 50, 6);

        const playerTxt = this.singlePlayer ? 'PLAYERS: 1/1 (SOLO)' : `PLAYERS: ${this.allPlayers.length}/4`;
        this.hudPlayers = this.add.text(width - pad - 154, pad + 4, playerTxt, {
            fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#fff'
        }).setScrollFactor(0).setDepth(101);

        const chainTxt = this.singlePlayer ? 'CHAINS: Offline' : 'CHAINS: Connected';
        this.hudChains = this.add.text(width - pad - 154, pad + 18, chainTxt, {
            fontFamily: '"Press Start 2P"', fontSize: '5px', color: '#8888cc'
        }).setScrollFactor(0).setDepth(101);

        this.hudCheckpoint = this.add.text(width - pad - 154, pad + 32, 'CHECKPOINT: START', {
            fontFamily: '"Press Start 2P"', fontSize: '5px', color: '#888'
        }).setScrollFactor(0).setDepth(101);

        // Top-center: EXIT + RESTART buttons
        const exitBtn = this.add.text(width / 2 - 60, pad + 4, '✕ EXIT', {
            fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ff4444',
            backgroundColor: 'rgba(255,50,50,0.15)', padding: { x: 6, y: 4 }
        }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
        exitBtn.on('pointerdown', () => this.scene.start('MenuScene'));

        const restartBtn = this.add.text(width / 2 + 20, pad + 4, '↻ RESTART', {
            fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ffaa44',
            backgroundColor: 'rgba(255,170,68,0.15)', padding: { x: 6, y: 4 }
        }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => this.scene.restart());

        // Bottom hint
        this.add.text(width / 2, height - 14, 'WASD or Arrows to move • Stay together!', {
            fontFamily: 'Inter', fontSize: '9px', color: '#333355'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    }

    updateHUD() {
        const pressed = this.buttons.filter(b => b.isPressed).length;
        const openDoors = this.doors.filter(d => d.isOpen).length;
        const totalBtns = this.buttons.length;
        const totalDoors = this.doors.length + (this.exitDoor ? 1 : 0);
        const exitOpen = this.exitDoor && this.exitDoor.isOpen ? 1 : 0;

        this.hudStatus.setText(`SWITCHES: ${pressed}/${totalBtns} • DOORS: ${openDoors + exitOpen}/${totalDoors}`);
        this.hudStatus.setColor(pressed === totalBtns ? '#66dd66' : '#888');

        // Chain status
        if (!this.singlePlayer) {
            const maxDist = this.chainSystem.chains.reduce((max, c) => {
                if (!c.a || !c.b) return max;
                return Math.max(max, Phaser.Math.Distance.Between(c.a.x, c.a.y, c.b.x, c.b.y));
            }, 0);
            if (maxDist > this.chainSystem.maxLength * 0.85) {
                this.hudChains.setText('CHAINS: ⚠ STRETCHED!');
                this.hudChains.setColor('#ff4444');
            } else if (maxDist > this.chainSystem.maxLength * 0.6) {
                this.hudChains.setText('CHAINS: Tense');
                this.hudChains.setColor('#ffaa44');
            } else {
                this.hudChains.setText('CHAINS: Connected');
                this.hudChains.setColor('#8888cc');
            }
        }
    }

    // --- LEVEL INTRO ---
    showLevelName() {
        const { width, height } = this.scale;
        const t1 = this.add.text(width/2, height/2 - 30, 'DATEN', {
            fontFamily: '"Press Start 2P"', fontSize: '28px', color: '#fff',
            stroke: '#5a4dff', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);
        const t2 = this.add.text(width/2, height/2 + 5, 'Anti-Gravity Gauntlet', {
            fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#8888cc'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);
        const t3 = this.add.text(width/2, height/2 + 25, 'Work together. Stretch the chain. Defy gravity.', {
            fontFamily: 'Inter', fontSize: '10px', color: '#666688'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);

        this.tweens.add({
            targets: [t1, t2, t3], alpha: 1, duration: 600, hold: 2500, yoyo: true,
            onComplete: () => { t1.destroy(); t2.destroy(); t3.destroy(); }
        });
    }

    // --- BACKGROUND ---
    createBackground(w, h) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x060618, 0x0a0a28, 0x060618, 0x0e0e30, 1);
        bg.fillRect(0, 0, w, h);
        bg.setDepth(-10);

        // Subtle grid lines
        bg.lineStyle(1, 0x1a1a40, 0.2);
        for (let x = 0; x < w; x += 64) bg.lineBetween(x, 0, x, h);
        for (let y = 0; y < h; y += 64) bg.lineBetween(0, y, w, y);
    }

    // --- NETWORK LISTENERS ---
    setupNetworkListeners() {
        window.networkManager.onPlayerMoved = (data) => {
            const remote = this.remotePlayerSprites[data.id];
            if (remote) remote.updateFromNetwork(data);
        };
        window.networkManager.onPlayerLeft = (data) => {
            const remote = this.remotePlayerSprites[data.playerId];
            if (remote) {
                const ci = remote.colorIndex, px = remote.x, py = remote.y;
                remote.destroy();
                delete this.remotePlayerSprites[data.playerId];
                const idx = this.allPlayers.indexOf(remote);
                if (idx > -1) this.allPlayers.splice(idx, 1);

                const ai = new AICompanion(this, px, py, ci);
                ai.setPlayerName('Friend');
                ai.setLeader(this.localPlayer);
                this.physics.add.collider(ai, this.groundTiles);
                this.physics.add.collider(ai, this.platformTiles);
                this.aiCompanions.push(ai);
                this.allPlayers.push(ai);
                this.chainSystem.connectPlayers(this.allPlayers);
            }
        };
        window.networkManager.onGameStateChanged = (data) => {};
        window.networkManager.onGameWon = () => this.showVictory();
    }

    // ============================================================
    // MAIN UPDATE LOOP
    // ============================================================
    update(time, delta) {
        // Local player input
        if (this.localPlayer && !this.localPlayer.isDead && !this.localPlayer.reachedGoal) {
            this.localPlayer.handleInput(this.cursors, this.wasd);
            this.localPlayer.update();

            // Network sync
            this.networkUpdateTimer += delta;
            if (this.networkUpdateTimer >= 33) {
                this.networkUpdateTimer = 0;
                window.networkManager.sendPlayerUpdate({
                    x: this.localPlayer.x, y: this.localPlayer.y,
                    velocityX: this.localPlayer.body.velocity.x,
                    velocityY: this.localPlayer.body.velocity.y,
                    animation: this.localPlayer.currentAnim,
                    flipX: this.localPlayer.flipX
                });
            }
        }

        // Remote players
        for (const id in this.remotePlayerSprites) this.remotePlayerSprites[id].update();

        // AI
        for (const ai of this.aiCompanions) ai.updateAI(delta);

        // Chain physics
        this.chainSystem.update();
        this.chainSystem.draw();

        // Moving platforms
        this.updateMovingPlatforms(delta);

        // Falling platforms
        this.updateFallingPlatforms(delta);

        // Lasers
        this.updateLasers(delta);

        // Gravity zones
        this.checkGravityZones();

        // Buttons & doors
        this.checkButtons();

        // Checkpoints
        this.checkCheckpoints();

        // Exit door
        this.checkExitDoor();

        // Camera follow all players
        this.updateCamera();

        // HUD update
        this.dashboardTimer += delta;
        if (this.dashboardTimer >= 200) {
            this.dashboardTimer = 0;
            this.updateHUD();
        }
    }

    // --- MOVING PLATFORMS ---
    updateMovingPlatforms(delta) {
        for (const mp of this.movingPlatforms) {
            mp.progress += mp.speed * mp.direction * delta * 0.001;
            if (mp.progress >= 1) { mp.progress = 1; mp.direction = -1; }
            else if (mp.progress <= 0) { mp.progress = 0; mp.direction = 1; }
            const nx = Phaser.Math.Linear(mp.startX, mp.endX, mp.progress);
            const ny = Phaser.Math.Linear(mp.startY, mp.endY, mp.progress);
            mp.body.velocity.x = (nx - mp.x) * 60;
            mp.body.velocity.y = (ny - mp.y) * 60;
            mp.x = nx; mp.y = ny;
        }
    }

    // --- FALLING PLATFORMS ---
    triggerFallingPlatform(fp) {
        if (fp.isFalling) return;
        fp.isFalling = true;
        fp.setTint(0xff8888);

        // Shake then fall
        this.tweens.add({
            targets: fp, x: fp.x + 2, duration: 50, yoyo: true, repeat: 6,
            onComplete: () => {
                fp.body.allowGravity = true;
                fp.setImmovable(false);
                // Respawn after 3 seconds
                this.time.delayedCall(3000, () => {
                    fp.body.allowGravity = false;
                    fp.setImmovable(true);
                    fp.y = fp.originalY;
                    fp.body.setVelocity(0, 0);
                    fp.isFalling = false;
                    fp.clearTint();
                });
            }
        });
    }

    updateFallingPlatforms(delta) {
        // Remove platforms that fell off screen
    }

    // --- LASERS ---
    updateLasers(delta) {
        for (const laser of this.lasers) {
            laser.timer += delta;
            if (laser.isOn && laser.timer >= laser.onTime) {
                laser.isOn = false; laser.timer = 0;
                laser.beam.setAlpha(0.1);
                laser.hitbox.body.enable = false;
            } else if (!laser.isOn && laser.timer >= laser.offTime) {
                laser.isOn = true; laser.timer = 0;
                laser.beam.setAlpha(0.6);
                laser.hitbox.body.enable = true;
            }
            // Flicker when on
            if (laser.isOn) {
                laser.beam.setAlpha(0.5 + Math.sin(Date.now() * 0.01) * 0.2);
            }
        }
    }

    // --- GRAVITY ZONES ---
    checkGravityZones() {
        const playersToCheck = [this.localPlayer, ...this.aiCompanions];
        for (const player of playersToCheck) {
            if (!player || player.isDead) continue;
            let inZone = false;
            for (const gz of this.gravityZones) {
                if (gz.bounds.contains(player.x, player.y)) {
                    player.setGravity(gz.gravityDir);
                    inZone = true;
                    break;
                }
            }
            if (!inZone && player.gravityDir !== 'down') {
                player.setGravity('down');
            }
        }
    }

    // --- BUTTONS ---
    checkButtons() {
        const activePlayers = this.allPlayers.filter(p => p && p.active);
        for (const btn of this.buttons) {
            let wasPressed = btn.isPressed;
            btn.isPressed = false;
            for (const player of activePlayers) {
                if (Phaser.Math.Distance.Between(player.x, player.y, btn.x, btn.y) < 28 &&
                    player.body && (player.body.blocked.down || player.body.touching.down || !player.body.allowGravity)) {
                    btn.isPressed = true; break;
                }
            }
            
            // Latch buttons in single player mode so puzzles are solvable alone!
            if (this.singlePlayer && wasPressed) btn.isPressed = true;

            btn.setTexture(btn.isPressed ? 'button_on' : 'button_off');
            if (btn.isPressed !== wasPressed) {
                const door = this.doors.find(d => d.id === btn.linkedDoor);
                if (door) this.setDoorState(door, btn.isPressed);
            }
        }
    }

    setDoorState(door, open) {
        door.isOpen = open;
        door.setTexture(open ? 'door_open' : 'door_closed');
        door.body.enable = !open;
        if (open) this.createDoorParticles(door.x, door.y);
    }

    createDoorParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const p = this.add.circle(x + Phaser.Math.Between(-10,10), y + Phaser.Math.Between(-15,15), 3, 0x66dd66, 1).setDepth(20);
            this.tweens.add({
                targets: p, y: p.y - 30, alpha: 0, scaleX: 0, scaleY: 0,
                duration: 500, onComplete: () => p.destroy()
            });
        }
    }

    // --- CHECKPOINTS ---
    checkCheckpoints() {
        for (const cp of this.checkpoints) {
            if (cp.isActive) continue;
            if (Phaser.Math.Distance.Between(this.localPlayer.x, this.localPlayer.y, cp.cpX, cp.cpY) < 40) {
                cp.isActive = true;
                cp.setTexture('checkpoint_active');

                // Set all players' checkpoints
                for (const p of this.allPlayers) {
                    p.lastCheckpoint = { x: cp.cpX, y: cp.cpY };
                }

                this.hudCheckpoint.setText(`CHECKPOINT: ${cp.id.toUpperCase()}`);
                this.hudCheckpoint.setColor('#4dff7c');

                // Flash effect
                this.cameras.main.flash(200, 77, 255, 124, false);
            }
        }
    }

    // --- EXIT DOOR (opens when ALL players are near) ---
    checkExitDoor() {
        if (!this.exitDoor || this.exitDoor.isOpen) return;

        const activePlayers = this.allPlayers.filter(p => p && p.active && !p.isDead);
        let allNear = activePlayers.length >= 1; // at least someone
        for (const p of activePlayers) {
            if (Phaser.Math.Distance.Between(p.x, p.y, this.exitDoor.x, this.exitDoor.y) > 80) {
                allNear = false; break;
            }
        }

        if (allNear) {
            this.exitDoor.isOpen = true;
            this.exitDoor.setTexture('door_open');
            this.exitDoor.body.enable = false;
            this.createDoorParticles(this.exitDoor.x, this.exitDoor.y);
            this.cameras.main.flash(300, 100, 255, 100);

            // Victory after short delay
            this.time.delayedCall(1000, () => this.showVictory());
        }
    }

    // --- VICTORY SCREEN ---
    showVictory() {
        const { width, height } = this.scale;
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, width * 10, height * 10);
        overlay.setScrollFactor(0).setDepth(300);

        this.add.text(width/2, height/2 - 40, '🎉 LEVEL COMPLETE! 🎉', {
            fontFamily: '"Press Start 2P"', fontSize: '16px', color: '#ffdd44'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(width/2, height/2, 'All players reached the exit!', {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        const playAgain = this.add.text(width/2, height/2 + 40, 'PLAY AGAIN', {
            fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#fff',
            backgroundColor: '#5a4dff', padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true });
        playAgain.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
window.GameScene = GameScene;
