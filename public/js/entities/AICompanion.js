// ============================================================
// AI COMPANION — "Copycat Friend" Mode
// ============================================================
// The AI copies whatever the local player does:
// - Mirrors movement direction
// - Jumps when player jumps
// - Follows the same path with a slight offset
// Like a best friend who does everything you do!
// ============================================================

class AICompanion extends Player {
    constructor(scene, x, y, colorIndex) {
        super(scene, x, y, colorIndex, false);

        // --- Copycat settings ---
        this.leader = null;           // The player we copy
        this.followOffsetX = 0;       // Offset from leader
        this.followDelay = 150 + colorIndex * 80; // Slight delay per bot (ms)
        this.inputBuffer = [];        // Buffer of leader's inputs
        this.bufferTime = 0;

        // --- State ---
        this.copyMoveX = 0;
        this.copyJump = false;
        this.lastLeaderX = 0;
        this.lastLeaderY = 0;
        this.lastLeaderVelX = 0;
        this.lastLeaderVelY = 0;
        this.lastLeaderFlipX = false;
        this.lastLeaderAnim = 'idle';

        this.setAlpha(0.9);

        // AI badge
        this.aiBadge = scene.add.text(x, y - 44, '🤖', {
            fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ffdd44',
            backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 2, y: 1 }
        }).setOrigin(0.5).setDepth(13);
    }

    // Set which player to copy
    setLeader(player) {
        this.leader = player;
        // Each AI bot has a different offset so they don't overlap
        const offsets = [
            { x: 35, y: 0 },
            { x: -35, y: 0 },
            { x: 0, y: 0 }
        ];
        const idx = Math.min(this.colorIndex, offsets.length - 1);
        this.followOffsetX = offsets[idx].x;
    }

    // --- MAIN UPDATE ---
    updateAI(delta) {
        if (this.isDead || this.reachedGoal || !this.leader) {
            this.body.setVelocityX(0);
            return;
        }

        // Record leader's current state into buffer
        this.bufferTime += delta;
        if (this.bufferTime >= 16) { // ~60fps sampling
            this.bufferTime = 0;
            this.inputBuffer.push({
                time: Date.now(),
                velX: this.leader.body.velocity.x,
                velY: this.leader.body.velocity.y,
                x: this.leader.x,
                y: this.leader.y,
                flipX: this.leader.flipX,
                anim: this.leader.currentAnim,
                onGround: this.leader.body.blocked.down || this.leader.body.touching.down
            });

            // Keep buffer manageable (last 2 seconds)
            while (this.inputBuffer.length > 120) {
                this.inputBuffer.shift();
            }
        }

        // Find the delayed input (replay leader's actions with delay)
        const targetTime = Date.now() - this.followDelay;
        let input = null;
        for (let i = this.inputBuffer.length - 1; i >= 0; i--) {
            if (this.inputBuffer[i].time <= targetTime) {
                input = this.inputBuffer[i];
                break;
            }
        }

        // Fall back to current leader state if no buffered input
        if (!input) {
            input = {
                velX: this.leader.body.velocity.x,
                velY: this.leader.body.velocity.y,
                x: this.leader.x,
                y: this.leader.y,
                flipX: this.leader.flipX,
                anim: this.leader.currentAnim,
                onGround: this.leader.body.blocked.down
            };
        }

        this.isOnGround = this.body.blocked.down || this.body.touching.down;

        // --- COPY the leader's velocity ---
        // Mirror horizontal movement
        this.body.setVelocityX(input.velX);

        // Mirror direction
        this.setFlipX(input.flipX);

        // --- COPY jumps ---
        // If the leader was jumping (negative velY) and we're on ground, jump too
        if (input.velY < -100 && this.isOnGround) {
            this.body.setVelocityY(this.jumpForce);
        }

        // --- Follow position (keep near leader with offset) ---
        const targetX = input.x + this.followOffsetX;
        const dx = targetX - this.x;

        // If we're too far from leader, pull toward them
        if (Math.abs(dx) > 120) {
            const pullForce = dx * 0.05;
            this.body.velocity.x += pullForce;
        }

        // --- COPY animation ---
        let newAnim = input.anim || 'idle';
        if (!this.isOnGround) newAnim = 'jump';
        else if (Math.abs(this.body.velocity.x) > 10) newAnim = 'run';

        if (newAnim !== this.currentAnim) {
            this.currentAnim = newAnim;
            this.play(`player_${this.colorIndex}_${newAnim}`);
        }

        // Update visuals
        this.update();
        if (this.aiBadge) {
            this.aiBadge.x = this.x;
            this.aiBadge.y = this.y - 44;
        }
    }

    destroy() {
        if (this.aiBadge) this.aiBadge.destroy();
        super.destroy();
    }
}

window.AICompanion = AICompanion;
