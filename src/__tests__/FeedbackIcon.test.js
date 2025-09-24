import React from 'react';
import { render, screen } from '@testing-library/react';
import FeedbackIcon from '../components/FeedbackIcon';

describe('FeedbackIcon', () => {
  it('renders with default props', () => {
    render(<FeedbackIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('renders with custom size', () => {
    render(<FeedbackIcon size={32} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    render(<FeedbackIcon color="#ff0000" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', '#ff0000');
  });

  it('renders with custom className', () => {
    render(<FeedbackIcon className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders the correct chat bubble path', () => {
    render(<FeedbackIcon />);
    const path = document.querySelector('svg').querySelector('path');
    expect(path).toHaveAttribute('d', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z');
  });

  it('renders the correct lines for plus sign', () => {
    render(<FeedbackIcon />);
    const lines = document.querySelector('svg').querySelectorAll('line');
    expect(lines).toHaveLength(2);
    
    const horizontalLine = lines[0];
    const verticalLine = lines[1];
    
    expect(horizontalLine).toHaveAttribute('x1', '9');
    expect(horizontalLine).toHaveAttribute('y1', '10');
    expect(horizontalLine).toHaveAttribute('x2', '15');
    expect(horizontalLine).toHaveAttribute('y2', '10');
    
    expect(verticalLine).toHaveAttribute('x1', '12');
    expect(verticalLine).toHaveAttribute('y1', '7');
    expect(verticalLine).toHaveAttribute('x2', '12');
    expect(verticalLine).toHaveAttribute('y2', '13');
  });
});
