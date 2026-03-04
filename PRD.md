# Product Requirements Document (PRD): Gather AI Clone (Supabase Edition)

## 1. Executive Summary

The Gather AI Clone is a 2D spatial collaboration platform designed to eliminate "Zoom fatigue" by introducing spatial presence. Users interact through avatars in a gamified environment where audio and video are governed by the physical proximity of their characters, enabling spontaneous and organic interactions.

---

## 2. Goals & Objectives

**MVP Goal:** Deliver a functional 2D world where up to 20 concurrent users can move and talk via proximity-based WebRTC.

**Infrastructure Strategy:** Utilize Supabase for authentication and real-time room state to minimize custom backend development and maximize AI-driven delivery.

**Accessibility:** Ensure a seamless browser-based experience with zero installation requirements.

---

## 3. Technology Stack

- **Frontend Engine:** Phaser 3 (Rendering, Input, and World Logic)
- **Real-time & DB:** Supabase (Postgres Realtime for player coordinates, Auth for user management)
- **Media SFU:** LiveKit (Spatial audio and video stream management)
- **Environment:** Node.js v16.20.0 and Yarn v3.2.4

---

## 4. Functional Requirements (MVP)

| Feature | Description | Technical Implementation |
|---------|-------------|------------------------|
| Grid Movement | 32x32 pixel movement using WASD/Arrows | Phaser Arcade Physics + Grid snapping |
| Real-time Sync | Player positions visible to all other users | Supabase Realtime (broadcast/presence) |
| Proximity A/V | Audio/Video opens automatically when $d < 200$ pixels | Euclidean distance check via Phaser |
| Private Zones | Group audio restricted to players on specific tiles | Tiled map properties (private_id) |
| Interactive Objects | Press 'X' to open links or embedded iframes | Phaser collision detection + HUD modals |

---

## 5. Movement and Spatial Logic

**Distance Calculation:** The proximity for triggering media streams is calculated using the Euclidean formula:

$$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$

**Audio Attenuation:** Sound volume must decrease logaritmically as distance increases to simulate real-world physics.

**Validation:** Movements are validated against a collision layer defined in the Tiled JSON map file.

---

## 6. AI-First Development Plan

- **Code Generation:** Instruct the AI (Cursor/Claude) to build the Supabase connection layer and Phaser Scene structure based on @Architecture.md.
- **Asset Generation:** Use Stable Diffusion with tiling extensions to generate the 32x32px textures and character spritesheets.
- **Map Synthesis:** Generate valid JSON map files via LLM for the Tiled Editor schema to iterate on office layouts quickly.

---

## 7. Non-Functional Requirements

- **Performance:** Maintain a consistent 60 FPS on the client side.
- **Latency:** Synchronization latency must stay below 100ms for player movement.
- **Scalability:** The Supabase + LiveKit architecture should support at least 20 users per room without performance degradation.
