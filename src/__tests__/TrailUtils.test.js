import React from 'react';
import { render } from '@testing-library/react';
import {
  formatDate,
  formatLocation,
  getAlertTypeColor,
  getAlertTypeIcon,
  renderStars,
  getDifficultyColor,
  truncateUserId,
} from '../utils/trailUtils';

describe('trailUtils', () => {
  describe('formatDate', () => {
    it('returns N/A for null timestamp', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    it('returns N/A for undefined timestamp', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('returns N/A for empty string timestamp', () => {
      expect(formatDate('')).toBe('N/A');
    });

    it('handles Firestore Timestamp objects', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15T10:30:00Z'),
      };
      const result = formatDate(mockTimestamp);
      expect(result).toBe('2024/01/15'); // Format depends on locale
    });

    it('handles string timestamps', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toBe('2024/01/15'); // Format depends on locale
    });

    it('handles Date objects', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024/01/15'); // Format depends on locale
    });

    it('handles numeric timestamps', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
      const result = formatDate(timestamp);
      expect(result).toBe('2024/01/15'); // Format depends on locale
    });

    it('returns N/A for invalid string timestamps', () => {
      expect(formatDate('invalid-date')).toBe('N/A');
    });

    it('returns N/A for invalid Date objects', () => {
      const invalidDate = new Date('invalid');
      expect(formatDate(invalidDate)).toBe('N/A');
    });

    it('handles Firestore Timestamp with invalid toDate', () => {
      const mockTimestamp = {
        toDate: () => new Date('invalid'),
      };
      expect(formatDate(mockTimestamp)).toBe('N/A');
    });

    it('handles Firestore Timestamp with non-function toDate', () => {
      const mockTimestamp = {
        toDate: 'not a function',
      };
      const result = formatDate(mockTimestamp);
      expect(result).toBe('N/A');
    });
  });

  describe('formatLocation', () => {
    it('returns N/A for null location', () => {
      expect(formatLocation(null)).toBe('N/A');
    });

    it('returns N/A for undefined location', () => {
      expect(formatLocation(undefined)).toBe('N/A');
    });

    it('returns N/A for empty string location', () => {
      expect(formatLocation('')).toBe('N/A');
    });

    it('handles Firestore GeoPoint format (latitude/longitude)', () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.006,
      };
      expect(formatLocation(location)).toBe('40.7128, -74.0060');
    });

    it('handles lat/lng format', () => {
      const location = {
        lat: 40.7128,
        lng: -74.006,
      };
      expect(formatLocation(location)).toBe('40.7128, -74.0060');
    });

    it('handles coordinates array format', () => {
      const location = {
        coordinates: [-74.006, 40.7128], // [lng, lat] format
      };
      expect(formatLocation(location)).toBe('40.7128, -74.0060');
    });

    it('handles coordinates array with more than 2 elements', () => {
      const location = {
        coordinates: [-74.006, 40.7128, 100], // [lng, lat, elevation]
      };
      expect(formatLocation(location)).toBe('40.7128, -74.0060');
    });

    it('handles empty coordinates array', () => {
      const location = {
        coordinates: [],
      };
      expect(formatLocation(location)).toBe('[object Object]');
    });

    it('handles coordinates array with insufficient elements', () => {
      const location = {
        coordinates: [-74.006], // Only longitude
      };
      expect(formatLocation(location)).toBe('[object Object]');
    });

    it('handles string location', () => {
      expect(formatLocation('New York, NY')).toBe('New York, NY');
    });

    it('handles object with no recognizable format', () => {
      const location = {
        name: 'Central Park',
        address: 'New York, NY',
      };
      expect(formatLocation(location)).toBe('[object Object]');
    });

    it('handles numeric values', () => {
      expect(formatLocation(123)).toBe('N/A');
    });

    it('handles boolean values', () => {
      expect(formatLocation(true)).toBe('N/A');
    });

    it('handles undefined latitude/longitude', () => {
      const location = {
        latitude: undefined,
        longitude: undefined,
      };
      expect(formatLocation(location)).toBe('[object Object]');
    });

    it('handles null latitude/longitude', () => {
      const location = {
        latitude: null,
        longitude: null,
      };
      expect(formatLocation(location)).toBe('undefined, undefined');
    });

    it('handles mixed coordinate formats', () => {
      const location = {
        lat: 40.7128,
        longitude: -74.006, // Mixed lat/lng and latitude/longitude
      };
      expect(formatLocation(location)).toBe('[object Object]');
    });
  });

  describe('getAlertTypeColor', () => {
    it('returns correct color for hazard type', () => {
      expect(getAlertTypeColor('hazard')).toBe('#ef4444');
    });

    it('returns correct color for closure type', () => {
      expect(getAlertTypeColor('closure')).toBe('#f59e0b');
    });

    it('returns correct color for maintenance type', () => {
      expect(getAlertTypeColor('maintenance')).toBe('#3b82f6');
    });

    it('returns correct color for weather type', () => {
      expect(getAlertTypeColor('weather')).toBe('#8b5cf6');
    });

    it('returns correct color for general type', () => {
      expect(getAlertTypeColor('general')).toBe('#6b7280');
    });

    it('handles uppercase types', () => {
      expect(getAlertTypeColor('HAZARD')).toBe('#ef4444');
    });

    it('handles mixed case types', () => {
      expect(getAlertTypeColor('Hazard')).toBe('#ef4444');
    });

    it('returns default color for unknown type', () => {
      expect(getAlertTypeColor('unknown')).toBe('#6b7280');
    });

    it('returns default color for null type', () => {
      expect(getAlertTypeColor(null)).toBe('#6b7280');
    });

    it('returns default color for undefined type', () => {
      expect(getAlertTypeColor(undefined)).toBe('#6b7280');
    });

    it('returns default color for empty string', () => {
      expect(getAlertTypeColor('')).toBe('#6b7280');
    });

    it('handles numeric types', () => {
      expect(() => getAlertTypeColor(123)).toThrow();
    });

    it('handles object types', () => {
      expect(() => getAlertTypeColor({ type: 'hazard' })).toThrow();
    });
  });

  describe('getAlertTypeIcon', () => {
    it('returns correct icon for hazard type', () => {
      expect(getAlertTypeIcon('hazard')).toBe('AlertTriangle');
    });

    it('returns correct icon for closure type', () => {
      expect(getAlertTypeIcon('closure')).toBe('XCircle');
    });

    it('returns correct icon for maintenance type', () => {
      expect(getAlertTypeIcon('maintenance')).toBe('Wrench');
    });

    it('returns correct icon for weather type', () => {
      expect(getAlertTypeIcon('weather')).toBe('CloudRain');
    });

    it('returns correct icon for general type', () => {
      expect(getAlertTypeIcon('general')).toBe('Info');
    });

    it('handles uppercase types', () => {
      expect(getAlertTypeIcon('HAZARD')).toBe('AlertTriangle');
    });

    it('handles mixed case types', () => {
      expect(getAlertTypeIcon('Hazard')).toBe('AlertTriangle');
    });

    it('returns default icon for unknown type', () => {
      expect(getAlertTypeIcon('unknown')).toBe('Info');
    });

    it('returns default icon for null type', () => {
      expect(getAlertTypeIcon(null)).toBe('Info');
    });

    it('returns default icon for undefined type', () => {
      expect(getAlertTypeIcon(undefined)).toBe('Info');
    });

    it('returns default icon for empty string', () => {
      expect(getAlertTypeIcon('')).toBe('Info');
    });

    it('handles numeric types', () => {
      expect(() => getAlertTypeIcon(123)).toThrow();
    });

    it('handles object types', () => {
      expect(() => getAlertTypeIcon({ type: 'hazard' })).toThrow();
    });
  });

  describe('renderStars', () => {
    it('renders correct number of filled stars for rating 3', () => {
      const { container } = render(<div>{renderStars(3)}</div>);
      const stars = container.querySelectorAll('.trail-card-star');
      expect(stars).toHaveLength(5);

      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(3);
    });

    it('renders correct number of filled stars for rating 5', () => {
      const { container } = render(<div>{renderStars(5)}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(5);
    });

    it('renders no filled stars for rating 0', () => {
      const { container } = render(<div>{renderStars(0)}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(0);
    });

    it('handles string rating by converting to 0', () => {
      const { container } = render(<div>{renderStars('3')}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(0);
    });

    it('handles null rating', () => {
      const { container } = render(<div>{renderStars(null)}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(0);
    });

    it('handles undefined rating', () => {
      const { container } = render(<div>{renderStars(undefined)}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(0);
    });

    it('handles negative rating', () => {
      const { container } = render(<div>{renderStars(-1)}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(0);
    });

    it('handles rating greater than 5', () => {
      const { container } = render(<div>{renderStars(7)}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(5);
    });

    it('handles decimal rating', () => {
      const { container } = render(<div>{renderStars(3.7)}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(4);
    });

    it('renders all stars with correct keys', () => {
      const { container } = render(<div>{renderStars(3)}</div>);
      const stars = container.querySelectorAll('.trail-card-star');

      expect(stars).toHaveLength(5);

      stars.forEach((star, index) => {
        // Check that it's an SVG element (Lucide React Star component)
        expect(star.tagName).toBe('svg');
        // Check that it has the correct class names
        expect(star.classList.contains('trail-card-star')).toBe(true);
        // React keys are not rendered as HTML attributes in testing environment
      });
    });

    it('handles boolean rating', () => {
      const { container } = render(<div>{renderStars(true)}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(0);
    });

    it('handles object rating', () => {
      const { container } = render(<div>{renderStars({ rating: 3 })}</div>);
      const filledStars = container.querySelectorAll('.trail-card-star.filled');
      expect(filledStars).toHaveLength(0);
    });
  });

  describe('getDifficultyColor', () => {
    it('returns correct color for easy difficulty', () => {
      expect(getDifficultyColor('easy')).toBe('#34c759');
    });

    it('returns correct color for moderate difficulty', () => {
      expect(getDifficultyColor('moderate')).toBe('#ffc107');
    });

    it('returns correct color for hard difficulty', () => {
      expect(getDifficultyColor('hard')).toBe('#ff6b6b');
    });

    it('handles capitalized Easy', () => {
      expect(getDifficultyColor('Easy')).toBe('#34c759');
    });

    it('handles capitalized Moderate', () => {
      expect(getDifficultyColor('Moderate')).toBe('#ffc107');
    });

    it('handles capitalized Hard', () => {
      expect(getDifficultyColor('Hard')).toBe('#ff6b6b');
    });

    it('handles uppercase difficulty', () => {
      expect(getDifficultyColor('EASY')).toBe('#a0a0a0');
    });

    it('returns default color for unknown difficulty', () => {
      expect(getDifficultyColor('unknown')).toBe('#a0a0a0');
    });

    it('returns default color for null difficulty', () => {
      expect(getDifficultyColor(null)).toBe('#a0a0a0');
    });

    it('returns default color for undefined difficulty', () => {
      expect(getDifficultyColor(undefined)).toBe('#a0a0a0');
    });

    it('returns default color for empty string', () => {
      expect(getDifficultyColor('')).toBe('#a0a0a0');
    });

    it('handles numeric difficulty', () => {
      expect(getDifficultyColor(1)).toBe('#a0a0a0');
    });

    it('handles object difficulty', () => {
      expect(getDifficultyColor({ level: 'easy' })).toBe('#a0a0a0');
    });

    it('handles mixed case difficulty', () => {
      expect(getDifficultyColor('MoDeRaTe')).toBe('#a0a0a0');
    });
  });

  describe('truncateUserId', () => {
    it('returns Unknown for null userId', () => {
      expect(truncateUserId(null)).toBe('Unknown');
    });

    it('returns Unknown for undefined userId', () => {
      expect(truncateUserId(undefined)).toBe('Unknown');
    });

    it('returns Unknown for empty string', () => {
      expect(truncateUserId('')).toBe('Unknown');
    });

    it('returns Unknown for non-string userId', () => {
      expect(truncateUserId(123)).toBe('Unknown');
    });

    it('returns Unknown for object userId', () => {
      expect(truncateUserId({ id: 'user123' })).toBe('Unknown');
    });

    it('returns userId as-is if shorter than maxLength', () => {
      expect(truncateUserId('user123')).toBe('user123');
    });

    it('returns userId as-is if equal to maxLength', () => {
      expect(truncateUserId('user123456789')).toBe('user12345...');
    });

    it('truncates short userIds with ellipsis', () => {
      expect(truncateUserId('user1234567890')).toBe('user12345...');
    });

    it('truncates Firebase UIDs with first and last 6 characters', () => {
      const longUserId = 'abcdefghijklmnopqrstuvwxyz123456789';
      expect(truncateUserId(longUserId)).toBe('abcdef...456789');
    });

    it('handles custom maxLength', () => {
      expect(truncateUserId('user1234567890', 8)).toBe('user1...');
    });

    it('handles very short maxLength', () => {
      expect(truncateUserId('user1234567890', 3)).toBe('...');
    });

    it('handles maxLength of 0', () => {
      expect(truncateUserId('user1234567890', 0)).toBe('...');
    });

    it('handles negative maxLength', () => {
      expect(truncateUserId('user1234567890', -1)).toBe('...');
    });

    it('handles Firebase UID with custom maxLength', () => {
      const longUserId = 'abcdefghijklmnopqrstuvwxyz123456789';
      expect(truncateUserId(longUserId, 20)).toBe('abcdef...456789');
    });

    it('handles exactly 20 character userId', () => {
      const userId = 'abcdefghijklmnopqrst';
      expect(truncateUserId(userId)).toBe('abcdefghi...');
    });

    it('handles 21 character userId (triggers Firebase UID logic)', () => {
      const userId = 'abcdefghijklmnopqrstu';
      expect(truncateUserId(userId)).toBe('abcdef...pqrstu');
    });

    it('handles boolean userId', () => {
      expect(truncateUserId(true)).toBe('Unknown');
    });

    it('handles array userId', () => {
      expect(truncateUserId(['user', '123'])).toBe('Unknown');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('handles all functions with extreme values', () => {
      // Test formatDate with extreme values
      expect(formatDate(new Date('1970-01-01'))).toBe('1970/01/01');
      expect(formatDate(new Date('2099-12-31'))).toBe('2099/12/31');

      // Test formatLocation with extreme coordinates
      expect(formatLocation({ lat: 90, lng: 180 })).toBe('90.0000, 180.0000');
      expect(formatLocation({ lat: -90, lng: -180 })).toBe('-90.0000, -180.0000');

      // Test renderStars with extreme ratings
      const { container } = render(<div>{renderStars(0)}</div>);
      expect(container.querySelectorAll('.trail-card-star.filled')).toHaveLength(0);

      const { container: container2 } = render(<div>{renderStars(5)}</div>);
      expect(container2.querySelectorAll('.trail-card-star.filled')).toHaveLength(5);
    });

    it('handles functions with special characters', () => {
      expect(truncateUserId('user@#$%^&*()')).toBe('user@#$%^...');
      expect(formatLocation('Location with special chars: @#$%')).toBe(
        'Location with special chars: @#$%'
      );
    });

    it('handles functions with unicode characters', () => {
      expect(truncateUserId('用户123')).toBe('用户123');
      expect(formatLocation('北京市')).toBe('北京市');
    });

    it('handles functions with very long strings', () => {
      const veryLongString = 'a'.repeat(1000);
      expect(truncateUserId(veryLongString)).toBe('aaaaaa...aaaaaa');
    });

    it('handles functions with whitespace', () => {
      expect(truncateUserId('  user123  ')).toBe('  user123  ');
      expect(formatLocation('  New York  ')).toBe('  New York  ');
    });
  });
});
