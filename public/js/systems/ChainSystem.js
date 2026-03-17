// ============================================================
// CHAIN SYSTEM — Elastic rope physics connecting all 4 players
// ============================================================
// Uses spring physics to simulate elastic chains between players.
// Each chain segment is drawn as a catenary curve with chain links.
//
// Spring force: F = -k * (distance - restLength)
// Plus damping:  F_d = -d * velocity
// ============================================================

class ChainSystem {
    constructor(scene) {
        this.scene = scene;
        this.chains = [];    // pairs of player connections
        this.graphics = scene.add.graphics().setDepth(5);

        // Chain properties
        this.restLength = 80;     // Natural chain length
        this.maxLength = 250;     // Maximum stretch before force maxes out
        this.stiffness = 0.4;     // Spring stiffness
        this.damping = 0.1;       // Velocity damping
    }

    // Connect all players in a chain: P1-P2-P3-P4
    connectPlayers(players) {
        this.chains = [];
        for (let i = 0; i < players.length - 1; i++) {
            this.chains.push({
                a: players[i],
                b: players[i + 1]
            });
        }
    }

    // Apply spring forces
    update() {
        for (const chain of this.chains) {
            if (!chain.a || !chain.a.active || !chain.b || !chain.b.active) continue;
            if (chain.a.isDead || chain.b.isDead) continue;

            const dx = chain.b.x - chain.a.x;
            const dy = chain.b.y - chain.a.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.restLength) continue; // No force if within rest length

            const stretch = distance - this.restLength;
            const force = stretch * this.stiffness;

            // Normalize direction
            const nx = dx / distance;
            const ny = dy / distance;

            // Apply force to both players (pull them toward each other)
            const fx = nx * force;
            const fy = ny * force;

            // Only apply chain force to players that have physics bodies
            if (chain.a.body && chain.a.isLocal) {
                chain.a.body.velocity.x += fx * 0.5;
                chain.a.body.velocity.y += fy * 0.5;
            }
            if (chain.b.body && chain.b.isLocal) {
                chain.b.body.velocity.x -= fx * 0.5;
                chain.b.body.velocity.y -= fy * 0.5;
            }
        }
    }

    // Draw chains visually
    draw() {
        this.graphics.clear();

        for (const chain of this.chains) {
            if (!chain.a || !chain.a.active || !chain.b || !chain.b.active) continue;

            const ax = chain.a.x, ay = chain.a.y;
            const bx = chain.b.x, by = chain.b.y;
            const dx = bx - ax, dy = by - ay;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Chain color based on tension
            let color, alpha;
            if (distance < this.restLength) {
                color = 0x8888cc; alpha = 0.4;
            } else if (distance < this.maxLength * 0.6) {
                color = 0xaaaaff; alpha = 0.6;
            } else if (distance < this.maxLength * 0.85) {
                color = 0xffaa44; alpha = 0.8;
            } else {
                color = 0xff4444; alpha = 1.0;
            }

            // Draw catenary-style chain (sag in middle)
            const segments = 12;
            const sag = Math.max(0, (this.restLength - distance * 0.5)) * 0.3;

            this.graphics.lineStyle(2, color, alpha);
            this.graphics.beginPath();
            this.graphics.moveTo(ax, ay);

            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const px = ax + dx * t;
                // Parabolic sag
                const sagAmount = sag * 4 * t * (1 - t);
                const py = ay + dy * t + sagAmount;
                this.graphics.lineTo(px, py);
            }

            this.graphics.strokePath();

            // Draw chain link dots
            const dotCount = Math.floor(distance / 20);
            for (let i = 1; i < dotCount; i++) {
                const t = i / dotCount;
                const px = ax + dx * t;
                const sagAmount = sag * 4 * t * (1 - t);
                const py = ay + dy * t + sagAmount;
                this.graphics.fillStyle(color, alpha * 0.8);
                this.graphics.fillCircle(px, py, 2);
            }
        }
    }
}

window.ChainSystem = ChainSystem;
