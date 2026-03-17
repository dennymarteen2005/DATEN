// ============================================================
// PLAYER.JS — DATEN Anti-Gravity Player with Chain Support
// ============================================================
// Features:
// - Gravity switching (normal, reverse, side)
// - Stacking (can stand on top of other players)
// - Chain attachment point for elastic rope physics
// - Smooth movement with coyote time jump
// - WASD + Arrow Keys
// ============================================================

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, colorIndex, isLocal = false) {
        super(scene, x, y, `player_${colorIndex}_idle_0`);
        this.scene = scene;
        this.colorIndex = colorIndex;
        this.isLocal = isLocal;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(10, 14);
        this.body.setOffset(3, 2);
        this.body.setBounce(0.15); // Slight bounce for fun feel
        this.body.setMaxVelocity(180, 400);
        this.setScale(2);
        this.setDepth(10);

        // Movement
        this.moveSpeed = 160;
        this.jumpForce = -330;
        this.coyoteTime = 100;
        this.coyoteTimer = 0;
        this.hasJumped = false;

        // Gravity state
        this.gravityDir = 'down'; // 'down', 'up', 'left', 'right'
        this.body.setGravityY(600);

        // State
        this.isOnGround = false;
        this.isDead = false;
        this.reachedGoal = false;
        this.currentAnim = 'idle';
        this.lastCheckpoint = { x, y };

        // Chain point (where the elastic rope connects)
        this.chainPoint = { x: this.x, y: this.y };

        // Animations
        this.createAnimations();

        // Arrow indicator
        this.arrow = scene.add.image(x, y - 20, `arrow_${colorIndex}`);
        this.arrow.setScale(2).setDepth(11).setAlpha(0.8);
        scene.tweens.add({
            targets: this.arrow, y: '-=6',
            duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        this.nameTag = null;
    }

    setPlayerName(name) {
        if (this.nameTag) this.nameTag.destroy();
        this.nameTag = this.scene.add.text(this.x, this.y - 36, name, {
            fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#fff', align: 'center'
        }).setOrigin(0.5).setDepth(12).setAlpha(0.7);
    }

    createAnimations() {
        const ci = this.colorIndex;
        if (!this.scene.anims.exists(`player_${ci}_idle`)) {
            this.scene.anims.create({ key: `player_${ci}_idle`, frames: [{ key: `player_${ci}_idle_0` },{ key: `player_${ci}_idle_1` }], frameRate: 3, repeat: -1 });
        }
        if (!this.scene.anims.exists(`player_${ci}_run`)) {
            this.scene.anims.create({ key: `player_${ci}_run`, frames: [{ key: `player_${ci}_run_0` },{ key: `player_${ci}_run_1` },{ key: `player_${ci}_run_2` },{ key: `player_${ci}_run_3` }], frameRate: 10, repeat: -1 });
        }
        if (!this.scene.anims.exists(`player_${ci}_jump`)) {
            this.scene.anims.create({ key: `player_${ci}_jump`, frames: [{ key: `player_${ci}_jump_0` }], frameRate: 1, repeat: 0 });
        }
        this.play(`player_${ci}_idle`);
    }

    // --- SET GRAVITY DIRECTION ---
    setGravity(dir) {
        if (this.gravityDir === dir) return;
        this.gravityDir = dir;
        switch(dir) {
            case 'down':
                this.body.setGravityY(600); this.body.setGravityX(0);
                this.setAngle(0); break;
            case 'up':
                this.body.setGravityY(-600); this.body.setGravityX(0);
                this.setAngle(180); break;
            case 'left':
                this.body.setGravityX(-600); this.body.setGravityY(0);
                this.setAngle(90); break;
            case 'right':
                this.body.setGravityX(600); this.body.setGravityY(0);
                this.setAngle(-90); break;
        }
    }

    // --- INPUT HANDLING (WASD + Arrows + Touch) ---
    handleInput(cursors, wasd, touchControls) {
        if (this.isDead || this.reachedGoal) {
            this.body.setVelocityX(0);
            return;
        }

        this.isOnGround = this.body.blocked.down || this.body.touching.down || (this.body.allowGravity === false && this.body.blocked.up);

        if (this.isOnGround) {
            this.coyoteTimer = this.coyoteTime;
            this.hasJumped = false;
        } else {
            this.coyoteTimer -= this.scene.game.loop.delta;
        }

        const left =  cursors.left.isDown  || (wasd && wasd.A.isDown) || (touchControls && touchControls.left);
        const right = cursors.right.isDown || (wasd && wasd.D.isDown) || (touchControls && touchControls.right);

        if (left) {
            this.body.setVelocityX(-this.moveSpeed);
            this.setFlipX(true);
        } else if (right) {
            this.body.setVelocityX(this.moveSpeed);
            this.setFlipX(false);
        } else {
            this.body.setVelocityX(this.body.velocity.x * 0.82);
            if (Math.abs(this.body.velocity.x) < 5) this.body.setVelocityX(0);
        }

        const jumpJustPressed = Phaser.Input.Keyboard.JustDown(cursors.up) ||
                                (wasd && Phaser.Input.Keyboard.JustDown(wasd.W));
        // For touch, we need to ensure they don't hold it and fly. We only trigger on first touch down flag
        const touchJump = touchControls && touchControls.up;
        let jumpWantsTrigger = jumpJustPressed;
        if (touchJump && !this.wasTouchingJump) jumpWantsTrigger = true;
        this.wasTouchingJump = touchJump;

        if (jumpWantsTrigger && this.coyoteTimer > 0 && !this.hasJumped) {
            if (this.gravityDir === 'down') {
                this.body.setVelocityY(this.jumpForce);
            } else if (this.gravityDir === 'up') {
                this.body.setVelocityY(-this.jumpForce);
            }
            this.hasJumped = true;
            this.coyoteTimer = 0;
        }

        // Animation
        let newAnim = 'idle';
        if (!this.isOnGround) newAnim = 'jump';
        else if (Math.abs(this.body.velocity.x) > 10) newAnim = 'run';
        if (newAnim !== this.currentAnim) {
            this.currentAnim = newAnim;
            this.play(`player_${this.colorIndex}_${newAnim}`);
        }
    }

    // --- DIE & RESPAWN ---
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.setAlpha(0.3);
        this.body.setVelocity(0, 0);

        this.scene.cameras.main.shake(200, 0.01);

        this.scene.time.delayedCall(500, () => {
            this.setPosition(this.lastCheckpoint.x, this.lastCheckpoint.y);
            this.body.setVelocity(0, 0);
            this.setGravity('down');
            this.setAlpha(1);
            this.isDead = false;
        });
    }

    // --- UPDATE ---
    update() {
        this.chainPoint.x = this.x;
        this.chainPoint.y = this.y;

        if (this.arrow) {
            this.arrow.x = this.x;
            this.arrow.y = this.y - 24;
        }
        if (this.nameTag) {
            this.nameTag.x = this.x;
            this.nameTag.y = this.y - 36;
        }
    }

    updateFromNetwork(data) {
        this.x = Phaser.Math.Linear(this.x, data.x, 0.3);
        this.y = Phaser.Math.Linear(this.y, data.y, 0.3);
        if (data.animation && data.animation !== this.currentAnim) {
            this.currentAnim = data.animation;
            this.play(`player_${this.colorIndex}_${data.animation}`);
        }
        if (data.flipX !== undefined) this.setFlipX(data.flipX);
    }

    destroy() {
        if (this.arrow) this.arrow.destroy();
        if (this.nameTag) this.nameTag.destroy();
        super.destroy();
    }
}
window.Player = Player;
