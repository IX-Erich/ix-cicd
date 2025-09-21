# Asteroids Game Specification

## Overview
A faithful recreation of Atari's 1979 vector shooter "Asteroids" for modern browsers, featuring both classic wireframe and modern shaded rendering modes.

## Core Gameplay Mechanics

### Player Ship
- **Appearance**: Triangular spaceship
- **Movement**: Inertia-based physics - ship drifts after thrusting
- **Controls**:
  - Arrow Keys / WASD: Rotate left/right, thrust forward
  - Spacebar: Shoot bullets
  - Shift: Hyperspace (random teleportation)
  - M: Toggle rendering mode
- **Lives**: Player starts with 3 lives
- **Invulnerability**: Brief invulnerability period after respawn/hyperspace

### Asteroids
- **Types**: Large, Medium, Small (3 sizes)
- **Behavior**: 
  - Float through space with constant velocity
  - Rotate continuously
  - Wrap around screen edges
- **Destruction**: When hit, splits into 2 smaller asteroids (except small ones)
- **Scoring**: 
  - Large asteroid: 20 points
  - Medium asteroid: 50 points  
  - Small asteroid: 100 points

### UFOs (Flying Saucers)
- **Types**: Large UFO (less accurate) and Small UFO (more accurate)
- **Behavior**:
  - Appear randomly after certain score thresholds
  - Move across screen horizontally
  - Shoot at player periodically
- **Scoring**:
  - Large UFO: 200 points
  - Small UFO: 1000 points

### Bullets
- **Player Bullets**: Maximum of 4 on screen at once
- **UFO Bullets**: Aimed toward player position
- **Lifespan**: Bullets disappear after traveling across screen
- **Speed**: Fast, straight-line movement

### Physics
- **Inertia**: All objects maintain velocity unless acted upon
- **Screen Wrapping**: Objects appearing on opposite edge when leaving screen
- **Collision**: Circular collision detection for all objects
- **Rotation**: Smooth rotation with momentum

## Rendering Modes

### Wireframe Mode (Classic)
- **Style**: Bright vector lines on dark background
- **Colors**: 
  - Ship: White (#FFFFFF)
  - Asteroids: White (#FFFFFF)  
  - UFOs: White (#FFFFFF)
  - Bullets: White (#FFFFFF)
  - Background: Black (#000000)
- **Line Width**: 2-3 pixels for visibility

### Shaded Mode (Modern)
- **Style**: Filled polygons with gradients
- **Colors**:
  - Ship: Blue gradient (#4A90E2 to #2E5C8A)
  - Large Asteroids: Brown gradient (#8B4513 to #654321)
  - Medium Asteroids: Gray gradient (#808080 to #404040)
  - Small Asteroids: Dark gray (#606060 to #303030)
  - UFOs: Green gradient (#32CD32 to #228B22)
  - Bullets: Yellow (#FFFF00)
  - Background: Dark blue (#001122)

## User Interface

### HUD Elements
- **Score**: Current score (top-left)
- **High Score**: Best score (top-center)
- **Lives**: Ship icons showing remaining lives (top-right)
- **Render Mode**: Current mode indicator (bottom-right)
- **Level**: Current wave number (bottom-left)

### Game States
- **Start Screen**: Title, instructions, "Press SPACE to Start"
- **Playing**: Active gameplay with HUD
- **Game Over**: Final score, high score, "Press R to Restart"
- **Paused**: "PAUSED - Press P to Continue"

### Controls Reference
```
MOVEMENT:
← → or A D: Rotate ship
↑ or W: Thrust forward
↓ or S: No function (original game didn't have reverse)

ACTIONS:
SPACE: Fire bullet
SHIFT: Hyperspace (emergency teleport)
M: Toggle render mode
P: Pause/Unpause
R: Restart (on game over)
ESC: Return to start screen
```

## Technical Architecture

### Class Structure
```
GameManager
├── manages game state, scoring, lives
├── handles input and rendering mode
└── coordinates all game objects

Ship
├── position, velocity, angle
├── thrust, rotate, shoot methods
└── hyperspace capability

Asteroid  
├── position, velocity, size, rotation
├── split method for destruction
└── collision boundaries

UFO
├── position, velocity, type
├── shooting AI behavior  
└── point value

Bullet
├── position, velocity, owner
├── lifetime tracking
└── collision detection

Vector2 (Utility)
├── x, y coordinates
├── math operations (add, multiply, normalize)
└── distance/collision helpers
```

### File Structure
```
/
├── index.html
├── style.css
├── src/
│   ├── game.js (GameManager)
│   ├── ship.js
│   ├── asteroid.js
│   ├── ufo.js
│   ├── bullet.js
│   ├── vector2.js
│   └── utils.js (collision detection, etc.)
├── docs/
│   └── asteroids_spec.md
└── README.md
```

## Game Balance

### Difficulty Progression
- **Wave 1**: 4 large asteroids
- **Wave 2+**: Previous wave + 2 additional large asteroids
- **UFO Spawning**: After 10,000 points, then every 20,000-25,000 points
- **UFO Accuracy**: Large UFO ~20% accuracy, Small UFO ~80% accuracy

### Scoring Multipliers
- **Consecutive hits**: No multiplier (faithful to original)
- **UFO bonus**: Extra points for hitting UFO while it's shooting
- **Hyperspace penalty**: 50% chance of random destruction (high risk/reward)

## Performance Requirements
- **Frame Rate**: Maintain 60 FPS on modern browsers
- **Responsive Controls**: Input lag < 16ms
- **Memory**: Efficient object pooling for bullets/particles
- **Compatibility**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Success Criteria
- [x] Faithful recreation of original game mechanics
- [x] Smooth inertia-based movement
- [x] Proper asteroid splitting behavior  
- [x] Functional hyperspace with risk
- [x] UFO AI that targets player
- [x] High score persistence (localStorage)
- [x] Toggle between wireframe and shaded modes
- [x] Responsive controls with no lag
- [x] Screen wrapping for all objects
- [x] Proper collision detection
- [x] Sound effects for actions
- [x] Professional UI/UX design

## Audio Specifications

### Sound Effects
- **Thrust**: Low rumbling loop while thrusting
- **Shoot**: Sharp "pew" sound for bullet firing
- **Asteroid Hit**: Rock breaking sound
- **UFO**: Distinctive warbling tone
- **UFO Shoot**: Different pitch bullet sound
- **Ship Destruction**: Explosion sound
- **Hyperspace**: Sci-fi teleport sound
- **UFO Destruction**: Satisfying pop/explosion

### Implementation
- Use Web Audio API for synthesis or small audio files
- Volume controls and mute option
- Audio context management for browser policies