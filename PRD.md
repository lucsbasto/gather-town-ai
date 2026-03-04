# Product Requirements Document (PRD): Gather AI Clone

## 1. Executive Summary

Gather AI Clone is a 2D virtual space platform designed to solve "Zoom fatigue" by introducing spatial presence. Users interact through avatars in a gamified environment where audio and video are governed by the physical proximity of their characters, enabling spontaneous and organic "water cooler" conversations.

---

## 2. Problem Statement

Traditional video conferencing is static, scheduled, and transactional. Remote teams lack the serendipity of office-side chats, leading to social isolation and reduced team cohesion.

---

## 3. Goals & Objectives

**MVP Goal:** Create a stable, browser-based 2D world where up to 20 users can move and talk via proximity-based WebRTC.

**Accessibility:** Support low-spec hardware and standard browsers without requiring software installation.

**Speed-to-Market:** Leverage Generative AI (Gen-AI) for 80% of asset creation and code architecture.

---

## 4. Functional Requirements (MVP)

| Feature | Priority | Description |
|---------|----------|-------------|
| Grid Movement | P0 | 32x32 pixel-based navigation using keyboard (WASD/Arrows). |
| Proximity A/V | P0 | Automatic video/audio connection when avatars are within 200px. |
| Private Zones | P0 | Defined map areas where audio is restricted to the group inside. |
| Ghost Mode | P1 | Hold 'G' to pass through other players and ignore collisions. |
| Interactive Objects | P1 | Press 'X' to open external links, YouTube videos, or whiteboards. |
| Global Chat | P2 | Text-based chat system for users in the same room. |

---

## 5. Non-Functional Requirements

- **Latency:** Movement synchronization latency must stay below 100ms to avoid jitter.
- **Stability:** Support at least 20 concurrent users per room without audio degradation.
- **Security:** Use Doppler for secrets and ensure all WebRTC traffic is encrypted via SFU (LiveKit).
- **Compatibility:** Support Node.js version 16.20.0 and standard modern browsers.

---

## 6. AI Development Strategy

This project adopts an AI-native workflow to maximize productivity:

- **Code Generation:** Use Cursor (Agent Mode) or Claude Code to compile specifications in Design.md and Architecture.md into functional TypeScript.
- **Asset Generation:** Use Stable Diffusion (with Tiled VAE or Non-Manifold Diffusion techniques) to generate seamless 2D tilesets and character sprite sheets.
- **Procedural Maps:** Instruct LLMs to generate valid Tiled JSON map files to iterate on level design quickly.

---

## 7. Success Metrics (KPIs)

- **Connection Speed:** Audio/Video should initialize in less than 2 seconds after proximity is reached.
- **Uptime:** 99.9% availability for the media server (LiveKit).
- **Performance:** Maintain 60 FPS on the client side during active movement.
