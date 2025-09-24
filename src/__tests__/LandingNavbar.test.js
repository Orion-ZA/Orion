import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingNavbar from '../components/landing/LandingNavbar';

describe('LandingNavbar', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    mockOnLogin.mockClear();
  });

  it('renders navbar with correct structure', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('navbar');
  });

  it('renders brand section', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const brandLink = screen.getByRole('link', { name: /orion/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '#home');
    expect(brandLink).toHaveClass('brand');
    
    const brandIcon = screen.getByText('🌌');
    expect(brandIcon).toBeInTheDocument();
    expect(brandIcon).toHaveClass('brand-icon');
    expect(brandIcon).toHaveAttribute('aria-hidden', 'true');
    
    const brandText = screen.getByText('Orion');
    expect(brandText).toBeInTheDocument();
    expect(brandText).toHaveClass('brand-text');
  });

  it('renders navigation links', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const navLinks = screen.getByRole('navigation');
    expect(navLinks).toBeInTheDocument();
    expect(navLinks).toHaveClass('nav-links');
    expect(navLinks).toHaveClass('desktop-nav');
    
    const trailExplorerLink = screen.getByText('Trail Explorer');
    expect(trailExplorerLink).toBeInTheDocument();
    expect(trailExplorerLink).toHaveAttribute('href', '#explorer');
    
    const trailSubmissionLink = screen.getByText('Trail Submission');
    expect(trailSubmissionLink).toBeInTheDocument();
    expect(trailSubmissionLink).toHaveAttribute('href', '#submit');
    
    const reviewsLink = screen.getByText('Reviews & Media');
    expect(reviewsLink).toBeInTheDocument();
    expect(reviewsLink).toHaveAttribute('href', '#reviews');
  });

  it('renders login button', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveClass('nav-login-btn');
    expect(loginButton).toHaveTextContent('Login');
  });

  it('calls onLogin when login button is clicked', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.click(loginButton);
    
    expect(mockOnLogin).toHaveBeenCalledTimes(1);
  });

  it('renders nav inner container', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const navInner = document.querySelector('.nav-inner');
    expect(navInner).toBeInTheDocument();
  });

  it('renders nav actions container', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const navActions = document.querySelector('.nav-actions');
    expect(navActions).toBeInTheDocument();
    expect(navActions).toHaveClass('desktop-actions');
  });

  it('applies correct CSS classes to all elements', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('navbar');
    
    const navInner = document.querySelector('.nav-inner');
    expect(navInner).toHaveClass('nav-inner');
    
    const brandLink = screen.getByRole('link', { name: /orion/i });
    expect(brandLink).toHaveClass('brand');
    
    const brandIcon = screen.getByText('🌌');
    expect(brandIcon).toHaveClass('brand-icon');
    
    const brandText = screen.getByText('Orion');
    expect(brandText).toHaveClass('brand-text');
    
    const navLinks = screen.getByRole('navigation');
    expect(navLinks).toHaveClass('nav-links');
    expect(navLinks).toHaveClass('desktop-nav');
    
    const navActions = document.querySelector('.nav-actions');
    expect(navActions).toHaveClass('nav-actions');
    expect(navActions).toHaveClass('desktop-actions');
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toHaveClass('nav-login-btn');
  });

  it('renders all navigation links with correct href attributes', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const expectedLinks = [
      { text: 'Trail Explorer', href: '#explorer' },
      { text: 'Trail Submission', href: '#submit' },
      { text: 'Reviews & Media', href: '#reviews' }
    ];
    
    expectedLinks.forEach(({ text, href }) => {
      const link = screen.getByText(text);
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('handles multiple login button clicks', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.click(loginButton);
    fireEvent.click(loginButton);
    fireEvent.click(loginButton);
    
    expect(mockOnLogin).toHaveBeenCalledTimes(3);
  });

  it('renders without onLogin prop', () => {
    render(<LandingNavbar />);
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeInTheDocument();
    
    // Should not throw error when clicked without onLogin
    expect(() => {
      fireEvent.click(loginButton);
    }).not.toThrow();
  });

  it('renders with undefined onLogin prop', () => {
    render(<LandingNavbar onLogin={undefined} />);
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeInTheDocument();
    
    // Should not throw error when clicked with undefined onLogin
    expect(() => {
      fireEvent.click(loginButton);
    }).not.toThrow();
  });

  it('renders with correct accessibility attributes', () => {
    render(<LandingNavbar onLogin={mockOnLogin} />);
    
    const brandIcon = screen.getByText('🌌');
    expect(brandIcon).toHaveAttribute('aria-hidden', 'true');
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    const navLinks = screen.getByRole('navigation');
    expect(navLinks).toBeInTheDocument();
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeInTheDocument();
  });
});
