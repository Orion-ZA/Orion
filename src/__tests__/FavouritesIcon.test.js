import React from 'react';
import { render, screen } from '@testing-library/react';
import FavouritesIcon from '../components/FavouritesIcon';

describe('FavouritesIcon', () => {
  it('renders with default props', () => {
    render(<FavouritesIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('renders with custom size', () => {
    render(<FavouritesIcon size={32} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    render(<FavouritesIcon color="#ff0000" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', '#ff0000');
  });

  it('renders with custom className', () => {
    render(<FavouritesIcon className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders filled version when filled prop is true', () => {
    render(<FavouritesIcon filled={true} color="#00ff00" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#00ff00');
    expect(svg).toHaveAttribute('stroke', '#00ff00');
  });

  it('renders unfilled version when filled prop is false', () => {
    render(<FavouritesIcon filled={false} color="#0000ff" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', '#0000ff');
  });

  it('renders the correct heart path', () => {
    render(<FavouritesIcon />);
    const path = document.querySelector('svg').querySelector('path');
    expect(path).toHaveAttribute('d', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z');
  });
});
