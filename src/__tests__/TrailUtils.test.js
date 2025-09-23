import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock lucide-react icons to deterministic components we can assert on
jest.mock('lucide-react', () => ({
  Footprints: (props) => <i data-icon="footprints" {...props} />,
  Mountain: (props) => <i data-icon="mountain" {...props} />,
  AlertTriangle: (props) => <i data-icon="alert-triangle" {...props} />,
  Zap: (props) => <i data-icon="zap" {...props} />,
}));

import {
  getDifficultyColor,
  getDifficultyIcon,
  calculateDistance,
  calculateRouteDistance,
  formatFileSize,
} from '../components/trails/TrailUtils';

describe('TrailUtils', () => {
  describe('getDifficultyColor', () => {
    it('returns expected colors for known difficulties (case-insensitive)', () => {
      expect(getDifficultyColor('easy')).toBe('#4CAF50');
      expect(getDifficultyColor('EASY')).toBe('#4CAF50');
      expect(getDifficultyColor('moderate')).toBe('#FF9800');
      expect(getDifficultyColor('MODERATE')).toBe('#FF9800');
      expect(getDifficultyColor('hard')).toBe('#F44336');
      expect(getDifficultyColor('HARD')).toBe('#F44336');
      expect(getDifficultyColor('difficult')).toBe('#F44336');
      expect(getDifficultyColor('DIFFICULT')).toBe('#F44336');
      expect(getDifficultyColor('expert')).toBe('#9C27B0');
      expect(getDifficultyColor('EXPERT')).toBe('#9C27B0');
    });

    it('returns default color for unknown difficulty or falsy', () => {
      expect(getDifficultyColor('unknown')).toBe('#2196F3');
      expect(getDifficultyColor(undefined)).toBe('#2196F3');
      expect(getDifficultyColor(null)).toBe('#2196F3');
      expect(getDifficultyColor('')).toBe('#2196F3');
    });
  });

  describe('getDifficultyIcon', () => {
    function renderIcon(iconElement) {
      const { container } = render(<div data-testid="host">{iconElement}</div>);
      return container.querySelector('i');
    }

    it('returns Footprints for easy and default', () => {
      const easyIcon = renderIcon(getDifficultyIcon('easy'));
      expect(easyIcon).toHaveAttribute('data-icon', 'footprints');

      const defaultIcon = renderIcon(getDifficultyIcon('unknown'));
      expect(defaultIcon).toHaveAttribute('data-icon', 'footprints');
    });

    it('returns Mountain for moderate', () => {
      const el = renderIcon(getDifficultyIcon('moderate'));
      expect(el).toHaveAttribute('data-icon', 'mountain');
    });

    it('returns AlertTriangle for hard/difficult', () => {
      const hardEl = renderIcon(getDifficultyIcon('hard'));
      expect(hardEl).toHaveAttribute('data-icon', 'alert-triangle');

      const diffEl = renderIcon(getDifficultyIcon('difficult'));
      expect(diffEl).toHaveAttribute('data-icon', 'alert-triangle');
    });

    it('returns Zap for expert', () => {
      const el = renderIcon(getDifficultyIcon('expert'));
      expect(el).toHaveAttribute('data-icon', 'zap');
    });
  });

  describe('calculateDistance (Haversine)', () => {
    it('returns 0 for identical points', () => {
      expect(calculateDistance(0, 0, 0, 0)).toBeCloseTo(0, 6);
    });

    it('computes ~111.195 km for 1° longitude at equator', () => {
      // From (0,0) to (0,1)
      const km = calculateDistance(0, 0, 0, 1);
      expect(km).toBeCloseTo(111.195, 3);
    });

    it('computes known distance between two coordinates', () => {
      // Approx distance between NYC (40.7128,-74.0060) and LA (34.0522,-118.2437)
      const nycLat = 40.7128;
      const nycLon = -74.0060;
      const laLat = 34.0522;
      const laLon = -118.2437;
      const km = calculateDistance(nycLat, nycLon, laLat, laLon);
      // Real-world approx ~3936 km
      expect(km).toBeGreaterThan(3900);
      expect(km).toBeLessThan(4000);
    });
  });

  describe('calculateRouteDistance', () => {
    it('returns 0 for fewer than two points', () => {
      expect(calculateRouteDistance([])).toBe(0);
      expect(calculateRouteDistance([[0, 0]])).toBe(0);
    });

    it('sums distances between consecutive [lng, lat] points', () => {
      // Route: (0,0) -> (1,0) -> (1,1)
      // Note input format is [lng, lat]
      const route = [
        [0, 0],
        [1, 0],
        [1, 1],
      ];
      const total = calculateRouteDistance(route);
      // Approximately 111.195 km + 111.178 km (second leg at longitude 1)
      expect(total).toBeGreaterThan(222);
      expect(total).toBeLessThan(223);
    });
  });

  describe('formatFileSize', () => {
    it('handles 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats bytes without decimals', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('formats KB with 1 decimal', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats MB with 2 decimals', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(5 * 1024 * 1024 + 512 * 1024)).toBe('5.50 MB');
    });

    it('formats GB with 2 decimals', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
      // 2.25 GB
      const bytes = 2.25 * 1024 * 1024 * 1024;
      expect(formatFileSize(bytes)).toBe('2.25 GB');
    });
  });
});


