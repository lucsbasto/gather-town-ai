/**
 * Design Tokens for React Components
 * Based on GT-UI-001 design system
 * Dark theme: #1a1a2e, #16213e
 * 4px spacing base, 36px buttons, 16px card padding
 */

export const designTokens = {
  colors: {
    bgPrimary: '#1a1a2e',
    bgSurface: '#16213e',
    bgElevated: '#0f3460',
    accent: '#e94560',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.2)',
    success: '#22c55e',  // Green - Available
    danger: '#ef4444',   // Red - Busy
    warning: '#eab308', // Yellow - In Meeting
    muted: '#6b7280',   // Gray - Away
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSizeSmall: '12px',
    fontSizeBase: '14px',
    fontSizeLarge: '16px',
  },
  button: {
    height: '36px',
    padding: '12px 16px',
    radius: '6px',
  },
  card: {
    padding: '16px',
    radius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  input: {
    height: '36px',
    padding: '8px 12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
};

export type PlayerStatus = 'available' | 'busy' | 'in_meeting' | 'away';

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  status: PlayerStatus;
  isTalking?: boolean;
  isMuted?: boolean;
}
