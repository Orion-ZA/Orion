import React from 'react';
import { render, screen } from '@testing-library/react';
import HelpCenterIcon from '../components/HelpCenterIcon';

describe('HelpCenterIcon', () => {
  it('renders with default props', () => {
    render(<HelpCenterIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('renders with custom size', () => {
    render(<HelpCenterIcon size={32} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    render(<HelpCenterIcon color="#ff0000" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', '#ff0000');
  });

  it('renders with custom className', () => {
    render(<HelpCenterIcon className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders with custom circle color', () => {
    render(<HelpCenterIcon withCircle={true} circleColor="#00ff00" />);
    const circle = document.querySelector('svg').querySelector('circle');
    expect(circle).toHaveAttribute('fill', '#00ff00');
  });

  it('renders with default circle color when withCircle is true', () => {
    render(<HelpCenterIcon withCircle={true} />);
    const circle = document.querySelector('svg').querySelector('circle');
    expect(circle).toHaveAttribute('fill', 'rgba(91, 192, 190, 0.2)');
  });

  it('does not render background circle when withCircle is false', () => {
    render(<HelpCenterIcon withCircle={false} />);
    const svg = document.querySelector('svg');
    const circles = svg.querySelectorAll('circle');
    // Should have the main circle (r="10") but not the background circle (r="11")
    expect(circles).toHaveLength(1);
    expect(circles[0]).toHaveAttribute('r', '10');
  });

  it('renders filled version when filled prop is true', () => {
    render(<HelpCenterIcon filled={true} color="#00ff00" />);
    const svg = document.querySelector('svg');
    const paths = svg.querySelectorAll('path');
    const lines = svg.querySelectorAll('line');
    
    // First path should be filled circle
    expect(paths[0]).toHaveAttribute('fill', '#00ff00');
    expect(paths[0]).toHaveAttribute('d', 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z');
    
    // Second path should be question mark with white stroke
    expect(paths[1]).toHaveAttribute('stroke', '#fff');
    expect(paths[1]).toHaveAttribute('stroke-width', '1.5');
    
    // Line should be white
    expect(lines[0]).toHaveAttribute('stroke', '#fff');
    expect(lines[0]).toHaveAttribute('stroke-width', '2');
  });

  it('renders unfilled version when filled prop is false', () => {
    render(<HelpCenterIcon filled={false} />);
    const svg = document.querySelector('svg');
    const circle = svg.querySelector('circle');
    const path = svg.querySelector('path');
    const line = svg.querySelector('line');
    
    // Circle should be stroke only
    expect(circle).toHaveAttribute('cx', '12');
    expect(circle).toHaveAttribute('cy', '12');
    expect(circle).toHaveAttribute('r', '10');
    
    // Path should be question mark
    expect(path).toHaveAttribute('d', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3');
    
    // Line should be dot
    expect(line).toHaveAttribute('x1', '12');
    expect(line).toHaveAttribute('y1', '17');
    expect(line).toHaveAttribute('x2', '12.01');
    expect(line).toHaveAttribute('y2', '17');
  });
});
