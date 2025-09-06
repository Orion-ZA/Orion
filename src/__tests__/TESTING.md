# Testing Documentation

This document provides comprehensive information about the testing suite for the TrailExplorer application.

## Overview

The testing suite covers all major components and functionality of the TrailExplorer application, including:

- **TrailExplorer Page**: Main component integration and user interactions
- **useTrails Hook**: Custom hook for trail data management and filtering
- **TrailList Component**: Trail display and selection functionality
- **FilterPanel Component**: Filter controls and user interactions
- **TrailMap Component**: Map rendering and trail visualization

## Test Structure

```
src/
├── __tests__/                    # Consolidated test directory
│   ├── TrailExplorer.test.js     # Main page component tests
│   ├── useTrails.test.js         # Custom hook tests
│   ├── TrailList.test.js         # Trail list component tests
│   ├── FilterPanel.test.js       # Filter panel component tests
│   └── TrailMap.test.js          # Map component tests (currently skipped)
├── test-utils.js                 # Test utilities and helpers
└── setupTests.js                 # Jest setup configuration
```

## Current Test Status

### ✅ Passing Tests
- **TrailExplorer.test.js**: All tests passing (15/15)
  - Component rendering
  - Filter panel toggle functionality
  - Location services integration
  - Trail selection
  - Filtering functionality
  - Error handling

### ⚠️ Tests with Issues
- **useTrails.test.js**: 2 failing tests (93/95 passing)
  - Distance filtering test (data changes affecting expected results)
  - Memoization test (data changes affecting expected results)

- **FilterPanel.test.js**: 1 failing test (349/350 passing)
  - Empty tags input handling

- **TrailList.test.js**: 3 failing tests (314/317 passing)
  - calculateDistance function returning undefined
  - Distance display issues

- **TrailMap.test.js**: Skipped due to map library dependency issues
  - react-map-gl/mapbox module not found in test environment

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Specific Test File
```bash
npm test -- TrailExplorer.test.js
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in CI Mode
```bash
npm test -- --ci --coverage --watchAll=false
```

## Test Coverage

### TrailExplorer Page (`TrailExplorer.test.js`) ✅
- **Rendering**: Component renders correctly with all elements
- **Filter Panel Toggle**: Show/hide filter panel functionality
- **Location Services**: Geolocation API integration and error handling
- **Trail Selection**: Selecting trails from map and list
- **Filtering**: Filter application and trail list updates
- **Empty States**: Handling when no trails are available
- **Component Integration**: Proper prop passing between components
- **Accessibility**: Button states and user interaction
- **Error Handling**: Location errors and missing geolocation support

### useTrails Hook (`useTrails.test.js`) ⚠️
- **Initial State**: Default values and state initialization
- **Filtering**: Difficulty, tags, distance, and combined filters
- **Location Services**: Geolocation API calls and state management
- **Distance Filtering**: Location-based trail filtering
- **Distance Calculation**: Haversine formula implementation
- **Filter State Management**: State updates and preservation
- **Memoization**: Performance optimization verification
- **Edge Cases**: Empty data, case sensitivity, partial matching

### TrailList Component (`TrailList.test.js`) ⚠️
- **Rendering**: Trail list display and information
- **User Location**: Distance display and calculations
- **Trail Selection**: Click handling and selection state
- **Empty State**: No trails available message
- **Difficulty Colors**: Visual difficulty indicators
- **Distance Calculation**: Proper distance function calls
- **Props Validation**: Missing optional props handling
- **User Interactions**: Hover effects and interactions
- **Accessibility**: Readable format and clickable elements

### FilterPanel Component (`FilterPanel.test.js`) ⚠️
- **Rendering**: All filter controls and current values
- **Difficulty Filter**: Dropdown options and selection
- **Tags Filter**: Text input and search functionality
- **Distance Filters**: Range sliders and value updates
- **Filter Updates**: Multiple filter changes and state updates
- **Edge Cases**: Missing props and extreme values
- **Accessibility**: Proper labels and input types
- **Styling and Layout**: CSS classes and responsive design

### TrailMap Component (`TrailMap.test.js`) ⏸️
- **Status**: Currently skipped due to map library dependency issues
- **Rendering**: Map container and controls
- **Trail Markers**: Marker rendering and coordinates
- **User Location**: Location marker display
- **Selected Trail**: Selection state handling
- **Map Configuration**: View state and positioning
- **Trail Data Processing**: GPS route handling
- **Props Validation**: Missing optional props
- **Error Handling**: Missing tokens and invalid data
- **Accessibility**: Container structure and styling

## Test Utilities (`test-utils.js`)

The test utilities file provides:

### Mock Data
- `mockTrails`: Sample trail data for testing
- `mockUserLocation`: Sample user location coordinates
- `mockFilters`: Default filter state

### Helper Functions
- `simulateGeolocationSuccess()`: Mock successful geolocation
- `simulateGeolocationError()`: Mock geolocation errors
- `resetGeolocationMocks()`: Reset geolocation mocks
- `createMockTrail()`: Create custom trail objects
- `createMockFilters()`: Create custom filter objects

### Global Mocks
- Geolocation API mocking
- Environment variables setup
- Custom render function with providers

## Known Issues and Solutions

### 1. TrailMap Test Issues
**Problem**: `react-map-gl/mapbox` module not found in test environment
**Solution**: Currently skipped. To fix, would need to:
- Install map library dependencies for testing
- Create proper mocks for map components
- Or use a different testing approach for map components

### 2. calculateDistance Function Issues
**Problem**: Function returning undefined in TrailList tests
**Solution**: Mock function needs to be properly configured to return a number

### 3. Data Consistency Issues
**Problem**: useTrails tests failing due to data changes
**Solution**: Update test expectations to match current data structure

### 4. FilterPanel Empty Tags Issue
**Problem**: Empty tags input not triggering expected callback
**Solution**: Check component implementation for proper event handling

## Testing Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the behavior
- Test both success and failure scenarios

### 2. Mocking Strategy
- Mock external dependencies (geolocation, map libraries)
- Use consistent mock data across tests
- Reset mocks between tests to avoid interference

### 3. User Interaction Testing
- Use `fireEvent` for reliable event simulation
- Test keyboard and mouse interactions
- Verify accessibility features

### 4. Component Testing
- Test component rendering and props
- Verify event handlers are called correctly
- Test component state changes
- Check for proper error handling

### 5. Hook Testing
- Use `renderHook` for custom hook testing
- Test all hook return values
- Verify state updates and side effects
- Test memoization and performance optimizations

## Adding New Tests

### 1. Create Test File
Create a new test file in the `src/__tests__` directory:
```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import YourComponent from '../components/YourComponent';

