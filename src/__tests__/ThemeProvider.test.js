import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';

// Mock window.matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test component that uses the theme context
const TestComponent = () => {
  const { mode, resolved, setMode } = useTheme();
  
  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="resolved">{resolved}</div>
      <button data-testid="set-light" onClick={() => setMode('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setMode('dark')}>
        Set Dark
      </button>
      <button data-testid="set-auto" onClick={() => setMode('auto')}>
        Set Auto
      </button>
    </div>
  );
};

describe('ThemeProvider', () => {
  let mockMediaQuery;
  let mockAddEventListener;
  let mockRemoveEventListener;

  beforeEach(() => {
    mockAddEventListener = jest.fn();
    mockRemoveEventListener = jest.fn();
    
    mockMediaQuery = {
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    };
    
    mockMatchMedia.mockReturnValue(mockMediaQuery);
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    
    // Reset document.documentElement
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('provides default context values', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('mode')).toHaveTextContent('auto');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('loads saved mode from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('applies light theme when mode is light', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const setLightButton = screen.getByTestId('set-light');
    
    act(() => {
      setLightButton.click();
    });
    
    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('applies dark theme when mode is dark', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const setDarkButton = screen.getByTestId('set-dark');
    
    act(() => {
      setDarkButton.click();
    });
    
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('follows system preference when mode is auto', () => {
    mockMediaQuery.matches = true; // System prefers dark
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('mode')).toHaveTextContent('auto');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('follows system preference for light when mode is auto', () => {
    mockMediaQuery.matches = false; // System prefers light
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('mode')).toHaveTextContent('auto');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('saves mode to localStorage when changed', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const setDarkButton = screen.getByTestId('set-dark');
    
    act(() => {
      setDarkButton.click();
    });
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('orion-theme', 'dark');
  });

  it('handles localStorage errors gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const setDarkButton = screen.getByTestId('set-dark');
    
    // Should not throw error
    expect(() => {
      act(() => {
        setDarkButton.click();
      });
    }).not.toThrow();
  });

  it('listens to system preference changes when in auto mode', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('does not listen to system changes when not in auto mode', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const setLightButton = screen.getByTestId('set-light');
    
    act(() => {
      setLightButton.click();
    });
    
    // Should not add event listener for non-auto modes
    expect(mockAddEventListener).toHaveBeenCalledTimes(1); // Only the initial call
  });

  it('updates theme when system preference changes in auto mode', () => {
    mockMediaQuery.matches = false; // Initially light
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    
    // Simulate system preference change to dark
    mockMediaQuery.matches = true;
    const changeHandler = mockAddEventListener.mock.calls[0][1];
    
    act(() => {
      changeHandler();
    });
    
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('handles missing matchMedia gracefully', () => {
    // Mock window.matchMedia as undefined
    const originalMatchMedia = window.matchMedia;
    delete window.matchMedia;
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('mode')).toHaveTextContent('auto');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    
    // Restore matchMedia
    window.matchMedia = originalMatchMedia;
  });

  it('provides stable function references', () => {
    let renderCount = 0;
    
    const TestComponentWithRenderCount = () => {
      const { setMode } = useTheme();
      renderCount++;
      
      return (
        <div>
          <div data-testid="render-count">{renderCount}</div>
          <button data-testid="set-mode" onClick={() => setMode('light')}>
            Set Mode
          </button>
        </div>
      );
    };

    const { rerender } = render(
      <ThemeProvider>
        <TestComponentWithRenderCount />
      </ThemeProvider>
    );
    
    const initialRenderCount = renderCount;
    
    // Rerender should not cause unnecessary re-renders due to stable function reference
    rerender(
      <ThemeProvider>
        <TestComponentWithRenderCount />
      </ThemeProvider>
    );
    
    expect(renderCount).toBe(initialRenderCount + 1);
  });
});
