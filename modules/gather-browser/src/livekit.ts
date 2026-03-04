/**
 * LiveKit Integration Service
 * Handles spatial audio/video connections based on player proximity
 */

import { Room, LocalParticipant, RemoteParticipant } from 'livekit-client';
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
  async connect(config: LiveKitConfig): Promise<void> {
    try {
      this.room = new Room();
      
      await this.room.connect(config.url, config.token);
      
      this.localParticipant = this.room.localParticipant;
      
      // Initialize audio context for spatial audio
      this.audioContext = new AudioContext();
      
      console.log('[LiveKit] Connected to room');
    } catch (error) {
      console.error('[LiveKit] Connection failed:', error);
      throw error;
    }
  }

  // Disconnect from LiveKit room
  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
      this.localParticipant = null;
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.pannerNodes.clear();
    this.localStream = null;
  }

  // Enable local microphone
  async enableMicrophone(): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      if (this.localParticipant && this.localStream) {
        // Publish audio track
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
          await this.localParticipant.publishTrack(audioTrack);
        }
      }
      
      return this.localStream;
    } catch (error) {
      console.error('[LiveKit] Microphone error:', error);
      return null;
    }
  }

  // Disable local microphone
  disableMicrophone(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // Update spatial audio based on player positions
  updateSpatialAudio(localPlayer: PlayerPosition, remotePlayers: PlayerPosition[]): void {
    if (!this.audioContext) return;

    remotePlayers.forEach(remotePlayer => {
      const distance = this.calculateDistance(localPlayer, remotePlayer);
      
      if (distance < this.options.maxDistance) {
        // Player is within range - enable audio
        this.enableSpatialAudioForPlayer(remotePlayer, distance);
      } else {
        // Player is out of range - disable audio
        this.disableSpatialAudioForPlayer(remotePlayer.id);
      }
    });
  }

  // Calculate Euclidean distance between two players
  private calculateDistance(p1: PlayerPosition, p2: PlayerPosition): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Enable spatial audio for a specific player
  private enableSpatialAudioForPlayer(player: PlayerPosition, distance: number): void {
    if (!this.audioContext) return;

    // Calculate volume based on distance (inverse falloff)
    const volume = Math.max(0, 1 - (distance / this.options.maxDistance));
    
    // Create or update panner node
    let panner = this.pannerNodes.get(player.id);
    
    if (!panner && this.audioContext) {
      panner = this.audioContext.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 50;
      panner.maxDistance = this.options.maxDistance;
      panner.rolloffFactor = this.options.rolloffFactor;
      panner.connect(this.audioContext.destination);
      this.pannerNodes.set(player.id, panner);
    }
    
    if (panner) {
      panner.positionX.value = (player.x - 400) / 10; // Normalize to audio space
      panner.positionY.value = (player.y - 300) / 10;
      panner.positionZ.value = 0;
    }
  }

  // Disable spatial audio for a specific player
  private disableSpatialAudioForPlayer(playerId: string): void {
    const panner = this.pannerNodes.get(playerId);
    if (panner) {
      panner.disconnect();
      this.pannerNodes.delete(playerId);
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.room !== null;
  }

  // Get number of participants
  getParticipantCount(): number {
    return this.room ? this.room.numParticipants : 0;
  }
}

export default LiveKitService;
