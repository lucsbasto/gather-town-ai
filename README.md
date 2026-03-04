Gather AI Clone - MVP (Supabase Version)
1. Project Overview
The Gather AI Clone is a 2D spatial collaboration platform where users interact via avatars in a gamified map. The core value is spatial presence: audio and video streams are automatically activated based on proximity.

2. Core Tech Stack
Game Engine: Phaser 3 for 2D rendering and grid-based movement.

Backend & Database: Supabase (PostgreSQL) for Auth, Database, and Realtime player state.

Media Infrastructure (SFU): LiveKit for spatial audio and video streaming.

Networking: Socket.io (for low-latency movement) + Supabase Realtime (for room state).

Language: TypeScript.

3. Prerequisites
Node.js: Version 16.20.0 (Recommended via nvm).

Yarn: Version 3.2.4.

Supabase CLI: For local development and migrations.

LiveKit Server: Must be installed or accessible via LiveKit Cloud for video features.

4. Folder Structure
/assets: Tilesets, character spritesheets, and UI assets.

/src/scenes: Phaser scenes (Login, Lobby, WorldScene).

/src/lib: Supabase client configuration and LiveKit hooks.

/server: Lightweight Node.js server for Socket.io signaling.

5. Quick Start
**Clone and Install:**bash
yarn install

Environment Setup:
Create a .env file with your credentials:

Snippet de código
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
Run Development:

Bash
yarn dev
6. AI Context Files
To help your AI assistant build this faster, refer to these files in order:

PRD.md: Product requirements and feature priorities.

Design.md: Movement and spatial audio logic.

Architecture.md: Data flow and Supabase/LiveKit integration.

CLAUDE.md: Build commands and coding standards.
