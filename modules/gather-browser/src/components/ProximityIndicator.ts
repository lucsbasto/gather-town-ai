/**
 * ProximityIndicator Component - GT-UI-003
 * Shows nearby players within 200px with distance and connection status
 */

import { tokens } from './designTokens';

export interface ProximityIndicatorConfig {
  maxDistance: number; // Default 200px
  showDistanceText: boolean;
  showConnectionSpinner: boolean;
}

export interface NearbyPlayer {
  playerId: string;
  playerName: string;
  distance: number;
  isConnected: boolean;
}

const PROXIMITY_HIGHLIGHT_RADIUS = 40;
const DISTANCE_TEXT_OFFSET_Y = -30;
const SPINNER_SIZE = 16;
const SPINNER_SPEED = 500; // ms per rotation

export class ProximityIndicator {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private highlightCircle: Phaser.GameObjects.Graphics;
  private distanceText: Phaser.GameObjects.Text;
  private spinnerGraphics: Phaser.GameObjects.Graphics;
  private spinnerTween: Phaser.Tweens.Tween | null = null;
  private config: ProximityIndicatorConfig;
  private nearbyPlayers: Map<string, NearbyPlayer> = new Map();
  private isLoading: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config?: Partial<ProximityIndicatorConfig>) {
    this.scene = scene;
    this.config = {
      maxDistance: config?.maxDistance ?? 200,
      showDistanceText: config?.showDistanceText ?? true,
      showConnectionSpinner: config?.showConnectionSpinner ?? true,
    };
    const { colors, typography } = tokens;

    // Create container
    this.container = scene.add.container(x, y);

    // Create proximity highlight circle (hidden by default)
    this.highlightCircle = scene.add.graphics();
    this.highlightCircle.setVisible(false);
    this.container.add(this.highlightCircle);

    // Create distance text (hidden by default)
    this.distanceText = scene.add.text(
      0,
      DISTANCE_TEXT_OFFSET_Y,
      '',
      {
        fontSize: typography.fontSizeSmall,
        fontFamily: typography.fontFamily,
        color: colors.textPrimary,
        backgroundColor: colors.bgSurface,
        padding: { x: 6, y: 2 },
      }
    ).setOrigin(0.5);
    this.distanceText.setVisible(false);
    this.container.add(this.distanceText);

    // Create loading spinner (hidden by default)
    this.spinnerGraphics = scene.add.graphics();
    this.spinnerGraphics.setVisible(false);
    this.container.add(this.spinnerGraphics);
  }

  /**
   * Update nearby players and show proximity indicator
   */
  updateNearbyPlayers(players: NearbyPlayer[]): void {
    this.nearbyPlayers.clear();
    
    const withinRange = players.filter(p => p.distance <= this.config.maxDistance);
    
    withinRange.forEach(player => {
      this.nearbyPlayers.set(player.playerId, player);
    });

    if (withinRange.length > 0) {
      // Sort by distance, get nearest
      withinRange.sort((a, b) => a.distance - b.distance);
      const nearest = withinRange[0];
      
      this.showProximityHighlight(nearest.distance);
      
      if (this.config.showDistanceText) {
        this.showDistance(nearest.distance);
      }

      if (this.config.showConnectionSpinner && !nearest.isConnected) {
        this.showSpinner();
      } else {
        this.hideSpinner();
      }
    } else {
      this.hideProximity();
    }
  }

  /**
   * Show highlight circle around nearby player
   */
  private showProximityHighlight(distance: number): void {
    const { colors } = tokens;

    this.highlightCircle.clear();
    
    // Pulsing highlight effect - more intense when closer
    const intensity = Math.max(0.3, 1 - (distance / this.config.maxDistance));
    const highlightColor = parseInt(colors.accent.replace('#', '0x'));
    
    // Draw outer glow
    this.highlightCircle.lineStyle(2, highlightColor, intensity * 0.5);
    this.highlightCircle.strokeCircle(0, 0, PROXIMITY_HIGHLIGHT_RADIUS + 8);
    
    // Draw main highlight ring
    this.highlightCircle.lineStyle(2, highlightColor, intensity);
    this.highlightCircle.strokeCircle(0, 0, PROXIMITY_HIGHLIGHT_RADIUS);
    
    // Draw inner ring
    this.highlightCircle.lineStyle(1, highlightColor, intensity * 0.7);
    this.highlightCircle.strokeCircle(0, 0, PROXIMITY_HIGHLIGHT_RADIUS - 6);

    this.highlightCircle.setVisible(true);

    // Animate the highlight
    this.animateHighlight(intensity);
  }

  private animateHighlight(intensity: number): void {
    this.scene.tweens.add({
      targets: this.highlightCircle,
      alpha: 0.6,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Show distance text
   */
  private showDistance(distance: number): void {
    const { spacing } = tokens;
    
    const distanceStr = Math.round(distance) + 'px';
    this.distanceText.setText(distanceStr);
    this.distanceText.setVisible(true);
  }

  /**
   * Show connection loading spinner
   */
  private showSpinner(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.spinnerGraphics.setVisible(true);
    this.drawSpinner(0);
    
    // Create spinning animation
    this.spinnerTween = this.scene.tweens.addCounter({
      from: 0,
      to: 360,
      duration: SPINNER_SPEED,
      repeat: -1,
      onUpdate: (tween) => {
        this.drawSpinner(tween.getValue());
      },
    });
  }

  private drawSpinner(angle: number): void {
    const { colors } = tokens;
    const spinnerColor = parseInt(colors.textSecondary.replace('#', '0x'));
    
    this.spinnerGraphics.clear();
    this.spinnerGraphics.lineStyle(2, spinnerColor, 1);
    
    const radius = SPINNER_SIZE / 2;
    const startAngle = Phaser.Math.DegToRad(angle);
    const endAngle = Phaser.Math.DegToRad(angle + 270);
    
    // Draw arc
    this.spinnerGraphics.beginPath();
    this.spinnerGraphics.arc(0, 0, radius, startAngle, endAngle);
    this.spinnerGraphics.strokePath();
  }

  /**
   * Hide spinner
   */
  hideSpinner(): void {
    if (!this.isLoading) return;
    
    this.isLoading = false;
    this.spinnerGraphics.setVisible(false);
    
    if (this.spinnerTween) {
      this.spinnerTween.stop();
      this.spinnerTween = null;
    }
  }

  /**
   * Hide all proximity indicators
   */
  hideProximity(): void {
    this.highlightCircle.setVisible(false);
    this.highlightCircle.setAlpha(1);
    this.distanceText.setVisible(false);
    this.hideSpinner();
    this.nearbyPlayers.clear();
  }

  /**
   * Set position of the indicator
   */
  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  /**
   * Get the container
   */
  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Get nearby players count
   */
  getNearbyCount(): number {
    return this.nearbyPlayers.size;
  }

  /**
   * Check if there are any nearby players
   */
  hasNearbyPlayers(): boolean {
    return this.nearbyPlayers.size > 0;
  }

  /**
   * Destroy the indicator
   */
  destroy(): void {
    this.hideSpinner();
    this.scene.tweens.killTweensOf(this.highlightCircle);
    this.container.destroy();
  }
}
