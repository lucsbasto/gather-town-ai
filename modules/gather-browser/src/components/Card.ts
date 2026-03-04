/**
 * Card Component - GT-UI-001
 * Uses design tokens for consistent styling
 */

import { tokens } from './designTokens';

export interface CardConfig {
  width: number;
  height?: number;
  title?: string;
}

export class GameCard {
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private titleText?: Phaser.GameObjects.Text;
  private content: Phaser.GameObjects.Container;
  private config: CardConfig;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: CardConfig
  ) {
    this.config = config;
    const { card, colors, typography, spacing } = tokens;

    // Create container
    this.container = scene.add.container(x, y);
    this.content = scene.add.container(0, 0);

    // Create background with border
    this.background = scene.add.graphics();
    const height = config.height || 100;
    
    this.background.fillStyle(
      parseInt(colors.bgSurface.replace('#', '0x')),
      1
    );
    this.background.fillRoundedRect(
      -config.width / 2,
      -height / 2,
      config.width,
      height,
      parseInt(card.radius)
    );

    // Border
    this.background.lineStyle(1, parseInt(colors.border.replace('rgba(', '').replace(')', '').replace(/,/g, '')));
    this.background.strokeRoundedRect(
      -config.width / 2,
      -height / 2,
      config.width,
      height,
      parseInt(card.radius)
    );

    this.container.add(this.background);

    // Add title if provided
    if (config.title) {
      this.titleText = scene.add.text(
        -config.width / 2 + parseInt(card.padding),
        -height / 2 + parseInt(card.padding),
        config.title,
        {
          fontSize: typography.fontSizeBase,
          fontFamily: typography.fontFamily,
          color: colors.textPrimary,
        }
      );
      this.container.add(this.titleText);
    }

    this.container.add(this.content);
  }

  addElement(element: Phaser.GameObjects.GameObject): void {
    this.content.add(element);
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }
}
