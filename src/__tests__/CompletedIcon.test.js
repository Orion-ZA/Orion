import React from 'react';
import { render, screen } from '@testing-library/react';
import CompletedIcon from '../components/CompletedIcon';

describe('CompletedIcon', () => {
  it('renders with default props', () => {
    render(<CompletedIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('renders with custom size', () => {
    render(<CompletedIcon size={32} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    render(<CompletedIcon color="#ff0000" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', '#ff0000');
  });

  it('renders with custom className', () => {
    render(<CompletedIcon className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders filled version when filled prop is true', () => {
    render(<CompletedIcon filled={true} color="#00ff00" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#00ff00');
    expect(svg).toHaveAttribute('stroke', '#00ff00');
  });

  it('renders unfilled version when filled prop is false', () => {
    render(<CompletedIcon filled={false} color="#0000ff" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', '#0000ff');
  });

  it('renders the correct path for filled version', () => {
    render(<CompletedIcon filled={true} />);
    const path = document.querySelector('svg path');
    expect(path).toHaveAttribute('d', 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
  });

  it('renders the correct path for unfilled version', () => {
    render(<CompletedIcon filled={false} />);
    const path = document.querySelector('svg path');
    expect(path).toHaveAttribute('d', 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
  });
});
