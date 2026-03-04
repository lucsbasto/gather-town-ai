# CLAUDE.md - AI Assistant Guide

## Project Overview

Gather AI Clone is a 2D spatial collaboration platform (like Gather.town) where users interact through avatars in a gamified environment with proximity-based audio/video.

## Tech Stack

- **Frontend:** Phaser 3, TypeScript
- **Backend:** Node.js, Socket.io
- **Database:** Supabase (PostgreSQL + Realtime)
- **Media:** LiveKit (SFU for spatial audio/video)

## Project Structure

```
gather-town-ai/
├── modules/
│   ├── gather-browser/     # Phaser 3 frontend
│   └── gather-dev-server/  # Socket.io backend
├── supabase/               # Database migrations
└── *.md                    # Documentation
```

## Commands

```bash
# Install dependencies
yarn install

# Run development
yarn dev:browser   # Start frontend
yarn dev:server    # Start backend
```

## Key Files

- `Design.md` - Core mechanics and business rules
- `Architecture.md` - Technical architecture
- `PRD.md` - Product requirements

## Important Rules

1. **Grid Movement:** 32x32 pixels, WASD/Arrow keys
2. **Proximity:** Audio/video trigger at 200px distance
3. **Ghost Mode:** Hold 'G' to pass through collisions
4. **Server-Authoritative:** All movement validated by server

## Coding Standards

- Use TypeScript strict mode
- Follow conventional commits: `type(scope): description`
