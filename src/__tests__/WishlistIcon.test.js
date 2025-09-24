import React from 'react';
import { render, screen } from '@testing-library/react';
import WishlistIcon from '../components/WishlistIcon';

describe('WishlistIcon', () => {
  it('renders with default props', () => {
    render(<WishlistIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('renders with custom size', () => {
    render(<WishlistIcon size={32} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    render(<WishlistIcon color="#ff0000" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', '#ff0000');
  });

  it('renders with custom className', () => {
    render(<WishlistIcon className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders filled version when filled prop is true', () => {
    render(<WishlistIcon filled={true} color="#00ff00" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#00ff00');
    expect(svg).toHaveAttribute('stroke', '#00ff00');
  });

  it('renders unfilled version when filled prop is false', () => {
    render(<WishlistIcon filled={false} color="#0000ff" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', '#0000ff');
  });

  it('renders the correct path for filled version', () => {
    render(<WishlistIcon filled={true} />);
    const path = document.querySelector('svg').querySelector('path');
    expect(path).toHaveAttribute('d', 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z');
  });

  it('renders the correct path for unfilled version', () => {
    render(<WishlistIcon filled={false} />);
    const path = document.querySelector('svg').querySelector('path');
    expect(path).toHaveAttribute('d', 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z');
  });
});
