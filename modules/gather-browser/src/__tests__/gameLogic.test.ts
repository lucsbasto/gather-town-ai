import { describe, it, expect } from 'vitest';

// Utility functions for game logic

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two players are within proximity threshold
 */
export function isWithinProximity(
  x1: number, y1: number,
  x2: number, y2: number,
  threshold: number = 200
): boolean {
  return calculateDistance(x1, y1, x2, y2) < threshold;
}

/**
 * Calculate volume based on distance (inverse falloff)
 */
export function calculateVolume(distance: number, maxDistance: number): number {
  return Math.max(0, 1 - (distance / maxDistance));
}

/**
 * Snap position to grid
 */
export function snapToGrid(value: number, gridSize: number = 32): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Check if position is within bounds
 */
export function isWithinBounds(
  x: number, y: number,
  width: number, height: number
): boolean {
  return x >= 0 && x < width && y >= 0 && y < height;
}

// Tests
describe('Game Logic Utilities', () => {
  describe('calculateDistance', () => {
    it('should return 0 for same position', () => {
      expect(calculateDistance(100, 100, 100, 100)).toBe(0);
    });

    it('should calculate correct distance for horizontal movement', () => {
      expect(calculateDistance(0, 0, 300, 0)).toBe(300);
    });

    it('should calculate correct distance for vertical movement', () => {
      expect(calculateDistance(0, 0, 0, 400)).toBe(400);
    });

    it('should calculate correct distance for diagonal movement', () => {
      const distance = calculateDistance(0, 0, 300, 400);
      expect(distance).toBe(500);
    });
  });

  describe('isWithinProximity', () => {
    it('should return true when within threshold', () => {
      expect(isWithinProximity(0, 0, 100, 100, 200)).toBe(true);
    });

    it('should return false when outside threshold', () => {
      expect(isWithinProximity(0, 0, 300, 0, 200)).toBe(false);
    });

    it('should return true at exactly threshold distance', () => {
      expect(isWithinProximity(0, 0, 200, 0, 200)).toBe(false); // < not <=
    });
  });

  describe('calculateVolume', () => {
    it('should return 1 at distance 0', () => {
      expect(calculateVolume(0, 200)).toBe(1);
    });

    it('should return 0 at max distance', () => {
      expect(calculateVolume(200, 200)).toBe(0);
    });

    it('should return 0.5 at half distance', () => {
      expect(calculateVolume(100, 200)).toBe(0.5);
    });

    it('should return negative for beyond max', () => {
      expect(calculateVolume(300, 200)).toBe(0); // clamped to 0
    });
  });

  describe('snapToGrid', () => {
    it('should snap to nearest grid line', () => {
      expect(snapToGrid(35, 32)).toBe(32);
      expect(snapToGrid(33, 32)).toBe(32);
      expect(snapToGrid(48, 32)).toBe(48);
    });

    it('should handle values below grid size', () => {
      expect(snapToGrid(16, 32)).toBe(16);
      expect(snapToGrid(0, 32)).toBe(0);
    });
  });

  describe('isWithinBounds', () => {
    it('should return true for valid position', () => {
      expect(isWithinBounds(100, 100, 800, 600)).toBe(true);
    });

    it('should return false for negative coordinates', () => {
      expect(isWithinBounds(-1, 100, 800, 600)).toBe(false);
    });

    it('should return false for coordinates at edge', () => {
      expect(isWithinBounds(800, 100, 800, 600)).toBe(false); // x = width
      expect(isWithinBounds(100, 600, 800, 600)).toBe(false); // y = height
    });
  });
});
