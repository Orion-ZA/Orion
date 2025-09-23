import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AuthLayout', () => {
  it('renders with default props', () => {
    renderWithRouter(<AuthLayout />);
    
    // Check if the main structure is rendered
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main
    
    // Check if logo link is present
    const logoLink = screen.getByRole('link');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
    
    // Check if logo image is present
    const logoImage = screen.getByAltText('Company Logo');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', 'orion_logo_clear.png');
    expect(logoImage).toHaveClass('auth-logo');
  });

  it('renders with title prop', () => {
    renderWithRouter(<AuthLayout title="Test Title" />);
    
    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Test Title');
  });

  it('renders children content', () => {
    renderWithRouter(
      <AuthLayout title="Login">
        <div data-testid="test-child">Test Child Content</div>
      </AuthLayout>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toHaveTextContent('Test Child Content');
  });

  it('renders with multiple children', () => {
    renderWithRouter(
      <AuthLayout title="Sign Up">
        <form data-testid="form">
          <input data-testid="input1" />
          <input data-testid="input2" />
        </form>
        <div data-testid="extra-content">Extra content</div>
      </AuthLayout>
    );
    
    expect(screen.getByTestId('form')).toBeInTheDocument();
    expect(screen.getByTestId('input1')).toBeInTheDocument();
    expect(screen.getByTestId('input2')).toBeInTheDocument();
    expect(screen.getByTestId('extra-content')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    renderWithRouter(<AuthLayout title="Test" />);
    
    const section = screen.getByRole('banner').parentElement;
    expect(section).toHaveClass('auth-page');
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('auth-header');
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('auth-container');
  });

  it('renders without title when not provided', () => {
    renderWithRouter(<AuthLayout />);
    
    // Should render h2 but with empty content when no title is provided
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('');
  });

  it('renders with empty title', () => {
    renderWithRouter(<AuthLayout title="" />);
    
    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('');
  });
});
