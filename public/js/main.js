// ============================================================
// MAIN.JS — DATEN Game entry point
// ============================================================
// Creates the Phaser game instance with FULLSCREEN support.
// ============================================================

window.addEventListener('load', () => {
    const config = {
        type: Phaser.AUTO,

        // Game fills the entire browser window
        width: window.innerWidth,
        height: window.innerHeight,

        parent: 'game-container',

        // Pixel art settings
        pixelArt: true,
        roundPixels: true,

        backgroundColor: '#0a0a1a',

        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },

        // FULLSCREEN: Scale to fill entire window, auto-resize
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: '100%',
            height: '100%'
        },

        // Register scenes
        scene: [MenuScene, LobbyScene, GameScene]
    };

    const game = new Phaser.Game(config);

    // Handle window resize
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    });

    console.log('🎮 DATEN loaded! Ready to play.');
});