describe('YourComponent', () => {
  // Your tests here
});
```

### 2. Test Structure
Follow this structure for new tests:
```javascript
describe('YourComponent', () => {
  beforeEach(() => {
    // Setup code
  });

  describe('Rendering', () => {
    // Test component rendering
  });

  describe('User Interactions', () => {
    // Test user interactions
  });

  describe('Props and State', () => {
    // Test props and state changes
  });

  describe('Edge Cases', () => {
    // Test error conditions and edge cases
  });
});
```

### 3. Use Test Utilities
Import and use the test utilities for consistent mocking:
```javascript
import { 
  render, 
  mockTrails, 
  mockUserLocation, 
  simulateGeolocationSuccess 
} from '../test-utils';
```

## Common Testing Patterns

### Testing Async Operations
```javascript
test('handles async operation', async () => {
  render(<Component />);
  
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Testing Event Handlers
```javascript
test('calls event handler', () => {
  const mockHandler = jest.fn();
  
  render(<Component onAction={mockHandler} />);
  fireEvent.click(screen.getByText('Action'));
  
  expect(mockHandler).toHaveBeenCalledWith(expectedValue);
});
```

### Testing State Changes
```javascript
test('updates state correctly', () => {
  const { result } = renderHook(() => useCustomHook());
  
  act(() => {
    result.current.updateState(newValue);
  });
  
  expect(result.current.state).toBe(newValue);
});
```

## Debugging Tests

### 1. Debug Mode
Run tests in debug mode to step through code:
```bash
npm test -- --debug
```

### 2. Console Logging
Add console.log statements in tests for debugging:
```javascript
test('debug test', () => {
  console.log('Debug info:', someValue);
  // Test code
});
```

### 3. Screen Debug
Use screen.debug() to see the rendered output:
```javascript
test('debug rendering', () => {
  render(<Component />);
  screen.debug(); // Shows the rendered HTML
});
```

## Performance Testing

### 1. Test Execution Time
Monitor test execution time to ensure tests run efficiently:
```bash
npm test -- --verbose
```

### 2. Memory Usage
Watch for memory leaks in tests, especially with large datasets:
```bash
npm test -- --detectLeaks
```

## Continuous Integration

The testing suite is designed to work with CI/CD pipelines:

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm test -- --ci --coverage --watchAll=false
```

### Coverage Requirements
- Aim for >80% code coverage
- Focus on critical user paths
- Test error handling and edge cases

## Troubleshooting

### Common Issues

1. **Geolocation Mock Not Working**
   - Ensure `resetGeolocationMocks()` is called in `beforeEach`
   - Check that the mock is properly set up in `test-utils.js`

2. **Map Component Tests Failing**
   - Verify that all map dependencies are properly mocked
   - Check that environment variables are set correctly

3. **Async Test Failures**
   - Use `waitFor` for async operations
   - Ensure proper cleanup in `afterEach` blocks

4. **Component Not Rendering**
   - Check that all required props are provided
   - Verify that mocks are not interfering with rendering

### Getting Help

If you encounter issues with the testing suite:

1. Check the console output for error messages
2. Review the test utilities and mock setup
3. Ensure all dependencies are properly installed
4. Verify that the test environment is correctly configured

## Future Improvements

- Fix remaining failing tests
- Add integration tests for full user workflows
- Implement visual regression testing
- Add performance benchmarking tests
- Create end-to-end tests with Cypress or Playwright
- Add accessibility testing with axe-core
- Resolve TrailMap test issues with proper map library setup
