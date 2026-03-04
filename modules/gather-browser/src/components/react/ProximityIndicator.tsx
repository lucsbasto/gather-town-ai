/**
 * ProximityIndicator Component - GT-UI-003
 * Visual feedback for players within proximity range
 * - Highlights players within 200px
 * - Shows distance text
 * - Connection loading spinner
 */

import React from 'react';
import { designTokens, Player } from './designTokens';

interface ProximityIndicatorProps {
  nearbyPlayers: Player[];
  currentPlayerId: string;
  proximityThreshold?: number;
  isConnecting?: boolean;
}

export const ProximityIndicator: React.FC<ProximityIndicatorProps> = ({
  nearbyPlayers,
  currentPlayerId,
  proximityThreshold = 200,
  isConnecting = false,
}) => {
  const { colors, spacing, card, typography } = designTokens;

  // Calculate distance between two points
  const getDistance = (p1: Player, p2: Player): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const currentPlayer = nearbyPlayers.find(p => p.id === currentPlayerId);
  
  // Filter players within range (excluding self)
  const playersInRange = currentPlayer 
    ? nearbyPlayers.filter(p => 
        p.id !== currentPlayerId && 
        getDistance(currentPlayer, p) <= proximityThreshold
      )
    : [];

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.bgSurface,
    border: card.border,
    borderRadius: card.radius,
    padding: card.padding,
    minWidth: '200px',
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    zIndex: 100,
  };

  const headerStyle: React.CSSProperties = {
    fontSize: typography.fontSizeBase,
    fontWeight: 600,
    marginBottom: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const playerItemStyle = (distance: number): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.xs} ${spacing.sm}`,
    marginBottom: spacing.xs,
    backgroundColor: distance < 100 ? `${colors.accent}20` : 'transparent',
    borderRadius: '4px',
    borderLeft: `3px solid ${distance < 100 ? colors.accent : colors.border}`,
  });

  const playerNameStyle: React.CSSProperties = {
    fontSize: typography.fontSizeSmall,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const distanceStyle: React.CSSProperties = {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  };

  const emptyStyle: React.CSSProperties = {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  };

  const spinnerStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTopColor: colors.textPrimary,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    display: 'inline-block',
    marginRight: spacing.sm,
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={headerStyle}>
        <span>Nearby Players</span>
        {isConnecting && <span style={spinnerStyle} />}
      </div>
      
      {playersInRange.length === 0 ? (
        <div style={emptyStyle}>
          No players within {proximityThreshold}px
        </div>
      ) : (
        playersInRange.map(player => {
          const distance = currentPlayer ? getDistance(currentPlayer, player) : 0;
          return (
            <div key={player.id} style={playerItemStyle(distance)}>
              <div style={playerNameStyle}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 
                      player.status === 'available' ? colors.success :
                      player.status === 'busy' ? colors.danger :
                      player.status === 'in_meeting' ? colors.warning :
                      colors.muted,
                  }}
                />
                {player.name}
                {player.isTalking && ' 💬'}
              </div>
              <div style={distanceStyle}>
                {Math.round(distance)}px
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ProximityIndicator;
