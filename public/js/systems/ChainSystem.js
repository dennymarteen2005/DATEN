// ============================================================
// CHAIN SYSTEM — Rigid chain constraint connecting all players
// ============================================================
// Pico Park-style RIGID chain. No elasticity. No spring physics.
//
// How it works:
//   1. Each pair of linked players has a maxLength.
//   2. Every frame, if two players exceed maxLength apart,
//      their positions are DIRECTLY corrected (clamped)
//      so they are exactly maxLength apart. No forces.
//   3. The chain is drawn as a tight straight line with
//      chain-link dots — no sag, no curves.
//
// This gives tight, locked-together cooperative movement.
// ============================================================

class ChainSystem {
    constructor(scene) {
        this.scene = scene;
        this.chains = [];    // pairs of player connections
        this.graphics = scene.add.graphics().setDepth(5);

        // Chain properties
        this.maxLength = 120;  // Maximum allowed distance between linked players
    }

    // Connect all players in a chain: P1—P2—P3—P4
    connectPlayers(players) {
        this.chains = [];
        for (let i = 0; i < players.length - 1; i++) {
            this.chains.push({
                a: players[i],
                b: players[i + 1]
            });
        }
    }

    // Enforce rigid distance constraint — NO forces, direct position correction
    update() {
        // Run multiple iterations for stability (Verlet-style)
        const iterations = 3;

        for (let iter = 0; iter < iterations; iter++) {
            for (const chain of this.chains) {
                if (!chain.a || !chain.a.active || !chain.b || !chain.b.active) continue;
                if (chain.a.isDead || chain.b.isDead) continue;

                const dx = chain.b.x - chain.a.x;
                const dy = chain.b.y - chain.a.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Only constrain if exceeding max length
                if (distance <= this.maxLength) continue;

                // How much we need to correct
                const excess = distance - this.maxLength;
                const nx = dx / distance; // normalized direction
                const ny = dy / distance;

                // Determine which players can be moved
                const aIsLocal = chain.a.body && (chain.a.isLocal || chain.a.isAI);
                const bIsLocal = chain.b.body && (chain.b.isLocal || chain.b.isAI);

                if (aIsLocal && bIsLocal) {
                    // Both can move — split correction 50/50
                    const halfExcess = excess * 0.5;
                    chain.a.x += nx * halfExcess;
                    chain.a.y += ny * halfExcess;
                    chain.b.x -= nx * halfExcess;
                    chain.b.y -= ny * halfExcess;

                    // Kill outward velocity to prevent fighting the constraint
                    this.clampVelocity(chain.a, nx, ny, 1);
                    this.clampVelocity(chain.b, nx, ny, -1);
                } else if (aIsLocal) {
                    // Only A can move — pull A toward B
                    chain.a.x += nx * excess;
                    chain.a.y += ny * excess;
                    this.clampVelocity(chain.a, nx, ny, 1);
                } else if (bIsLocal) {
                    // Only B can move — pull B toward A
                    chain.b.x -= nx * excess;
                    chain.b.y -= ny * excess;
                    this.clampVelocity(chain.b, nx, ny, -1);
                }
            }
        }
    }

    // Remove the component of velocity that would pull the player AWAY from the chain
    // This prevents the "snap-back" oscillation completely
    clampVelocity(player, nx, ny, direction) {
        if (!player.body) return;
        const vx = player.body.velocity.x;
        const vy = player.body.velocity.y;

        // Project velocity onto chain direction
        const dot = (vx * nx + vy * ny) * direction;

        // If velocity is pushing AWAY from partner, zero out that component
        if (dot < 0) {
            player.body.velocity.x -= nx * dot * direction;
            player.body.velocity.y -= ny * dot * direction;
        }
    }

    // Draw chains visually — tight straight lines with chain-link dots
    draw() {
        this.graphics.clear();

        for (const chain of this.chains) {
            if (!chain.a || !chain.a.active || !chain.b || !chain.b.active) continue;

            const ax = chain.a.x, ay = chain.a.y;
            const bx = chain.b.x, by = chain.b.y;
            const dx = bx - ax, dy = by - ay;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Chain color based on tension
            const ratio = distance / this.maxLength;
            let color, alpha;
            if (ratio < 0.5) {
                color = 0x8888cc; alpha = 0.4;  // slack — dim blue
            } else if (ratio < 0.8) {
                color = 0xaaaaff; alpha = 0.6;  // moderate — brighter blue
            } else if (ratio < 0.95) {
                color = 0xffaa44; alpha = 0.8;  // tight — orange warning
            } else {
                color = 0xff4444; alpha = 1.0;  // maxed — red
            }

            // Draw a straight line (no sag, no catenary — rigid chain)
            this.graphics.lineStyle(2, color, alpha);
            this.graphics.beginPath();
            this.graphics.moveTo(ax, ay);
            this.graphics.lineTo(bx, by);
            this.graphics.strokePath();

            // Draw chain link dots along the straight line
            const linkSpacing = 14;
            const linkCount = Math.max(1, Math.floor(distance / linkSpacing));
            for (let i = 1; i < linkCount; i++) {
                const t = i / linkCount;
                const px = ax + dx * t;
                const py = ay + dy * t;

                // Alternate between larger and smaller dots for chain-link feel
                const radius = (i % 2 === 0) ? 2.5 : 1.5;
                this.graphics.fillStyle(color, alpha * 0.9);
                this.graphics.fillCircle(px, py, radius);
            }
        }
    }
}

window.ChainSystem = ChainSystem;
