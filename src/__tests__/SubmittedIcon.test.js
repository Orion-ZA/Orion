import React from 'react';
import { render, screen } from '@testing-library/react';
import SubmittedIcon from '../components/SubmittedIcon';

describe('SubmittedIcon', () => {
  it('renders with default props', () => {
    render(<SubmittedIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('renders with custom size', () => {
    render(<SubmittedIcon size={32} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom color', () => {
    render(<SubmittedIcon color="#ff0000" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', '#ff0000');
  });

  it('renders with custom className', () => {
    render(<SubmittedIcon className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders filled version when filled prop is true', () => {
    render(<SubmittedIcon filled={true} color="#00ff00" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#00ff00');
    expect(svg).toHaveAttribute('stroke', '#00ff00');
  });

  it('renders unfilled version when filled prop is false', () => {
    render(<SubmittedIcon filled={false} color="#0000ff" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', '#0000ff');
  });

  it('renders the correct path for filled version', () => {
    render(<SubmittedIcon filled={true} />);
    const path = document.querySelector('svg').querySelector('path');
    expect(path).toHaveAttribute('d', 'M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12');
  });

  it('renders the correct path for unfilled version', () => {
    render(<SubmittedIcon filled={false} />);
    const path = document.querySelector('svg').querySelector('path');
    expect(path).toHaveAttribute('d', 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z');
  });
});
