# AI Operational Guide: Gather AI Clone (Supabase Version)

## 1. Environment & Setup

- **Runtime:** Node.js v16.20.0 (required for node-canvas compatibility)
- **Package Manager:** Yarn v3.2.4 (Corepack enabled)
- **Core Frameworks:** Phaser 3 (Frontend), Socket.io (Movement), Supabase (Auth/Realtime/DB), LiveKit (Media)

**Commands:**

```bash
yarn install           # Install dependencies
yarn dev               # Start local development server (Frontend + Node.js backend)
yarn build             # Compile for production
doppler setup          # Sync environment variables and secrets
```

---

## 2. Database & Realtime (Supabase)

- **Migrations:** Always use `supabase migration new <name>` and `supabase db reset` for schema changes
- **Security:** Ensure Row Level Security (RLS) is enabled on every new table:

```sql
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

- **Presence:** Use Supabase Realtime for global "Lobby" states, but use Socket.io for high-frequency coordinate syncing (>10 updates/sec)

---

## 3. Media & Spatial Audio (LiveKit)

- **Local Testing:** Run `gather test:livekitServer` to start a local SFU instance
- **Proximity Logic:** Implement distance checks in the Phaser `update()` loop
- **Selective Subscriptions:** Only subscribe to tracks of users within a 200px radius to preserve bandwidth

---

## 4. Testing Commands

- **Database Tests:** Run `supabase test db` to execute pgTAP tests in `./supabase/tests/`
- **Unit Tests:** Run `yarn test` to execute Vitest for pure functions (math, logic)
- **E2E/Integration:** Run `yarn test:e2e` for Playwright-based browser flows

---

## 5. Coding Directives

### Phaser Patterns

- Asset loading must happen in `preload()`
- Continuous input polling/distance checks must happen in `update()`
- Use Scene Keys (constants) to prevent typos during transitions

### Authoritative Server

- The client is a "dumb" renderer
- All movement and collision validation must be confirmed by the Node.js backend before updating the local sprite state

### Type Safety

- Use strict TypeScript
- Define Interfaces for all Socket events and Supabase row types
- Avoid `any` at all costs

---

## 6. Error Handling

- Prefix all debug logs with `[Gather-AI]`
- Always implement try-catch blocks for Socket emitters and Supabase calls
- In case of network disconnection, implement an automatic "reconnection" overlay in the Phaser HUD

---

## Summary of Project Context Files

- **README.md:** Project overview and quick start
- **PRD.md:** Features, priorities, and business goals
- **Architecture.md:** Tech stack and authoritative data flow
- **RULES.md:** Workflow, Git etiquette, and testing standards
- **AGENTS.md:** Commands, syntax rules, and operational context for AI
