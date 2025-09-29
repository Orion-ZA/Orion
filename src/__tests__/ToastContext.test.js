import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../components/ToastContext';

// Test component that uses the toast context
const TestComponent = () => {
  const { show } = useToast();
  
  return (
    <div>
      <button 
        data-testid="show-info" 
        onClick={() => show('Info message', { type: 'info' })}
      >
        Show Info
      </button>
      <button 
        data-testid="show-success" 
        onClick={() => show('Success message', { type: 'success' })}
      >
        Show Success
      </button>
      <button 
        data-testid="show-error" 
        onClick={() => show('Error message', { type: 'error' })}
      >
        Show Error
      </button>
      <button 
        data-testid="show-warning" 
        onClick={() => show('Warning message', { type: 'warning' })}
      >
        Show Warning
      </button>
      <button 
        data-testid="show-default" 
        onClick={() => show('Default message')}
      >
        Show Default
      </button>
      <button 
        data-testid="show-custom-timeout" 
        onClick={() => show('Custom timeout', { timeout: 1000 })}
      >
        Show Custom Timeout
      </button>
    </div>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders toast container with correct attributes', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const toastContainer = screen.getByRole('status');
    expect(toastContainer).toBeInTheDocument();
    expect(toastContainer).toHaveClass('toast-container');
    expect(toastContainer).toHaveAttribute('aria-live', 'polite');
    expect(toastContainer).toHaveAttribute('aria-atomic', 'true');
  });

  it('shows info toast with correct message and type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const showInfoButton = screen.getByTestId('show-info');
    
    act(() => {
      showInfoButton.click();
    });
    
    const toast = screen.getByText('Info message');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast');
    expect(toast).toHaveClass('info');
  });

  it('shows success toast with correct message and type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const showSuccessButton = screen.getByTestId('show-success');
    
    act(() => {
      showSuccessButton.click();
    });
    
    const toast = screen.getByText('Success message');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast');
    expect(toast).toHaveClass('success');
  });

  it('shows error toast with correct message and type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const showErrorButton = screen.getByTestId('show-error');
    
    act(() => {
      showErrorButton.click();
    });
    
    const toast = screen.getByText('Error message');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast');
    expect(toast).toHaveClass('error');
  });

  it('shows warning toast with correct message and type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const showWarningButton = screen.getByTestId('show-warning');
    
    act(() => {
      showWarningButton.click();
    });
    
    const toast = screen.getByText('Warning message');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast');
    expect(toast).toHaveClass('warning');
  });

  it('shows default toast with info type when no type specified', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const showDefaultButton = screen.getByTestId('show-default');
    
    act(() => {
      showDefaultButton.click();
    });
    
    const toast = screen.getByText('Default message');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast');
    expect(toast).toHaveClass('info');
  });

  it('auto-dismisses toast after default timeout', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const showInfoButton = screen.getByTestId('show-info');
    
    act(() => {
      showInfoButton.click();
    });
    
    expect(screen.getByText('Info message')).toBeInTheDocument();
    
    // Fast forward time by 2500ms (default timeout)
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses toast after custom timeout', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const showCustomTimeoutButton = screen.getByTestId('show-custom-timeout');
    
    act(() => {
      showCustomTimeoutButton.click();
    });
    
    expect(screen.getByText('Custom timeout')).toBeInTheDocument();
    
    // Fast forward time by 1000ms (custom timeout)
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Custom timeout')).not.toBeInTheDocument();
    });
  });

  it('shows multiple toasts simultaneously', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const showInfoButton = screen.getByTestId('show-info');
    const showSuccessButton = screen.getByTestId('show-success');
    
    act(() => {
      showInfoButton.click();
      showSuccessButton.click();
    });
    
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('assigns unique IDs to toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const showInfoButton = screen.getByTestId('show-info');
    const showSuccessButton = screen.getByTestId('show-success');
    
    act(() => {
      showInfoButton.click();
      showSuccessButton.click();
    });
    
    const toasts = screen.getAllByText(/message/);
    expect(toasts).toHaveLength(2);
    
    // Each toast should have a unique key (we can't directly test this, but we can verify they're separate elements)
    expect(toasts[0]).not.toBe(toasts[1]);
  });

  it('returns toast ID from show function', () => {
    let toastId;
    
    const TestComponentWithId = () => {
      const { show } = useToast();
      
      return (
        <button 
          data-testid="show-with-id" 
          onClick={() => {
            toastId = show('Test message');
          }}
        >
          Show with ID
        </button>
      );
    };

    render(
      <ToastProvider>
        <TestComponentWithId />
      </ToastProvider>
    );
    
    const showButton = screen.getByTestId('show-with-id');
    
    act(() => {
      showButton.click();
    });
    
    expect(toastId).toBe(1);
  });

  it('provides stable function reference', () => {
    let renderCount = 0;
    
    const TestComponentWithRenderCount = () => {
      const { show } = useToast();
      renderCount++;
      
      return (
        <div>
          <div data-testid="render-count">{renderCount}</div>
          <button data-testid="show" onClick={() => show('Test')}>
            Show
          </button>
        </div>
      );
    };

    const { rerender } = render(
      <ToastProvider>
        <TestComponentWithRenderCount />
      </ToastProvider>
    );
    
    const initialRenderCount = renderCount;
    
    // Rerender should not cause unnecessary re-renders due to stable function reference
    rerender(
      <ToastProvider>
        <TestComponentWithRenderCount />
      </ToastProvider>
    );
    
    expect(renderCount).toBe(initialRenderCount + 1);
  });
});
