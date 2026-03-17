# DATEN — Anti-Gravity Chain Co-op Puzzle Platformer 🎮

A **4-player cooperative puzzle platformer** inspired by Pico Park, built with **Phaser.js** and **Socket.IO**.

## 🚀 Features

- **🔗 Elastic Chains** — All players connected with visible rope physics
- **🔄 Anti-Gravity Zones** — Walk on ceilings!
- **🤖 Copycat AI Friends** — Echo, Shadow & Mimic mirror your moves
- **👥 Player Stacking** — Stand on each other like Pico Park
- **⚡ Obstacles** — Spikes, lasers, falling platforms
- **🧩 Puzzles** — Simultaneous button pressing, cooperative doors
- **📷 Dynamic Camera** — Follows all players, zooms when spread
- **🎮 Controls** — WASD + Arrow Keys
- **🚩 Checkpoints** — 5 save points throughout the level
- **🖥️ Fullscreen** — Fills the entire browser

## 🏗️ Tech Stack

- **Frontend:** Phaser.js 3.60, HTML5 Canvas
- **Backend:** Node.js, Express, Socket.IO
- **Sprites:** Programmatically generated (no external assets!)

## 🎯 How to Play

1. **Create a Room** or **Join** with a 4-digit code
2. Move with **WASD** or **Arrow Keys**
3. Work together to reach the **EXIT DOOR**
4. AI bots fill empty slots and copy your movements!

## 📦 Run Locally

```bash
npm install
node server.js
# Open http://localhost:3000
```

## 🌐 Deploy

This game runs on any Node.js hosting (Render, Railway, Heroku):

```bash
# The start command is:
node server.js
```

## 📁 Project Structure

```
├── server.js                    # Express + Socket.IO server
├── public/
│   ├── index.html               # Main HTML
│   ├── css/style.css            # Dark theme styling
│   └── js/
│       ├── main.js              # Phaser config
│       ├── assets/
│       │   └── SpriteGenerator.js   # Programmatic pixel art
│       ├── entities/
│       │   ├── Player.js        # Player with gravity switching
│       │   └── AICompanion.js   # Copycat AI friend
│       ├── systems/
│       │   ├── NetworkManager.js    # Socket.IO wrapper
│       │   ├── LevelManager.js      # 200-tile level design
│       │   └── ChainSystem.js       # Elastic rope physics
│       └── scenes/
│           ├── MenuScene.js     # Animated menu
│           ├── LobbyScene.js    # Room lobby
│           └── GameScene.js     # Core gameplay
```

## 👨‍💻 Made by

Built with ❤️ as an AIML project.
