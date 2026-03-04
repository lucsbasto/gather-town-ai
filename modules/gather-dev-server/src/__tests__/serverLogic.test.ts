import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Socket.io server for testing
interface MockSocket {
  id: string;
  rooms: Set<string>;
  emit: ReturnType<typeof vi.fn>;
  join: ReturnType<typeof vi.fn>;
  leave: ReturnType<typeof vi.fn>;
  to: ReturnType<typeof vi.fn>;
}

interface MockServer {
  emit: ReturnType<typeof vi.fn>;
  to: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
}

// Player state
interface Player {
  id: string;
  x: number;
  y: number;
  roomId: string;
}

// Movement validation functions (extracted from server)

/**
 * Validate if move is within bounds
 */
export function isValidPosition(x: number, y: number, mapWidth: number = 800, mapHeight: number = 600): boolean {
  const GRID_SIZE = 32;
  const halfGrid = GRID_SIZE / 2;
  
  return x >= halfGrid && x < mapWidth - halfGrid &&
         y >= halfGrid && y < mapHeight - halfGrid;
}

/**
 * Validate move against collision layer
 */
export function isValidMove(
  newX: number, 
  newY: number, 
  collisionLayer: number[][] = []
): boolean {
  // Simple collision check - if collisionLayer has value at position
  const gridX = Math.floor(newX / 32);
  const gridY = Math.floor(newY / 32);
  
  if (collisionLayer.length === 0) return true; // No collision layer
  
  if (gridY < 0 || gridY >= collisionLayer.length) return false;
  if (gridX < 0 || gridX >= collisionLayer[0].length) return false;
  
  return collisionLayer[gridY][gridX] === 0; // 0 = walkable
}

/**
 * Calculate new position from movement intent
 */
export function calculateNewPosition(
  currentX: number,
  currentY: number,
  direction: 'up' | 'down' | 'left' | 'right',
  gridSize: number = 32
): { x: number; y: number } {
  switch (direction) {
    case 'up':
      return { x: currentX, y: currentY - gridSize };
    case 'down':
      return { x: currentX, y: currentY + gridSize };
    case 'left':
      return { x: currentX - gridSize, y: currentY };
    case 'right':
      return { x: currentX + gridSize, y: currentY };
  }
}

/**
 * Validate status transition
 */
export function isValidStatusTransition(
  fromStatus: string,
  toStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    backlog: ['in_progress', 'blocked'],
    in_progress: ['review', 'blocked'],
    review: ['done', 'in_progress'],
    done: [],
    blocked: ['backlog', 'in_progress']
  };
  
  return validTransitions[fromStatus]?.includes(toStatus) ?? false;
}

// Tests
describe('Server Movement Logic', () => {
  describe('isValidPosition', () => {
    it('should return true for center of map', () => {
      expect(isValidPosition(400, 300)).toBe(true);
    });

    it('should return false for negative coordinates', () => {
      expect(isValidPosition(-1, 300)).toBe(false);
      expect(isValidPosition(300, -1)).toBe(false);
    });

    it('should return false for coordinates at edge', () => {
      expect(isValidPosition(800, 300)).toBe(false);
      expect(isValidPosition(400, 600)).toBe(false);
    });

    it('should return true for valid grid positions', () => {
      expect(isValidPosition(32, 32)).toBe(true);
      expect(isValidPosition(768, 568)).toBe(true);
    });
  });

  describe('calculateNewPosition', () => {
    it('should move up correctly', () => {
      const result = calculateNewPosition(400, 300, 'up');
      expect(result).toEqual({ x: 400, y: 268 });
    });

    it('should move down correctly', () => {
      const result = calculateNewPosition(400, 300, 'down');
      expect(result).toEqual({ x: 400, y: 332 });
    });

    it('should move left correctly', () => {
      const result = calculateNewPosition(400, 300, 'left');
      expect(result).toEqual({ x: 368, y: 300 });
    });

    it('should move right correctly', () => {
      const result = calculateNewPosition(400, 300, 'right');
      expect(result).toEqual({ x: 432, y: 300 });
    });
  });

  describe('isValidStatusTransition', () => {
    it('should allow backlog to in_progress', () => {
      expect(isValidStatusTransition('backlog', 'in_progress')).toBe(true);
    });

    it('should allow in_progress to review', () => {
      expect(isValidStatusTransition('in_progress', 'review')).toBe(true);
    });

    it('should allow review to done', () => {
      expect(isValidStatusTransition('review', 'done')).toBe(true);
    });

    it('should NOT allow done to anything', () => {
      expect(isValidStatusTransition('done', 'backlog')).toBe(false);
      expect(isValidStatusTransition('done', 'in_progress')).toBe(false);
    });

    it('should allow blocked to backlog', () => {
      expect(isValidStatusTransition('blocked', 'backlog')).toBe(true);
    });
  });
});
