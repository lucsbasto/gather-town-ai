/**
 * Button Component - GT-UI-001
 * Uses design tokens for consistent styling
 */

import { tokens } from './designTokens';

export interface ButtonConfig {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export class GameButton {
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private config: ButtonConfig;
  private isHovered = false;
  private isPressed = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: ButtonConfig
  ) {
    this.config = config;
    const { button, colors, typography } = tokens;

    // Create container
    this.container = scene.add.container(x, y);

    // Create background
    this.background = scene.add.graphics();
    this.drawBackground();
    this.container.add(this.background);

    // Create text
    this.text = scene.add.text(0, 0, config.text, {
      fontSize: typography.fontSizeBase,
      fontFamily: typography.fontFamily,
      color: this.getTextColor(),
    }).setOrigin(0.5);
    this.container.add(this.text);

    // Set interactive
    this.container.setSize(
      parseInt(button.padding) * 2 + this.text.width,
      parseInt(button.height)
    );
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(
        -this.container.width / 2,
        -parseInt(button.height) / 2,
        this.container.width,
        parseInt(button.height)
      ),
      Phaser.Geom.Rectangle.Contains
    );

    // Event handlers
    this.container.on('pointerover', this.onHover, this);
    this.container.on('pointerout', this.onOut, this);
    this.container.on('pointerdown', this.onDown, this);
    this.container.on('pointerup', this.onUp, this);
  }

  private drawBackground(): void {
    const { button, colors } = tokens;
    const height = parseInt(button.height);
    const radius = parseInt(button.radius);
    const padding = parseInt(button.padding);
    const width = padding * 2 + this.text.width;

    this.background.clear();
    this.background.fillStyle(
      this.getBackgroundColor(),
      this.config.disabled ? 0.5 : 1
    );
    this.background.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      radius
    );

    // Border
    this.background.lineStyle(1, colors.border);
    this.background.strokeRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      radius
    );
  }

  private getBackgroundColor(): number {
    if (this.config.disabled) return parseInt(tokens.colors.bgSurface.replace('#', '0x'));
    if (this.isPressed) return parseInt(tokens.colors.accent.replace('#', '0x'));
    if (this.isHovered) return parseInt(tokens.colors.bgElevated.replace('#', '0x'));
    return parseInt(tokens.colors.bgSurface.replace('#', '0x'));
  }

  private getTextColor(): string {
    if (this.config.disabled) return tokens.colors.textSecondary;
    if (this.isPressed || this.isHovered) return tokens.colors.textPrimary;
    return tokens.colors.textSecondary;
  }

  private onHover(): void {
    if (this.config.disabled) return;
    this.isHovered = true;
    this.drawBackground();
    this.text.setColor(this.getTextColor());
  }

  private onOut(): void {
    this.isHovered = false;
    this.isPressed = false;
    this.drawBackground();
    this.text.setColor(this.getTextColor());
  }

  private onDown(): void {
    if (this.config.disabled) return;
    this.isPressed = true;
    this.drawBackground();
    this.text.setColor(this.getTextColor());
  }

  private onUp(): void {
    if (this.config.disabled) return;
    this.isPressed = false;
    this.drawBackground();
    this.text.setColor(this.getTextColor());
    if (this.isHovered) {
      this.config.onClick();
    }
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
