# Gather AI Clone - Project Design

## 1. Core Mechanics: Movement & Navigation

**Grid-Based Movement:** All movement is snapped to a 32x32 pixel grid.

**Controls:** Users navigate using WASD or Arrow Keys.

**Ghost Mode:** By holding the 'G' key, the player becomes a "ghost" (opacity 0.5). In this state, they can pass through other players and ignore collision blocks to prevent getting stuck in crowded areas.

---

## 2. Spatial Presence: Proximity Audio & Video

The core feature is the "Walk-up and Talk" mechanic, where media streams are triggered by physical distance between avatars.

**Distance Formula:** Proximity is calculated using the Euclidean distance between two avatars:

$$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$

**Activation Threshold:** Audio and video streams must automatically initialize when the distance $d$ is less than 200 pixels.

**Audio Attenuation:** Volume must drop off gradually as distance increases. Use a Logarithmic or Inverse fall-off model to simulate realistic sound propagation.

**Stereo Panning:** Utilize the PannerNode from the Web Audio API to pan audio to the left or right speaker based on the relative X-position of the speaker to the listener.

---

## 3. Specialized Map Zones

**Private Areas:** Specific tiles marked with a private_id in the map JSON. When a user enters a private zone, they are connected to everyone else in that same zone regardless of distance, while audio from users outside the zone is muted.

**Quiet Zones:** Areas where the activation radius is significantly reduced to allow for focused work.

---

## 4. Interactive Objects

**Trigger Key:** Users press 'X' to interact with highlighted objects.

**Object Types:**

- **Iframe Objects:** Open a website or shared document (e.g., Google Docs, Miro) in a modal.
- **Video Objects:** Play a synchronized YouTube or Twitch stream.
- **External Links:** Direct users to external resources.

---

## 5. Visual Feedback & UI

**Talking Indicators:** Display a colored aura or a "speech bubble" icon over an avatar whenever their microphone detects active speech.

**Connection Status:** Visual cues (like a spinning loader) should appear in the corner of the screen when a WebRTC connection is being established with a nearby neighbor.
