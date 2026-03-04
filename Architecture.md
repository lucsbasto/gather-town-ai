# Technical Architecture: Gather AI Clone (Supabase Version)

## 1. Technology Stack

- **Language:** TypeScript (Strict mode) for both frontend and backend logic
- **Runtime:** Node.js v16.20.0 exactly (required for compatibility with low-level dependencies like node-canvas)
- **Game Engine:** Phaser 3 (Managing 2D rendering, inputs, and the game loop)
- **Backend & Database:** Supabase
  - **PostgreSQL:** Persistent storage for user profiles, room metadata, and world state
  - **Supabase Auth:** Built-in authentication (Email, Magic Links, or Social)
  - **Supabase Realtime:** Used for player presence and slower state updates like chat messages or room configuration
- **High-Frequency Networking:** Socket.io (Node.js) for ultra-low latency avatar movement synchronization (Authoritative Server model)
- **Media SFU:** LiveKit for managing spatial audio and video tracks
- **Secrets Management:** Doppler CLI for secure environment variable sync

---

## 2. Networking Model (Authoritative Server)

To ensure consistency and prevent movement "teleportation" or cheating, we follow a Server-Authoritative Model:

- **Intent:** The client sends a "move intent" (e.g., target grid coordinates) to the Node.js server via Socket.io
- **Validation:** The server validates the move against the Tiled JSON collision layer stored in the backend
- **Broadcast:** The server broadcasts the validated global world state to all connected clients every 100ms
- **Smoothing:** Clients interpolate between state updates to maintain a smooth 60 FPS visual experience

---

## 3. Media Pipeline & Spatial Audio

The integration between the Phaser map coordinates and the LiveKit media streams is managed by a proximity-check loop:

- **Spatial Position:** Every avatar's $(x, y)$ coordinate in Phaser is mapped to a spatial coordinate in the LiveKit room
- **Selective Subscription:** To save bandwidth, the client only subscribes to the video/audio tracks of users within a 200px radius
- **Audio Attenuation:** Volume is controlled via the Web Audio API using a PannerNode with a logarithmic distance model:

$$volume = \max(0, 1 - \frac{distance}{radius})$$

---

## 4. Module Organization

- `modules/gather-browser`: The Phaser 3 frontend application
- `modules/gather-dev-server`: The Node.js backend (Socket.io & Supabase Admin SDK)
- `supabase/`: Local Supabase configuration, migrations, and database schema

---

## 5. Deployment

- **Frontend:** Vercel or Supabase Hosting
- **Backend:** Dockerized Node.js server on a VPS (DigitalOcean/AWS)
- **Database:** Supabase Cloud (Managed Postgres)
- **SFU:** LiveKit Cloud or a self-hosted instance
