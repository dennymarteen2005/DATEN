// ============================================================
// SPRITE GENERATOR — DATEN Anti-Gravity Co-op Game
// ============================================================
// Generates all pixel art sprites for:
// - Players (4 colors), Tiles, Gravity zones
// - Obstacles: spikes, lasers, falling platforms
// - Objects: buttons, doors, checkpoints, keys
// - Particles and UI elements
// ============================================================

class SpriteGenerator {
    static generateAll(scene) {
        this.generatePlayerSprites(scene);
        this.generateTileSprites(scene);
        this.generateObstacleSprites(scene);
        this.generateObjectSprites(scene);
        this.generateGravityZoneSprites(scene);
        this.generateParticles(scene);
        this.generateUIElements(scene);
    }

    // --- PLAYERS (4 colors, wider for stacking) ---
    static generatePlayerSprites(scene) {
        const colors = [
            { name: 'red',    body: '#ff4d6a', dark: '#c43050', light: '#ff8fa3', eye: '#fff' },
            { name: 'blue',   body: '#4d9fff', dark: '#3070c4', light: '#8fc4ff', eye: '#fff' },
            { name: 'yellow', body: '#ffdd4d', dark: '#c4a830', light: '#ffee8f', eye: '#fff' },
            { name: 'green',  body: '#4dff7c', dark: '#30c450', light: '#8fff9f', eye: '#fff' }
        ];
        colors.forEach((c, i) => {
            this.drawPlayer(scene, `player_${i}_idle_0`, c, 'idle', 0);
            this.drawPlayer(scene, `player_${i}_idle_1`, c, 'idle', 1);
            this.drawPlayer(scene, `player_${i}_run_0`, c, 'run', 0);
            this.drawPlayer(scene, `player_${i}_run_1`, c, 'run', 1);
            this.drawPlayer(scene, `player_${i}_run_2`, c, 'run', 2);
            this.drawPlayer(scene, `player_${i}_run_3`, c, 'run', 3);
            this.drawPlayer(scene, `player_${i}_jump_0`, c, 'jump', 0);
        });
    }

