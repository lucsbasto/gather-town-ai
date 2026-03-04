/**
 * PlayerAvatar Component - GT-UI-002
 * Reusable avatar component with status indicator and talking bubble
 */

import { tokens } from './designTokens';

export type PlayerStatus = 'available' | 'busy' | 'away' | 'offline';

export interface PlayerAvatarConfig {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  status: PlayerStatus;
  isTalking: boolean;
  isGhost: boolean;
  isLocalPlayer: boolean;
}

const AVATAR_SIZE = 32;
const STATUS_INDICATOR_SIZE = 10;
const TALKING_BUBBLE_SIZE = 12;

export class PlayerAvatar {
  private container: Phaser.GameObjects.Container;
  private avatar: Phaser.GameObjects.Graphics;
  private statusIndicator: Phaser.GameObjects.Graphics;
  private nameLabel: Phaser.GameObjects.Text;
  private talkingBubble: Phaser.GameObjects.Graphics;
  private config: PlayerAvatarConfig;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: PlayerAvatarConfig
  ) {
    this.config = config;
    const { colors, typography } = tokens;

    // Create container
    this.container = scene.add.container(x, y);

    // Create avatar placeholder (circle with initial)
    this.avatar = scene.add.graphics();
    this.drawAvatar();
    this.container.add(this.avatar);

    // Create status indicator
    this.statusIndicator = scene.add.graphics();
    this.drawStatusIndicator();
    this.container.add(this.statusIndicator);

    // Create talking bubble (hidden by default)
    this.talkingBubble = scene.add.graphics();
    this.talkingBubble.setVisible(false);
    this.container.add(this.talkingBubble);

    // Create name label
    this.nameLabel = scene.add.text(
      0,
      AVATAR_SIZE / 2 + 4,
      config.playerName,
      {
        fontSize: typography.fontSizeSmall,
        fontFamily: typography.fontFamily,
        color: colors.textPrimary,
      }
    ).setOrigin(0.5);
    this.nameLabel.setVisible(!config.isGhost);
    this.container.add(this.nameLabel);

    // Apply ghost mode
    this.setGhostMode(config.isGhost);
  }

  private drawAvatar(): void {
    const { colors } = tokens;
    const radius = AVATAR_SIZE / 2;

    this.avatar.clear();

    // Avatar background
    const bgColor = this.config.isLocalPlayer 
      ? parseInt(colors.accent.replace('#', '0x'))
      : parseInt(colors.bgElevated.replace('#', '0x'));
    
    this.avatar.fillStyle(bgColor, 1);
    this.avatar.fillCircle(0, 0, radius);

    // Avatar border
    this.avatar.lineStyle(2, parseInt(colors.borderLight.replace('rgba(', '').replace(')', '').replace(/,/g, '')));
    this.avatar.strokeCircle(0, 0, radius);

    // Draw player initial
    const initial = this.config.playerName.charAt(0).toUpperCase();
    const initialText = this.config.isLocalPlayer ? colors.textPrimary : colors.textSecondary;
  }

  private drawStatusIndicator(): void {
    const { colors } = tokens;
    const statusColor = this.getStatusColor();

    this.statusIndicator.clear();
    this.statusIndicator.fillStyle(statusColor, 1);
    this.statusIndicator.fillCircle(
      AVATAR_SIZE / 2 - 2,
      AVATAR_SIZE / 2 - 2,
      STATUS_INDICATOR_SIZE / 2
    );

    // White border for visibility
    this.statusIndicator.lineStyle(1, 0xffffff);
    this.statusIndicator.strokeCircle(
      AVATAR_SIZE / 2 - 2,
      AVATAR_SIZE / 2 - 2,
      STATUS_INDICATOR_SIZE / 2
    );
  }

  private getStatusColor(): number {
    const { colors } = tokens;
    
    switch (this.config.status) {
      case 'available':
        return parseInt(colors.success.replace('#', '0x'));
      case 'busy':
        return parseInt(colors.danger.replace('#', '0x'));
      case 'away':
        return parseInt(colors.warning.replace('#', '0x'));
      case 'offline':
      default:
        return parseInt(colors.textSecondary.replace('#', '0x'));
    }
  }

  private drawTalkingBubble(): void {
    const { colors } = tokens;

    this.talkingBubble.clear();
    this.talkingBubble.fillStyle(parseInt(colors.textPrimary.replace('#', '0x')), 1);
    
    // Draw speech bubble above avatar
    const bubbleX = 0;
    const bubbleY = -AVATAR_SIZE / 2 - TALKING_BUBBLE_SIZE / 2 - 2;
    
    // Bubble body
    this.talkingBubble.fillRoundedRect(
      bubbleX - TALKING_BUBBLE_SIZE / 2,
      bubbleY - TALKING_BUBBLE_SIZE / 2,
      TALKING_BUBBLE_SIZE,
      TALKING_BUBBLE_SIZE,
      3
    );

    // Small triangle pointing down
    this.talkingBubble.fillTriangle(
      bubbleX - 3,
      bubbleY + TALKING_BUBBLE_SIZE / 2,
      bubbleX + 3,
      bubbleY + TALKING_BUBBLE_SIZE / 2,
      bubbleX,
      bubbleY + TALKING_BUBBLE_SIZE / 2 + 4
    );
  }

  setStatus(status: PlayerStatus): void {
    this.config.status = status;
    this.drawStatusIndicator();
  }

  setTalking(isTalking: boolean): void {
    this.config.isTalking = isTalking;
    if (isTalking) {
      this.drawTalkingBubble();
      this.talkingBubble.setVisible(true);
      this.animateTalking();
    } else {
      this.talkingBubble.setVisible(false);
    }
  }

  private animateTalking(): void {
    // Simple pulse animation
    this.container.scene.tweens.add({
      targets: this.talkingBubble,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });
  }

  setGhostMode(isGhost: boolean): void {
    this.config.isGhost = isGhost;
    this.container.setAlpha(isGhost ? 0.5 : 1);
    this.nameLabel.setVisible(!isGhost);
  }

  setPosition(x: number, y: number): void {
    // Snap to 32x32 grid
    const snappedX = Math.round(x / AVATAR_SIZE) * AVATAR_SIZE;
    const snappedY = Math.round(y / AVATAR_SIZE) * AVATAR_SIZE;
    this.container.setPosition(snappedX, snappedY);
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  getConfig(): PlayerAvatarConfig {
    return this.config;
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }
}
