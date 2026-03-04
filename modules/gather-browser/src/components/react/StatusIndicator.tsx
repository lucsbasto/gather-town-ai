/**
 * StatusIndicator Component - GT-UI-005
 * User status display
 * - Green = Available
 * - Red = Busy
 * - Yellow = In Meeting
 * - Gray = Away
 */

import React from 'react';
import { designTokens, PlayerStatus } from './designTokens';

interface StatusIndicatorProps {
  status: PlayerStatus;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const statusConfig = {
  available: {
    color: '#22c55e',
    label: 'Available',
  },
  busy: {
    color: '#ef4444',
    label: 'Busy',
  },
  in_meeting: {
    color: '#eab308',
    label: 'In Meeting',
  },
  away: {
    color: '#6b7280',
    label: 'Away',
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showLabel = false,
  size = 'medium',
}) => {
  const { colors, spacing, typography } = designTokens;

  const sizeMap = {
    small: '8px',
    medium: '12px',
    large: '16px',
  };

  const dotSize = sizeMap[size];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const dotStyle: React.CSSProperties = {
    width: dotSize,
    height: dotSize,
    borderRadius: '50%',
    backgroundColor: statusConfig[status].color,
    boxShadow: `0 0 4px ${statusConfig[status].color}80`,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  };

  return (
    <div style={containerStyle}>
      <div style={dotStyle} />
      {showLabel && <span style={labelStyle}>{statusConfig[status].label}</span>}
    </div>
  );
};

// Compact version for inline use
export const StatusDot: React.FC<{ status: PlayerStatus; size?: 'small' | 'medium' }> = ({
  status,
  size = 'medium',
}) => {
  const sizeMap = {
    small: '6px',
    medium: '10px',
  };

  return (
    <div
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: '50%',
        backgroundColor: statusConfig[status].color,
      }}
    />
  );
};

export default StatusIndicator;
