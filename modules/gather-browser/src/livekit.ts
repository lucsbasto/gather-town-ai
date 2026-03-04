/**
 * LiveKit Integration Service
 * Handles spatial audio/video connections based on player proximity
 */

import { Room, LocalParticipant, RemoteParticipant, LocalTrack, RemoteTrack, AudioSource, VideoSource } from 'livekit-client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration
const PROXIMITY_THRESHOLD = 200; // pixels

// Types
export interface LiveKitConfig {
  url: string;
  token: string;
}

export interface SpatialAudioOptions {
  enablePanning: boolean;
  enableAttenuation: boolean;
  maxDistance: number;
  rolloffFactor: number;
}

export interface PlayerPosition {
  id: string;
  x: number;
  y: number;
}

// LiveKit service class
export class LiveKitService {
  private room: Room | null = null;
  private localParticipant: LocalParticipant | null = null;
  private audioContext: AudioContext | null = null;
  private pannerNodes: Map<string, PannerNode> = new Map();
  private localStream: MediaStream | null = null;
  private options: SpatialAudioOptions;
  
  constructor(options: Partial<SpatialAudioOptions> = {}) {
    this.options = {
      enablePanning: true,
      enableAttenuation: true,
      maxDistance: PROXIMITY_THRESHOLD,
      rolloffFactor: 1.5,
      ...options
    };
  }

  // Connect to LiveKit room
  async connect(config: LiveKitConfig): Promise<Room> {
    try {
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          width: 320,
          height: 240,
          frameRate: 15
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      await this.room.connect(config.url, config.token, {
        autoSubscribe: true
      });

      this.localParticipant = room.localParticipant;
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Connected to LiveKit room:', room.name);
      return room;
    } catch (error) {
      console.error('Failed to connect to LiveKit:', error);
      throw error;
    }
  }

  // Setup room event listeners
  private setupEventListeners() {
    if (!this.room) return;

    // Handle participant joined
    this.room.on('participantConnected', (participant: RemoteParticipant) => {
      console.log('Participant connected:', participant.identity);
      
      // Subscribe to their tracks
      participant.on('trackSubscribed', (track: RemoteTrack) => {
        this.handleTrackSubscribed(participant, track);
      });
    });

    // Handle participant disconnected
    this.room.on('participantDisconnected', (participant: RemoteParticipant) => {
      console.log('Participant disconnected:', participant.identity);
      this.removePannerForParticipant(participant.identity);
    });

    // Handle track unsubscribed
    this.room.on('trackUnsubscribed', (track: RemoteTrack) => {
      this.handleTrackUnsubscribed(track);
    });
  }

  // Handle incoming track
  private handleTrackSubscribed(participant: RemoteParticipant, track: RemoteTrack) {
    if (track.kind === 'audio' && this.audioContext) {
      // Attach audio track with spatial audio
      this.attachSpatialAudio(participant.identity, track.mediaStreamTrack);
    }
  }

  // Handle track removed
  private handleTrackUnsubscribed(track: RemoteTrack) {
    if (track.kind === 'audio') {
      track.mediaStreamTrack.stop();
    }
  }

  // Enable local audio/video
  async enableLocalAudio(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      // Publish audio track
      if (this.room && this.localParticipant) {
        for (const track of this.localStream.getAudioTracks()) {
          await this.localParticipant.publishTrack(track, {
            name: 'microphone',
            noiseSuppression: true
          });
        }
      }

      return this.localStream;
    } catch (error) {
      console.error('Failed to enable local audio:', error);
      throw error;
    }
  }

  // Disable local audio
  async disableLocalAudio() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // Setup Web Audio API for spatial audio
  setupSpatialAudio(audioElement: HTMLAudioElement) {
    this.audioContext = new AudioContext();
    
    // Create source from audio element
    const source = this.audioContext.createMediaElementSource(audioElement);
    
    // Connect to destination
    source.connect(this.audioContext.destination);
    
    return this.audioContext;
  }

  // Attach spatial audio for a participant
  attachSpatialAudio(participantId: string, track: MediaStreamTrack) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Create panner node for spatial positioning
    const panner = this.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'exponential';
    panner.refDistance = 50;
    panner.maxDistance = this.options.maxDistance;
    panner.rolloffFactor = this.options.rolloffFactor;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0;

    // Create stream from track
    const stream = new MediaStream([track]);
    const audioElement = document.createElement('audio');
    audioElement.srcObject = stream;
    audioElement.autoplay = true;

    // Connect through panner
    const source = this.audioContext.createMediaElementSource(audioElement);
    source.connect(panner);
    panner.connect(this.audioContext.destination);

    this.pannerNodes.set(participantId, panner);
  }

  // Update spatial position for a participant
  updateSpatialPosition(participantId: string, localX: number, localY: number, remoteX: number, remoteY: number) {
    const panner = this.pannerNodes.get(participantId);
    if (!panner || !this.audioContext) return;

    // Calculate relative position
    const dx = remoteX - localX;
    const dy = remoteY - localY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Update panner position
    // Using coordinate system: x = left/right, y = front/back, z = up/down
    panner.positionX.value = dx;
    panner.positionY.value = 0;
    panner.positionZ.value = -dy; // Negative because audio forward is -Z

    // Adjust volume based on distance
    if (this.options.enableAttenuation) {
      const volume = Math.max(0, 1 - (distance / this.options.maxDistance));
      panner.refDistance = volume * 50;
    }
  }

  // Remove panner for disconnected participant
  private removePannerForParticipant(participantId: string) {
    const panner = this.pannerNodes.get(participantId);
    if (panner) {
      panner.disconnect();
      this.pannerNodes.delete(participantId);
    }
  }

  // Update proximity-based audio connections
  updateProximity(localPlayer: PlayerPosition, remotePlayers: PlayerPosition[]) {
    const nearbyPlayers: string[] = [];

    remotePlayers.forEach(remote => {
      const distance = this.calculateDistance(
        localPlayer.x, localPlayer.y,
        remote.x, remote.y
      );

      if (distance < PROXIMITY_THRESHOLD) {
        nearbyPlayers.push(remote.id);
        
        // Update spatial audio position
        this.updateSpatialPosition(remote.id, localPlayer.x, localPlayer.y, remote.x, remote.y);
      }
    });

    return nearbyPlayers;
  }

  // Calculate Euclidean distance
  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  // Disconnect from room
  async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
      this.localParticipant = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.pannerNodes.clear();
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }

  // Get room connection status
  isConnected(): boolean {
    return this.room !== null && this.room.state === 'connected';
  }

  // Get participants count
  getParticipantsCount(): number {
    return this.room ? this.room.participants.size + 1 : 0;
  }
}

// Token generation helper (should be done server-side in production)
export async function generateLiveKitToken(
  serverUrl: string,
  apiKey: string,
  apiSecret: string,
  roomName: string,
  participantName: string
): Promise<string> {
  // In production, this should be done server-side using livekit-server-sdk
  // For now, return a placeholder
  const response = await fetch(`${serverUrl}/twirp/livekit.RoomService/CreateToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: roomName,
      identity: participantName,
      grant: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate token');
  }

  const data = await response.json();
  return data.token;
}

// Export singleton instance
export const liveKitService = new LiveKitService();
