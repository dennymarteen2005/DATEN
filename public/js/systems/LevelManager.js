// ============================================================
// LEVEL MANAGER — DATEN Anti-Gravity Chain Game
// ============================================================
// LONG horizontal scrolling level with 7 sections + final area
// Total width: ~200 tiles (~3200px at 16px tiles)
//
// Grid: 0=air, 1=ground_top, 2=wall, 3=platform, 4=ceiling
// Objects placed using tile coordinates
// ============================================================

class LevelManager {
    static get TOTAL_LEVELS() { return 1; } // One epic long level

    static getLevel(index) {
        return this.createMainLevel();
    }

    static createMainLevel() {
        const W = 200; // Total width in tiles
        const H = 24;  // Height in tiles (taller for anti-grav sections)
        const map = [];

        // Initialize with air
        for (let r = 0; r < H; r++) {
            map[r] = [];
            for (let c = 0; c < W; c++) {
                map[r][c] = 0;
            }
        }

        // --- CEILING (top wall) ---
        for (let c = 0; c < W; c++) { map[0][c] = 2; map[1][c] = 4; }

        // --- FLOOR ---
        for (let c = 0; c < W; c++) { map[H-2][c] = 1; map[H-1][c] = 2; }

        // --- LEFT WALL ---
        for (let r = 0; r < H; r++) { map[r][0] = 2; }

        // --- RIGHT WALL ---
        for (let r = 0; r < H; r++) { map[r][W-1] = 2; }

        // ==========================================
        // SECTION 1: INTRO (cols 2-25)
        // Basic platforms, simple jumps
        // ==========================================
        // Small step platforms
        map[H-4][8] = 3; map[H-4][9] = 3;
        map[H-6][13] = 3; map[H-6][14] = 3; map[H-6][15] = 3;
        map[H-4][19] = 3; map[H-4][20] = 3;
        map[H-6][23] = 3; map[H-6][24] = 3;

        // ==========================================
        // SECTION 2: CO-OP (cols 26-55)
        // High ledges (stacking), narrow gaps, moving platforms
        // ==========================================
        // High wall that needs stacking to reach
        for (let r = 4; r < H-4; r++) { map[r][30] = 2; }
        map[H-4][30] = 0; map[H-3][30] = 0; // Gap at bottom
        map[H-5][30] = 0;
        // Platform above wall
        map[H-8][28] = 3; map[H-8][29] = 3;
        map[H-10][32] = 3; map[H-10][33] = 3;
        map[H-6][36] = 3; map[H-6][37] = 3; map[H-6][38] = 3;
        map[H-4][42] = 3; map[H-4][43] = 3;
        // Narrow corridor
        for (let c = 45; c <= 52; c++) { map[H-6][c] = 1; }
        for (let c = 45; c <= 52; c++) { map[H-9][c] = 4; }

        // ==========================================
        // SECTION 3: OBSTACLES (cols 56-85)
        // Spikes, falling platforms, laser beams
        // ==========================================
        // Platforms over spike gaps
        map[H-4][60] = 3; map[H-4][61] = 3;
        map[H-6][65] = 3; map[H-6][66] = 3;
        map[H-4][70] = 3; map[H-4][71] = 3;
        map[H-6][75] = 3; map[H-6][76] = 3; map[H-6][77] = 3;
        map[H-4][81] = 3; map[H-4][82] = 3;

        // ==========================================
        // SECTION 4: ANTI-GRAVITY (cols 86-115)
        // Gravity flips! Walk on ceiling
        // ==========================================
        // Anti-grav ceiling platforms
        map[4][90] = 3; map[4][91] = 3; map[4][92] = 3;
        map[4][97] = 3; map[4][98] = 3;
        map[4][103] = 3; map[4][104] = 3; map[4][105] = 3;
        // Mid-level platforms for transition
        map[H/2][95] = 3; map[H/2][96] = 3;
        map[H/2][100] = 3; map[H/2][101] = 3; map[H/2][102] = 3;
        // Floor platforms in anti-grav area
        map[H-4][93] = 3; map[H-4][94] = 3;
        map[H-6][108] = 3; map[H-6][109] = 3;
        map[H-4][112] = 3; map[H-4][113] = 3;

        // ==========================================
        // SECTION 5: CHAIN CHALLENGE (cols 116-140)
        // Large gaps requiring chain stretching
        // ==========================================
        // Pillar with anchor point
        for (let r = 4; r < H-2; r++) { map[r][120] = 2; }
        map[H-4][122] = 3; map[H-4][123] = 3;
        // Large gap (no floor from 125-132)
        for (let c = 125; c <= 132; c++) { map[H-2][c] = 0; map[H-1][c] = 0; }
        // Landing platform after gap
        map[H-6][134] = 3; map[H-6][135] = 3; map[H-6][136] = 3;
        map[H-4][138] = 3; map[H-4][139] = 3;

        // ==========================================
        // SECTION 6: PUZZLE AREA (cols 141-170)
        // Buttons that must be pressed simultaneously
        // ==========================================
        // Walls creating puzzle rooms
        for (let r = 8; r < H-2; r++) { map[r][150] = 2; }
        map[H-4][150] = 0; map[H-3][150] = 0; // Door gap
        for (let r = 8; r < H-2; r++) { map[r][160] = 2; }
        map[H-4][160] = 0; map[H-3][160] = 0; // Door gap
        // Platforms in puzzle rooms
        map[H-6][144] = 3; map[H-6][145] = 3;
        map[H-8][148] = 3; map[H-8][149] = 3;
        map[H-6][154] = 3; map[H-6][155] = 3;
        map[H-6][164] = 3; map[H-6][165] = 3;

        // ==========================================
        // SECTION 7: FINAL CHALLENGE (cols 171-190)
        // Everything combined
        // ==========================================
        // Tight platforms with gaps
        map[H-4][174] = 3; map[H-4][175] = 3;
        map[H-6][178] = 3;
        map[H-8][181] = 3; map[H-8][182] = 3;
        map[H-6][185] = 3;
        map[H-4][188] = 3; map[H-4][189] = 3;

        // ==========================================
        // FINAL AREA: EXIT DOOR (cols 191-198)
        // ==========================================
        // Flat area for all players to gather
        for (let c = 192; c <= 197; c++) {
            map[H-2][c] = 1;
        }

        return {
            name: "DATEN — Anti-Gravity Gauntlet",
            subtitle: "Work together. Stretch the chain. Defy gravity.",
            width: W,
            height: H,
            tileSize: 16,
            map: map,
            spawns: [
                { x: 3, y: H - 4 },
                { x: 4, y: H - 4 },
                { x: 5, y: H - 4 },
                { x: 6, y: H - 4 }
            ],
            objects: [
                // SECTION 1: Intro checkpoint
                { type: 'checkpoint', id: 'cp1', x: 15, y: H - 4 },

                // SECTION 3: Spikes (floor)
                { type: 'spike', id: 's1', x: 58, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's2', x: 59, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's3', x: 63, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's4', x: 64, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's5', x: 68, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's6', x: 69, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's7', x: 73, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's8', x: 74, y: H - 3, dir: 'up' },
                // Ceiling spikes
                { type: 'spike', id: 's9', x: 47, y: 2, dir: 'down' },
                { type: 'spike', id: 's10', x: 48, y: 2, dir: 'down' },
                { type: 'spike', id: 's11', x: 49, y: 2, dir: 'down' },

                // Checkpoint after obstacles
                { type: 'checkpoint', id: 'cp2', x: 55, y: H - 4 },

                // SECTION 3: Lasers
                { type: 'laser', id: 'l1', x: 62, y: 6, height: 14, onTime: 2000, offTime: 1500 },
                { type: 'laser', id: 'l2', x: 72, y: 6, height: 14, onTime: 1500, offTime: 2000 },
                { type: 'laser', id: 'l3', x: 79, y: 6, height: 14, onTime: 2000, offTime: 1000 },

                // SECTION 3: Falling platforms
                { type: 'fallingPlatform', id: 'fp1', x: 60, y: H - 8 },
                { type: 'fallingPlatform', id: 'fp2', x: 70, y: H - 8 },

                // SECTION 2-3: Moving platforms
                { type: 'movingPlatform', id: 'mp1', x: 35, y: H - 6, endX: 42, endY: H - 6, speed: 0.6 },
                { type: 'movingPlatform', id: 'mp2', x: 83, y: H - 4, endX: 88, endY: H - 4, speed: 0.8 },

                // Checkpoint before anti-gravity
                { type: 'checkpoint', id: 'cp3', x: 85, y: H - 4 },

                // SECTION 4: Gravity zones
                { type: 'gravityZone', id: 'gz1', x: 88, y: 2, width: 28, height: H - 4, gravity: 'up' },

                // Checkpoint after anti-gravity
                { type: 'checkpoint', id: 'cp4', x: 118, y: H - 4 },

                // SECTION 5: Moving platform over gap
                { type: 'movingPlatform', id: 'mp3', x: 126, y: H - 6, endX: 133, endY: H - 6, speed: 0.5 },

                // SECTION 6: Buttons + Doors
                { type: 'button', id: 'btn1', x: 143, y: H - 3, linkedDoor: 'door1' },
                { type: 'button', id: 'btn2', x: 153, y: H - 3, linkedDoor: 'door2' },
                { type: 'button', id: 'btn3', x: 163, y: H - 3, linkedDoor: 'door3' },
                { type: 'door', id: 'door1', x: 150, y: H - 5 },
                { type: 'door', id: 'door2', x: 160, y: H - 5 },
                { type: 'door', id: 'door3', x: 170, y: H - 5 },

                // Checkpoint before final
                { type: 'checkpoint', id: 'cp5', x: 172, y: H - 4 },

                // SECTION 7: Final challenge
                { type: 'spike', id: 's12', x: 176, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's13', x: 177, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's14', x: 183, y: H - 3, dir: 'up' },
                { type: 'spike', id: 's15', x: 184, y: H - 3, dir: 'up' },
                { type: 'movingPlatform', id: 'mp4', x: 176, y: H - 8, endX: 186, endY: H - 8, speed: 1.0 },
                { type: 'laser', id: 'l4', x: 180, y: 6, height: 14, onTime: 1800, offTime: 1200 },

                // FINAL: Exit door
                { type: 'exitDoor', id: 'exit1', x: 195, y: H - 5 }
            ]
        };
    }
}

window.LevelManager = LevelManager;
