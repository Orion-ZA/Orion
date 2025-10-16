import { 
  estimateDuration, 
  getDifficultyColor, 
  getDifficultyIcon, 
  calculateDistance, 
  calculateRouteDistance, 
  formatFileSize 
} from '../components/trails/TrailUtils';

describe('TrailUtils', () => {
  describe('estimateDuration', () => {
  it('should return "Not specified" for invalid or zero distance', () => {
    expect(estimateDuration(0)).toBe('Not specified');
    expect(estimateDuration(null)).toBe('Not specified');
    expect(estimateDuration(undefined)).toBe('Not specified');
    expect(estimateDuration(-5)).toBe('Not specified');
  });

  it('should estimate duration for short distances (less than 1 hour)', () => {
    // 1 km at 3.5 km/h = 0.2857 hours
    // min: 0.2857 * 0.8 = 0.228 hours = 13.7 min
    // max: 0.2857 * 1.4 = 0.400 hours = 24 min
    expect(estimateDuration(1)).toMatch(/(\d+) min - (\d+) min/);
    expect(estimateDuration(1)).toBe('14 min - 24 min');
  });

  it('should estimate duration for medium distances (1-2 hours)', () => {
    // 5 km at 3.5 km/h = 1.428 hours
    // min: 1.428 * 0.8 = 1.14 hours = 1h 9m
    // max: 1.428 * 1.4 = 2.00 hours = 2h
    expect(estimateDuration(5)).toMatch(/(\d+)h (\d+)m - (\d+)h/);
    expect(estimateDuration(5)).toBe('1h 9m - 2h');
  });

  it('should estimate duration for longer distances (more than 2 hours)', () => {
    // 10 km at 3.5 km/h = 2.857 hours
    // min: 2.857 * 0.8 = 2.28 hours = 2h 17m
    // max: 2.857 * 1.4 = 4.00 hours = 4h
    expect(estimateDuration(10)).toMatch(/(\d+)h (\d+)m - (\d+)h/);
    expect(estimateDuration(10)).toBe('2h 17m - 4h');
  });

  it('should handle edge case where minHours is very close to maxHours', () => {
    // For a very small distance, min and max might be very close.
    // The function ensures min is always less than max by at least 0.1 hours.
    // Let's pick a distance that results in very close min/max
    // e.g., distance = 0.1 km
    // baseHours = 0.1 / 3.5 = 0.02857
    // minHours = 0.02857 * 0.8 = 0.0228 hours = 1.37 min
    // maxHours = 0.02857 * 1.4 = 0.0400 hours = 2.4 min
    // The `finalMinHours` and `finalMaxHours` logic should ensure a reasonable range.
    expect(estimateDuration(0.1)).toBe('6 min - 7 min');
  });

  it('should format time correctly for exactly 1 hour', () => {
    // 3.5 km at 3.5 km/h = 1 hour
    // min: 1 * 0.8 = 0.8 hours = 48 min
    // max: 1 * 1.4 = 1.4 hours = 1h 24m
    expect(estimateDuration(3.5)).toBe('48 min - 1h 24m');
  });

  it('should format time correctly for exactly 2 hours', () => {
    // 7 km at 3.5 km/h = 2 hours
    // min: 2 * 0.8 = 1.6 hours = 1h 36m
    // max: 2 * 1.4 = 2.8 hours = 2h 48m
    expect(estimateDuration(7)).toBe('1h 36m - 2h 48m');
  });

  it('should handle fractional hours correctly for formatting', () => {
    // Test formatTime directly if possible, or through estimateDuration
    // For example, 1.5 hours should be 1h 30m
    // Let's find a distance that results in 1.5 hours for one of the bounds
    // 1.5 * 3.5 = 5.25 km
    // min: 5.25 * 0.8 = 4.2 hours = 1h 12m
    // max: 5.25 * 1.4 = 7.35 hours = 2h 6m
    expect(estimateDuration(5.25)).toBe('1h 12m - 2h 6m');
  });

  it('should handle decimal distances correctly', () => {
    // Test with various decimal distances
    expect(estimateDuration(2.5)).toMatch(/(\d+) min - (\d+)h/);
    expect(estimateDuration(3.7)).toMatch(/(\d+) min - (\d+)h (\d+)m/);
  });

  it('should ensure min time is always less than max time', () => {
    // Test multiple distances to ensure the constraint is always met
    const distances = [0.1, 0.5, 1, 2, 5, 10, 20];
    
    distances.forEach(distance => {
      const result = estimateDuration(distance);
      expect(result).not.toBe('Not specified');
      
      // Extract times and verify min < max
      const timeMatch = result.match(/(\d+)(?:h (\d+))?m? - (\d+)(?:h (\d+))?m?/);
      if (timeMatch) {
        const [, minHours, minMins, maxHours, maxMins] = timeMatch;
        const minTotalMins = parseInt(minHours) * 60 + (parseInt(minMins) || 0);
        const maxTotalMins = parseInt(maxHours) * 60 + (parseInt(maxMins) || 0);
        
        expect(minTotalMins).toBeLessThan(maxTotalMins);
      }
    });
  });

  it('should handle very small distances correctly', () => {
    // Test with very small distances
    expect(estimateDuration(0.01)).toMatch(/(\d+) min - (\d+) min/);
    expect(estimateDuration(0.05)).toMatch(/(\d+) min - (\d+) min/);
  });

  it('should handle very large distances correctly', () => {
    // Test with very large distances
    const result = estimateDuration(100);
    expect(result).toMatch(/(\d+)h (\d+)m - (\d+)h/);
    
    // Should be a reasonable range for 100km
    expect(result).toContain('h');
  });
  });

  describe('getDifficultyColor', () => {
    it('should return correct colors for different difficulty levels', () => {
      expect(getDifficultyColor('easy')).toBe('#4CAF50');
      expect(getDifficultyColor('Easy')).toBe('#4CAF50');
      expect(getDifficultyColor('EASY')).toBe('#4CAF50');
      
      expect(getDifficultyColor('moderate')).toBe('#FF9800');
      expect(getDifficultyColor('Moderate')).toBe('#FF9800');
      
      expect(getDifficultyColor('hard')).toBe('#F44336');
      expect(getDifficultyColor('difficult')).toBe('#F44336');
      expect(getDifficultyColor('Hard')).toBe('#F44336');
      
      expect(getDifficultyColor('expert')).toBe('#9C27B0');
      expect(getDifficultyColor('Expert')).toBe('#9C27B0');
    });

    it('should return default blue color for unknown difficulty', () => {
      expect(getDifficultyColor('unknown')).toBe('#2196F3');
      expect(getDifficultyColor('')).toBe('#2196F3');
      expect(getDifficultyColor(null)).toBe('#2196F3');
      expect(getDifficultyColor(undefined)).toBe('#2196F3');
    });
  });

  describe('getDifficultyIcon', () => {
    it('should return correct icons for different difficulty levels', () => {
      const easyIcon = getDifficultyIcon('easy');
      const moderateIcon = getDifficultyIcon('moderate');
      const hardIcon = getDifficultyIcon('hard');
      const expertIcon = getDifficultyIcon('expert');
      
      expect(easyIcon).toBeDefined();
      expect(moderateIcon).toBeDefined();
      expect(hardIcon).toBeDefined();
      expect(expertIcon).toBeDefined();
    });

    it('should return default icon for unknown difficulty', () => {
      const defaultIcon = getDifficultyIcon('unknown');
      expect(defaultIcon).toBeDefined();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates correctly', () => {
      // Test distance between same points (should be 0)
      expect(calculateDistance(0, 0, 0, 0)).toBeCloseTo(0, 6);
      
      // Test distance between known points
      // Distance between (0,0) and (0,1) should be approximately 111.32 km
      const distance = calculateDistance(0, 0, 0, 1);
      expect(distance).toBeCloseTo(111.19, 1);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-1, -1, 1, 1);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(314.5, 1);
    });

    it('should handle edge cases', () => {
      // Very small distance
      const smallDistance = calculateDistance(0, 0, 0.001, 0.001);
      expect(smallDistance).toBeGreaterThan(0);
      
      // Large distance
      const largeDistance = calculateDistance(0, 0, 90, 180);
      expect(largeDistance).toBeGreaterThan(10000);
    });
  });

  describe('calculateRouteDistance', () => {
    it('should return 0 for empty or single point route', () => {
      expect(calculateRouteDistance([])).toBe(0);
      expect(calculateRouteDistance([[0, 0]])).toBe(0);
    });

    it('should calculate total distance for a route', () => {
      const routePoints = [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0]
      ];
      
      const totalDistance = calculateRouteDistance(routePoints);
      expect(totalDistance).toBeGreaterThan(0);
      expect(totalDistance).toBeCloseTo(333.57, 1); // Approximate distance for this square route
    });

    it('should handle route with many points', () => {
      const routePoints = [
        [0, 0],
        [0.1, 0.1],
        [0.2, 0.2],
        [0.3, 0.3],
        [0.4, 0.4]
      ];
      
      const totalDistance = calculateRouteDistance(routePoints);
      expect(totalDistance).toBeGreaterThan(0);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.50 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 5.7)).toBe('5.70 GB');
    });

    it('should handle edge cases', () => {
      expect(formatFileSize(1)).toBe('1 B');
      expect(formatFileSize(1023)).toBe('1023 B');
      expect(formatFileSize(1024 * 1023)).toBe('1023.0 KB');
    });
  });
});