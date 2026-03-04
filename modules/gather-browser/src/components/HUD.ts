/**
 * HUD Component - GT-UI-001
 * Heads-up display for game information using design tokens
 */

import { tokens } from './designTokens';

export interface HUDConfig {
  roomId: string;
  playerName: string;
  isAuthenticated: boolean;
}

export class GameHUD {
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private texts: Map<string, Phaser.GameObjects.Text> = new Map();
  private config: HUDConfig;

  constructor(scene: Phaser.Scene, config: HUDConfig) {
    this.config = config;
    const { spacing, colors, typography } = tokens;
    const padding = parseInt(spacing.lg);

    // Create container in top-left corner
    this.container = scene.add.container(padding, padding);

    // Background panel
    this.background = scene.add.graphics();
    this.background.fillStyle(parseInt(colors.bgSurface.replace('#', '0x')), 0.9);
    this.background.fillRoundedRect(0, 0, 200, 110, parseInt(tokens.card.radius));
    this.background.lineStyle(1, parseInt(colors.border.replace('rgba(', '').replace(')', '').replace(/,/g, '')));
    this.background.strokeRoundedRect(0, 0, 200, 110, parseInt(tokens.card.radius));
    this.container.add(this.background);

    // Create HUD text elements
    this.createText(scene, 'controls', 'WASD move | G ghost | M mic', padding + parseInt(spacing.sm), padding + parseInt(spacing.sm));
    this.createText(scene, 'auth', this.getAuthText(), padding + parseInt(spacing.sm), padding + parseInt(spacing.sm) + 20);
    this.createText(scene, 'room', `Room: ${config.roomId}`, padding + parseInt(spacing.sm), padding + parseInt(spacing.sm) + 40);
    this.createText(scene, 'nearby', 'Nearby: 0 players', padding + parseInt(spacing.sm), padding + parseInt(spacing.sm) + 60);
    this.createText(scene, 'audio', '🎤 Muted (Press M)', padding + parseInt(spacing.sm), padding + parseInt(spacing.sm) + 80);
  }

  private createText(scene: Phaser.Scene, key: string, text: string, x: number, y: number): void {
    const { typography, colors } = tokens;
    const textObj = scene.add.text(x, y, text, {
      fontSize: typography.fontSizeSmall,
      fontFamily: typography.fontFamily,
      color: colors.textSecondary,
    });
    this.texts.set(key, textObj);
    this.container.add(textObj);
  }

  private getAuthText(): string {
    return this.config.isAuthenticated
      ? `Logged: ${this.config.playerName.slice(0, 8)}`
      : 'Anonymous';
  }

  updateNearby(count: number): void {
    const text = this.texts.get('nearby');
    if (text) {
      text.setText(`Nearby: ${count} player${count !== 1 ? 's' : ''}`);
      text.setColor(count > 0 ? tokens.colors.success : tokens.colors.warning);
    }
  }

  updateAudioStatus(muted: boolean, micEnabled: boolean): void {
    const text = this.texts.get('audio');
    if (text) {
      if (muted) {
        text.setText('🎤 Muted (Press M)');
        text.setColor(tokens.colors.danger);
      } else if (micEnabled) {
        text.setText('🎤 Live');
        text.setColor(tokens.colors.success);
      } else {
        text.setText('🎤 Unmuted');
        text.setColor(tokens.colors.textSecondary);
      }
    }
  }

  updateGhostMode(enabled: boolean): void {
    const text = this.texts.get('controls');
    if (text) {
      text.setText(enabled ? '👻 Ghost Mode' : 'WASD move | G ghost | M mic');
    }
  }

  destroy(): void {
    this.container.destroy();
  }
}
