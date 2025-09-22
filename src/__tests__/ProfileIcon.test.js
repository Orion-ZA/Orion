import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileIcon from '../components/ProfileIcon';

describe('ProfileIcon', () => {
  it('renders with default props', () => {
    render(<ProfileIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('renders with custom size', () => {
    render(<ProfileIcon size={32} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    render(<ProfileIcon color="#ff0000" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', '#ff0000');
  });

  it('renders with custom className', () => {
    render(<ProfileIcon className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders filled version when filled prop is true', () => {
    render(<ProfileIcon filled={true} color="#00ff00" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#00ff00');
    expect(svg).toHaveAttribute('stroke', '#00ff00');
  });

  it('renders unfilled version when filled prop is false', () => {
    render(<ProfileIcon filled={false} color="#0000ff" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', '#0000ff');
  });

  it('renders the correct profile paths', () => {
    render(<ProfileIcon />);
    const svg = document.querySelector('svg');
    const paths = svg.querySelectorAll('path');
    const circle = svg.querySelector('circle');
    
    // Should have one path for body and one circle for head
    expect(paths).toHaveLength(1);
    expect(circle).toBeInTheDocument();
    
    // Body path
    expect(paths[0]).toHaveAttribute('d', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2');
    
    // Head circle
    expect(circle).toHaveAttribute('cx', '12');
    expect(circle).toHaveAttribute('cy', '7');
    expect(circle).toHaveAttribute('r', '4');
  });
});
