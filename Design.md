# Gather AI Clone - Project Design

## Based on Gather.town Features

---

## 1. Core Features (MVP)

### 1.1 Virtual 2D Workspace
- 2D top-down map (like Gather.town)
- Avatar-based presence
- Real-time multiplayer sync

### 1.2 Proximity-Based Communication
- **Walk up and talk** - No meeting links needed
- Audio/Video activates within 200px radius
- Muted by default
- User controls what they hear

### 1.3 Status Indicators
- **Available** - Green, open for conversation
- **Busy/Focus** - Red, do not disturb
- **In Meeting** - Yellow, in a call
- **Away** - Gray, inactive

### 1.4 Avatar System (MVP - Phase 1)
Users select a geometric shape and color to represent themselves.

**Shapes:**
- Circle
- Square
- Triangle
- Diamond
- Hexagon

**Colors:**
- Predefined palette of 12 colors
- Hex values stored in database

**Future (Phase 2):**
- Full RPG character customization
- Hair styles, glasses, hats
- Shirts, pants, shoes
- Multiple skin tones

---

## 2. Core Mechanics: Movement & Navigation

**Grid-Based Movement:** 32x32 pixel grid.

**Controls:** WASD or Arrow Keys.

**Ghost Mode:** Hold 'G' to pass through collisions (opacity 0.5).

---

## 3. Spatial Presence: Proximity Audio & Video

**Distance Formula:**
$$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$

**Activation:** Distance < 200px triggers A/V.

**Audio Attenuation:** Volume drops with distance (logarithmic).

**Stereo Panning:** PannerNode based on relative X position.

---

## 4. Specialized Map Zones

### Private Areas
- Tiles with private_id
- Audio unlimited within zone
- Muted outside zone

### Quiet Zones
- Reduced activation radius
- Focused work areas

---

## 5. Interactive Objects

**Trigger:** Press 'X' to interact.

**Types:**
- **Iframe** - Google Docs, Miro, etc.
- **Video** - YouTube/Twitch streams
- **External Links** - URLs

---

## 6. UI Components

### Chat Overlay
- Text chat in workspace
- @mentions
- Emoji support

### Video Calls
- Click to start video
- Screen sharing
- Meeting rooms

### Mini Mode
- Small floating window
- Stay connected while using other apps

### Simplified View
- Focus on people, not details
- Reduced visual noise

---

## 7. Visual Feedback

- **Talking indicator** - Aura or speech bubble when mic active
- **Connection loader** - Spinning when connecting
- **Proximity highlight** - Players within range highlighted

---

## 8. User Controls

- Mute/unmute self
- Set status (available, busy, away)
- Control who can approach
- Volume slider per user

---

## 9. Tech Stack

- **Frontend:** Phaser 3
- **Backend:** Node.js + Socket.io
- **DB:** Supabase
- **Media:** LiveKit (WebRTC)
- **Auth:** Supabase Auth
