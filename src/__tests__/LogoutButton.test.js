import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import LogoutButton from '../components/LogoutButton';
import { useLoader } from '../components/LoaderContext';

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}));

// Mock LoaderContext
jest.mock('../components/LoaderContext', () => ({
  useLoader: jest.fn(),
}));

// Mock firebaseConfig
jest.mock('../firebaseConfig', () => ({
  auth: {},
}));

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

// Mock console.error
const mockConsoleError = jest.fn();
global.console.error = mockConsoleError;

// Helper function to render with router and context
const renderWithProviders = (component) => {
  const mockTriggerLoader = jest.fn();
  
  useLoader.mockReturnValue({
    triggerLoader: mockTriggerLoader,
  });
  
  return {
    ...render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    ),
    mockTriggerLoader,
  };
};

describe('LogoutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders logout button with correct structure', () => {
    renderWithProviders(<LogoutButton />);
    
    const logoutWrapper = document.querySelector('.logout-wrapper');
    expect(logoutWrapper).toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: /logout/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('Btn');
    expect(button).toHaveAttribute('aria-label', 'Logout');
    expect(button).not.toBeDisabled();
  });

  it('renders logout icon and text', () => {
    renderWithProviders(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: /logout/i });
    
    // Check for sign icon
    const signSpan = button.querySelector('.sign');
    expect(signSpan).toBeInTheDocument();
    expect(signSpan).toHaveAttribute('aria-hidden', 'true');
    
    const svg = signSpan.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 512 512');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    
    // Check for text
    const textSpan = button.querySelector('.text');
    expect(textSpan).toBeInTheDocument();
    expect(textSpan).toHaveTextContent('Logout');
  });

  it('handles successful logout', async () => {
    const { mockTriggerLoader } = renderWithProviders(<LogoutButton />);
    
    signOut.mockResolvedValueOnce();
    
    const button = screen.getByRole('button', { name: /logout/i });
    
    fireEvent.click(button);
    
    // Button should be disabled while loading
    expect(button).toBeDisabled();
    
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
    
    // Should trigger loader and navigate (navigation is mocked by react-router-dom)
    expect(mockTriggerLoader).toHaveBeenCalledTimes(1);
  });

  it('handles logout error', async () => {
    const { mockTriggerLoader } = renderWithProviders(<LogoutButton />);
    
    const error = new Error('Logout failed');
    signOut.mockRejectedValueOnce(error);
    
    const button = screen.getByRole('button', { name: /logout/i });
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
    
    // Should show error alert
    expect(mockAlert).toHaveBeenCalledWith('Failed to logout. Please try again.');
    
    // Should log error
    expect(mockConsoleError).toHaveBeenCalledWith('Failed to logout:', error);
    
    // Should not trigger loader on error
    expect(mockTriggerLoader).not.toHaveBeenCalled();
  });

  it('handles logout error without message', async () => {
    renderWithProviders(<LogoutButton />);
    
    const error = new Error();
    error.message = undefined;
    signOut.mockRejectedValueOnce(error);
    
    const button = screen.getByRole('button', { name: /logout/i });
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
    
    // Should show default error message
    expect(mockAlert).toHaveBeenCalledWith('Failed to logout. Please try again.');
  });

  it('shows loading state during logout', async () => {
    renderWithProviders(<LogoutButton />);
    
    // Mock a delayed signOut
    signOut.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const button = screen.getByRole('button', { name: /logout/i });
    
    fireEvent.click(button);
    
    // Button should be disabled immediately
    expect(button).toBeDisabled();
    
    // Wait for the promise to resolve
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });

  it('button is not disabled initially', () => {
    renderWithProviders(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: /logout/i });
    expect(button).not.toBeDisabled();
  });

  it('button becomes enabled again after error', async () => {
    renderWithProviders(<LogoutButton />);
    
    signOut.mockRejectedValueOnce(new Error('Test error'));
    
    const button = screen.getByRole('button', { name: /logout/i });
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
    
    // Button should be enabled again after error
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('renders with correct CSS classes', () => {
    renderWithProviders(<LogoutButton />);
    
    const logoutWrapper = document.querySelector('.logout-wrapper');
    expect(logoutWrapper).toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: /logout/i });
    expect(button).toHaveClass('Btn');
    
    const signSpan = button.querySelector('.sign');
    expect(signSpan).toHaveClass('sign');
    
    const textSpan = button.querySelector('.text');
    expect(textSpan).toHaveClass('text');
  });
});
