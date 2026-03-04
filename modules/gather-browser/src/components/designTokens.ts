/**
 * Design Tokens - GT-UI-001
 * Dark theme system for Gather Town AI interface
 */

export const tokens = {
  // Colors - Dark Theme
  colors: {
    bgPrimary: '#1a1a2e',
    bgSurface: '#16213e',
    bgElevated: '#0f3460',
    accent: '#e94560',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.2)',
    success: '#00ff00',
    warning: '#ffff00',
    danger: '#ff6666',
  },

  // Spacing - 4px base
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },

  // Typography
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSizeSmall: '12px',
    fontSizeBase: '14px',
    fontSizeLarge: '16px',
  },

  // Button - 36px height, 6px radius
  button: {
    height: '36px',
    padding: '12px 16px',
    radius: '6px',
  },

  // Card - 16px padding, 8px radius, 1px border
  card: {
    padding: '16px',
    radius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },

  // Input
  input: {
    height: '36px',
    padding: '8px 12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
} as const;

export type DesignTokens = typeof tokens;
