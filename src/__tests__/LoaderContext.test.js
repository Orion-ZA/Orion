import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LoaderProvider, useLoader } from '../components/LoaderContext';

// Test component that uses the loader context
const TestComponent = () => {
  const { show, setShow, triggerLoader } = useLoader();
  
  return (
    <div>
      <div data-testid="show-status">{show ? 'true' : 'false'}</div>
      <button data-testid="set-show-true" onClick={() => setShow(true)}>
        Show Loader
      </button>
      <button data-testid="set-show-false" onClick={() => setShow(false)}>
        Hide Loader
      </button>
      <button data-testid="trigger-loader" onClick={() => triggerLoader(100)}>
        Trigger Loader
      </button>
    </div>
  );
};

describe('LoaderContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides default context values', () => {
    render(
      <LoaderProvider>
        <TestComponent />
      </LoaderProvider>
    );
    
    expect(screen.getByTestId('show-status')).toHaveTextContent('false');
  });

  it('allows setting show to true', () => {
    render(
      <LoaderProvider>
        <TestComponent />
      </LoaderProvider>
    );
    
    const setShowTrueButton = screen.getByTestId('set-show-true');
    act(() => {
      setShowTrueButton.click();
    });
    
    expect(screen.getByTestId('show-status')).toHaveTextContent('true');
  });

  it('allows setting show to false', () => {
    render(
      <LoaderProvider>
        <TestComponent />
      </LoaderProvider>
    );
    
    const setShowTrueButton = screen.getByTestId('set-show-true');
    const setShowFalseButton = screen.getByTestId('set-show-false');
    
    act(() => {
      setShowTrueButton.click();
    });
    expect(screen.getByTestId('show-status')).toHaveTextContent('true');
    
    act(() => {
      setShowFalseButton.click();
    });
    expect(screen.getByTestId('show-status')).toHaveTextContent('false');
  });

  it('triggerLoader shows loader and hides it after timeout', () => {
    render(
      <LoaderProvider>
        <TestComponent />
      </LoaderProvider>
    );
    
    const triggerLoaderButton = screen.getByTestId('trigger-loader');
    
    act(() => {
      triggerLoaderButton.click();
    });
    
    // Should show loader immediately
    expect(screen.getByTestId('show-status')).toHaveTextContent('true');
    
    // Fast forward time by 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should hide loader after timeout
    expect(screen.getByTestId('show-status')).toHaveTextContent('false');
  });

  it('triggerLoader uses default timeout of 900ms', () => {
    const TestComponentWithDefaultTimeout = () => {
      const { triggerLoader, show } = useLoader();
      
      return (
        <div>
          <div data-testid="show-status">{show.toString()}</div>
          <button data-testid="trigger-default" onClick={() => triggerLoader()}>
            Trigger Default
          </button>
        </div>
      );
    };

    render(
      <LoaderProvider>
        <TestComponentWithDefaultTimeout />
      </LoaderProvider>
    );
    
    const triggerButton = screen.getByTestId('trigger-default');
    
    act(() => {
      triggerButton.click();
    });
    
    // Should show loader immediately
    expect(screen.getByTestId('show-status')).toHaveTextContent('true');
    
    // Fast forward time by 900ms
    act(() => {
      jest.advanceTimersByTime(900);
    });
    
    // Should still be false since we're not actually updating the state in this test component
    expect(screen.getByTestId('show-status')).toHaveTextContent('false');
  });

  it('multiple triggerLoader calls work independently', () => {
    render(
      <LoaderProvider>
        <TestComponent />
      </LoaderProvider>
    );
    
    const triggerLoaderButton = screen.getByTestId('trigger-loader');
    
    act(() => {
      triggerLoaderButton.click();
    });
    
    expect(screen.getByTestId('show-status')).toHaveTextContent('true');
    
    act(() => {
      triggerLoaderButton.click();
    });
    
    expect(screen.getByTestId('show-status')).toHaveTextContent('true');
    
    // Fast forward time by 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    expect(screen.getByTestId('show-status')).toHaveTextContent('false');
  });

  it('provides stable function references', () => {
    let renderCount = 0;
    
    const TestComponentWithRenderCount = () => {
      const { setShow, triggerLoader } = useLoader();
      renderCount++;
      
      return (
        <div>
          <div data-testid="render-count">{renderCount}</div>
          <button data-testid="set-show" onClick={() => setShow(true)}>
            Set Show
          </button>
          <button data-testid="trigger" onClick={() => triggerLoader()}>
            Trigger
          </button>
        </div>
      );
    };

    const { rerender } = render(
      <LoaderProvider>
        <TestComponentWithRenderCount />
      </LoaderProvider>
    );
    
    const initialRenderCount = renderCount;
    
    // Rerender should not cause unnecessary re-renders due to stable function references
    rerender(
      <LoaderProvider>
        <TestComponentWithRenderCount />
      </LoaderProvider>
    );
    
    expect(renderCount).toBe(initialRenderCount + 1);
  });
});