    static drawPlayer(scene, key, color, anim, frame) {
        const s = 16;
        const c = document.createElement('canvas');
        c.width = s; c.height = s;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, s, s);
        let yOff = 0, legOff = 0;
        if (anim === 'idle') yOff = frame === 0 ? 0 : -1;
        else if (anim === 'run') { yOff = frame % 2 === 0 ? 0 : -1; legOff = frame; }
        else if (anim === 'jump') yOff = -1;
        const by = 2 + yOff;
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(4, 14, 8, 2);
        ctx.fillStyle = color.body;
        ctx.fillRect(4, by+2, 8, 7); ctx.fillRect(3, by+3, 10, 5);
        ctx.fillRect(4, by, 8, 4); ctx.fillRect(3, by+1, 10, 2);
        ctx.fillStyle = color.light;
        ctx.fillRect(5, by, 3, 1); ctx.fillRect(4, by+1, 2, 1);
        ctx.fillStyle = color.eye;
        ctx.fillRect(6, by+2, 2, 2); ctx.fillRect(10, by+2, 2, 2);
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(7, by+3, 1, 1); ctx.fillRect(11, by+3, 1, 1);
        ctx.fillStyle = color.dark;
        ctx.fillRect(8, by+5, 2, 1);
        if (anim === 'run') {
            if (legOff===0||legOff===2) { ctx.fillRect(5,by+9,2,3); ctx.fillRect(9,by+9,2,3); }
            else if (legOff===1) { ctx.fillRect(4,by+9,2,3); ctx.fillRect(10,by+9,2,2); }
            else { ctx.fillRect(6,by+9,2,2); ctx.fillRect(9,by+9,2,3); }
        } else if (anim === 'jump') { ctx.fillRect(4,by+9,2,2); ctx.fillRect(10,by+9,2,2); }
        else { ctx.fillRect(5,by+9,2,3); ctx.fillRect(9,by+9,2,3); }
        if (anim !== 'jump') { ctx.fillStyle = color.body; ctx.fillRect(4,by+11,3,1); ctx.fillRect(9,by+11,3,1); }
        scene.textures.addCanvas(key, c);
    }

    // --- TILES ---
    static generateTileSprites(scene) {
        this.tex(scene, 'tile_ground', 16, 16, ctx => {
            ctx.fillStyle = '#2a2a4a'; ctx.fillRect(0,0,16,16);
            ctx.fillStyle = '#33335a'; ctx.fillRect(0,0,16,1); ctx.fillRect(0,0,1,16);
            ctx.fillStyle = '#222240'; ctx.fillRect(15,0,1,16); ctx.fillRect(0,15,16,1);
            ctx.fillStyle = '#2e2e52'; ctx.fillRect(4,4,1,1); ctx.fillRect(12,8,1,1);
        });
        this.tex(scene, 'tile_ground_top', 16, 16, ctx => {
            ctx.fillStyle = '#2a2a4a'; ctx.fillRect(0,0,16,16);
            ctx.fillStyle = '#5a4dff'; ctx.fillRect(0,0,16,2);
            ctx.fillStyle = '#4840d0'; ctx.fillRect(0,2,16,1);
            ctx.fillStyle = '#222240'; ctx.fillRect(15,0,1,16); ctx.fillRect(0,15,16,1);
        });
        this.tex(scene, 'tile_ceiling', 16, 16, ctx => {
            ctx.fillStyle = '#2a2a4a'; ctx.fillRect(0,0,16,16);
            ctx.fillStyle = '#ff4d6a'; ctx.fillRect(0,14,16,2);
            ctx.fillStyle = '#c43050'; ctx.fillRect(0,13,16,1);
        });
        this.tex(scene, 'tile_wall', 16, 16, ctx => {
            ctx.fillStyle = '#1a1a30'; ctx.fillRect(0,0,16,16);
            ctx.fillStyle = '#222245'; ctx.fillRect(1,1,14,14);
            ctx.fillStyle = '#1e1e3a'; ctx.fillRect(0,8,16,1); ctx.fillRect(8,0,1,16);
        });
        this.tex(scene, 'tile_platform', 16, 16, ctx => {
            ctx.clearRect(0,0,16,16);
            ctx.fillStyle = '#6a5acd'; ctx.fillRect(0,0,16,4);
            ctx.fillStyle = '#8070e0'; ctx.fillRect(0,0,16,1);
            ctx.fillStyle = '#5848b0'; ctx.fillRect(0,3,16,1);
        });
        this.tex(scene, 'tile_bg', 16, 16, ctx => {
            ctx.fillStyle = '#0e0e20'; ctx.fillRect(0,0,16,16);
            ctx.fillStyle = 'rgba(100,80,200,0.15)';
            ctx.fillRect(3,5,1,1); ctx.fillRect(11,2,1,1); ctx.fillRect(7,11,1,1);
        });
    }

    // --- OBSTACLES ---
    static generateObstacleSprites(scene) {
        // Spike up
        this.tex(scene, 'spike_up', 16, 16, ctx => {
            ctx.clearRect(0,0,16,16);
            ctx.fillStyle = '#ff4444';
            for(let i=0;i<4;i++){let x=i*4;ctx.fillRect(x+1,8,2,4);ctx.fillRect(x+1,6,2,2);ctx.fillRect(x+2,4,1,2);}
            ctx.fillStyle = '#cc2222'; ctx.fillRect(0,12,16,4);
        });
        // Spike down (ceiling)
        this.tex(scene, 'spike_down', 16, 16, ctx => {
            ctx.clearRect(0,0,16,16);
            ctx.fillStyle = '#ff4444';
            for(let i=0;i<4;i++){let x=i*4;ctx.fillRect(x+1,4,2,4);ctx.fillRect(x+1,8,2,2);ctx.fillRect(x+2,10,1,2);}
            ctx.fillStyle = '#cc2222'; ctx.fillRect(0,0,16,4);
        });
        // Laser (vertical beam)
        this.tex(scene, 'laser_on', 4, 32, ctx => {
            ctx.fillStyle = '#ff0044'; ctx.fillRect(0,0,4,32);
            ctx.fillStyle = '#ff4488'; ctx.fillRect(1,0,2,32);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(1,0,1,32);
        });
        this.tex(scene, 'laser_off', 4, 32, ctx => {
            ctx.fillStyle = 'rgba(255,0,68,0.15)'; ctx.fillRect(1,0,2,32);
        });
        // Laser emitter
        this.tex(scene, 'laser_emitter', 8, 8, ctx => {
            ctx.fillStyle = '#444'; ctx.fillRect(0,0,8,8);
            ctx.fillStyle = '#ff0044'; ctx.fillRect(2,2,4,4);
        });
        // Falling platform
        this.tex(scene, 'falling_platform', 48, 8, ctx => {
            ctx.fillStyle = '#c8a030'; ctx.fillRect(0,0,48,8);
            ctx.fillStyle = '#e0b840'; ctx.fillRect(0,0,48,2);
            ctx.fillStyle = '#aa8020'; ctx.fillRect(0,6,48,2);
            // Crack lines
            ctx.fillStyle = '#907020'; ctx.fillRect(12,2,1,4); ctx.fillRect(24,1,1,5); ctx.fillRect(36,2,1,4);
        });
        // Moving platform
        this.tex(scene, 'moving_platform', 48, 8, ctx => {
            ctx.fillStyle = '#e8a030'; ctx.fillRect(0,0,48,8);
            ctx.fillStyle = '#f0b848'; ctx.fillRect(0,0,48,2);
            ctx.fillStyle = '#d09028'; ctx.fillRect(0,6,48,2);
            ctx.fillStyle = '#c88020'; for(let i=0;i<5;i++) ctx.fillRect(4+i*10,3,2,2);
        });
    }

    // --- GAME OBJECTS ---
    static generateObjectSprites(scene) {
        this.tex(scene, 'button_off', 16, 16, ctx => {
            ctx.clearRect(0,0,16,16); ctx.fillStyle='#888'; ctx.fillRect(2,12,12,4);
            ctx.fillStyle='#aaa'; ctx.fillRect(4,10,8,2); ctx.fillStyle='#666'; ctx.fillRect(2,15,12,1);
        });
        this.tex(scene, 'button_on', 16, 16, ctx => {
            ctx.clearRect(0,0,16,16); ctx.fillStyle='#44aa44'; ctx.fillRect(2,13,12,3);
            ctx.fillStyle='#66dd66'; ctx.fillRect(4,12,8,1); ctx.fillStyle='#338833'; ctx.fillRect(2,15,12,1);
        });
        // Exit door (large)
        this.tex(scene, 'door_closed', 32, 48, ctx => {
            ctx.fillStyle = '#443322'; ctx.fillRect(2,0,28,48);
            ctx.fillStyle = '#332211'; ctx.fillRect(2,0,28,2); ctx.fillRect(2,0,2,48); ctx.fillRect(28,0,2,48);
            ctx.fillStyle = '#554433'; ctx.fillRect(6,4,20,18); ctx.fillRect(6,26,20,18);
            ctx.fillStyle = '#ffcc00'; ctx.fillRect(22,22,4,4); // handle
            // EXIT text
            ctx.fillStyle = '#ff4444'; ctx.fillRect(10,8,2,2); ctx.fillRect(14,8,2,2);ctx.fillRect(18,8,2,2);ctx.fillRect(22,8,2,2);
        });
        this.tex(scene, 'door_open', 32, 48, ctx => {
            ctx.fillStyle = '#1a1a30'; ctx.fillRect(2,0,28,48);
            ctx.fillStyle = '#111'; ctx.fillRect(4,2,24,44);
            ctx.fillStyle = '#66ff66'; ctx.fillRect(12,16,8,2); ctx.fillRect(15,12,2,10); // arrow
            ctx.fillRect(13,14,6,2);
        });
        // Checkpoint flag
        this.tex(scene, 'checkpoint', 16, 32, ctx => {
            ctx.clearRect(0,0,16,32); ctx.fillStyle='#aaa'; ctx.fillRect(3,0,2,32);
            ctx.fillStyle='#fff'; ctx.fillRect(3,0,1,32);
            ctx.fillStyle='#4d9fff'; ctx.fillRect(5,2,9,8);
            ctx.fillStyle='#8fc4ff'; ctx.fillRect(5,2,9,2);
        });
        this.tex(scene, 'checkpoint_active', 16, 32, ctx => {
            ctx.clearRect(0,0,16,32); ctx.fillStyle='#ffdd44'; ctx.fillRect(3,0,2,32);
            ctx.fillStyle='#fff'; ctx.fillRect(3,0,1,32);
            ctx.fillStyle='#4dff7c'; ctx.fillRect(5,2,9,8);
            ctx.fillStyle='#8fff9f'; ctx.fillRect(5,2,9,2);
        });
        // Goal flag
        this.tex(scene, 'goal', 16, 32, ctx => {
            ctx.clearRect(0,0,16,32); ctx.fillStyle='#ccc'; ctx.fillRect(3,0,2,32);
            ctx.fillStyle='#fff'; ctx.fillRect(3,0,1,32);
            ctx.fillStyle='#ff4d6a'; ctx.fillRect(5,2,9,8);
            ctx.fillStyle='#ff8fa3'; ctx.fillRect(5,2,9,2);
            ctx.fillStyle='#fff'; ctx.fillRect(8,4,3,1); ctx.fillRect(9,3,1,3);
        });
        // Key
        this.tex(scene, 'key', 12, 12, ctx => {
            ctx.clearRect(0,0,12,12);
            ctx.fillStyle='#ffdd44'; ctx.fillRect(3,1,6,6); ctx.fillRect(5,0,2,8);
            ctx.fillStyle='#0e0e20'; ctx.fillRect(5,3,2,2);
            ctx.fillStyle='#ffdd44'; ctx.fillRect(5,7,2,4); ctx.fillRect(7,9,2,1); ctx.fillRect(7,7,2,1);
        });
    }

    // --- GRAVITY ZONE indicators ---
    static generateGravityZoneSprites(scene) {
        // Gravity up indicator (arrow pointing up)
        this.tex(scene, 'grav_up', 16, 16, ctx => {
            ctx.clearRect(0,0,16,16);
            ctx.fillStyle='rgba(255,77,106,0.4)';
            ctx.fillRect(7,2,2,12); ctx.fillRect(5,4,6,2); ctx.fillRect(6,2,4,2);
        });
        // Gravity down indicator
        this.tex(scene, 'grav_down', 16, 16, ctx => {
            ctx.clearRect(0,0,16,16);
            ctx.fillStyle='rgba(77,159,255,0.4)';
            ctx.fillRect(7,2,2,12); ctx.fillRect(5,10,6,2); ctx.fillRect(6,12,4,2);
        });
        // Gravity zone overlay
        this.tex(scene, 'grav_zone_reverse', 16, 16, ctx => {
            ctx.fillStyle='rgba(255,50,80,0.08)'; ctx.fillRect(0,0,16,16);
        });
        this.tex(scene, 'grav_zone_normal', 16, 16, ctx => {
            ctx.fillStyle='rgba(50,80,255,0.05)'; ctx.fillRect(0,0,16,16);
        });
    }

    // --- PARTICLES ---
    static generateParticles(scene) {
        this.tex(scene, 'particle', 4, 4, ctx => {
            ctx.fillStyle='#fff'; ctx.fillRect(1,0,2,1); ctx.fillRect(0,1,4,2); ctx.fillRect(1,3,2,1);
        });
        this.tex(scene, 'star_particle', 8, 8, ctx => {
            ctx.fillStyle='#ffdd44'; ctx.fillRect(3,0,2,8); ctx.fillRect(0,3,8,2); ctx.fillRect(2,2,4,4);
        });
        this.tex(scene, 'chain_link', 4, 4, ctx => {
            ctx.fillStyle='#aaaacc'; ctx.fillRect(1,0,2,4); ctx.fillRect(0,1,4,2);
        });
    }

    // --- UI ---
    static generateUIElements(scene) {
        const cols = ['#ff4d6a','#4d9fff','#ffdd4d','#4dff7c'];
        cols.forEach((c,i) => {
            this.tex(scene, `arrow_${i}`, 8, 6, ctx => {
                ctx.fillStyle=c; ctx.fillRect(1,0,6,2); ctx.fillRect(2,2,4,2); ctx.fillRect(3,4,2,2);
            });
        });
    }

    static tex(scene, key, w, h, fn) {
        const c = document.createElement('canvas'); c.width=w; c.height=h;
        const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled=false; fn(ctx);
        scene.textures.addCanvas(key, c);
    }
}
window.SpriteGenerator = SpriteGenerator;
