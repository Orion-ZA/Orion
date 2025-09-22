import React from 'react';
import { render, screen } from '@testing-library/react';
import GoogleIcon from '../components/GoogleIcon';

describe('GoogleIcon', () => {
  it('renders with default props', () => {
    render(<GoogleIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
  });

  it('renders with correct style', () => {
    render(<GoogleIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveStyle('margin-right: 8px');
  });

  it('renders all four Google brand color paths', () => {
    render(<GoogleIcon />);
    const paths = document.querySelector('svg').querySelectorAll('path');
    expect(paths).toHaveLength(4);
    
    // Check each path has the correct fill color
    expect(paths[0]).toHaveAttribute('fill', '#4285F4');
    expect(paths[1]).toHaveAttribute('fill', '#34A853');
    expect(paths[2]).toHaveAttribute('fill', '#FBBC05');
    expect(paths[3]).toHaveAttribute('fill', '#EA4335');
  });

  it('renders the correct path data for each color section', () => {
    render(<GoogleIcon />);
    const paths = document.querySelector('svg').querySelectorAll('path');
    
    // Blue section (top right)
    expect(paths[0]).toHaveAttribute('d', 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z');
    
    // Green section (bottom right)
    expect(paths[1]).toHaveAttribute('d', 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z');
    
    // Yellow section (bottom left)
    expect(paths[2]).toHaveAttribute('d', 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z');
    
    // Red section (top left)
    expect(paths[3]).toHaveAttribute('d', 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z');
  });
});
