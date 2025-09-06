import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock geolocation API globally
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock environment variables
process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

// Custom render function that includes providers if needed
const customRender = (ui, options = {}) => {
  const AllTheProviders = ({ children }) => {
    return children;
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Mock trail data for testing
export const mockTrails = [
  {
    id: 1,
    name: "Melville Koppies Trail",
    difficulty: "Moderate",
    distance: 4.5,
    elevationGain: 600,
    rating: 4.8,
    gpsRoute: [
      { latitude: -26.1755, longitude: 27.9715 },
      { latitude: -26.1762, longitude: 27.9708 },
      { latitude: -26.1770, longitude: 27.9695 },
      { latitude: -26.1785, longitude: 27.9680 }
    ],
    location: { latitude: -26.1755, longitude: 27.9715 },
    tags: ["rocky", "panoramic", "city-views"],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-1"
  },
  {
    id: 2,
    name: "Klipriviersberg Loop",
    difficulty: "Hard",
    distance: 8.9,
    elevationGain: 1100,
    rating: 4.6,
    gpsRoute: [
      { latitude: -26.2940, longitude: 28.0250 },
      { latitude: -26.2952, longitude: 28.0261 },
      { latitude: -26.2965, longitude: 28.0275 },
      { latitude: -26.2981, longitude: 28.0290 }
    ],
    location: { latitude: -26.2940, longitude: 28.0250 },
    tags: ["bushveld", "wildlife", "nature-reserve"],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-2"
  },
  {
    id: 3,
    name: "Modderfontein Reserve Path",
    difficulty: "Easy",
    distance: 3.1,
    elevationGain: 200,
    rating: 4.5,
    gpsRoute: [
      { latitude: -26.0690, longitude: 28.1400 },
      { latitude: -26.0695, longitude: 28.1412 },
      { latitude: -26.0700, longitude: 28.1425 },
      { latitude: -26.0705, longitude: 28.1438 }
    ],
    location: { latitude: -26.0690, longitude: 28.1400 },
    tags: ["grassland", "family-friendly", "flat"],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-3"
  }
];

export const mockUserLocation = {
  latitude: -26.2041,
  longitude: 28.0473
};

export const mockFilters = {
  difficulty: 'all',
  tags: 'all',
  minDistance: 0,
  maxDistance: 20,
  maxLocationDistance: 80
};

// Helper function to simulate geolocation success
export const simulateGeolocationSuccess = (latitude = -26.2041, longitude = 28.0473) => {
  const mockPosition = {
    coords: {
      latitude,
      longitude,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  };

  mockGeolocation.getCurrentPosition.mockImplementation((success) => {
    success(mockPosition);
  });
};

// Helper function to simulate geolocation error
export const simulateGeolocationError = (errorMessage = 'User denied geolocation') => {
  const mockError = new Error(errorMessage);
  mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
    error(mockError);
  });
};

// Helper function to reset geolocation mocks
export const resetGeolocationMocks = () => {
  jest.clearAllMocks();
  mockGeolocation.getCurrentPosition.mockReset();
};

// Helper function to create mock trail with specific properties
export const createMockTrail = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  name: "Test Trail",
  difficulty: "Easy",
  distance: 2.0,
  elevationGain: 100,
  rating: 4.0,
  gpsRoute: [
    { latitude: -26.1755, longitude: 27.9715 },
    { latitude: -26.1760, longitude: 27.9720 }
  ],
  location: { latitude: -26.1755, longitude: 27.9715 },
  tags: ["test"],
  status: { status: "open", lastUpdated: new Date() },
  createdBy: "test-user",
  ...overrides
});

// Helper function to create mock filters with specific properties
export const createMockFilters = (overrides = {}) => ({
  ...mockFilters,
  ...overrides
});

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
