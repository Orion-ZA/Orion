import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GlassCard from '../components/cards/GlassCard';

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard>Test Content</GlassCard>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders default text if no children', () => {
    render(<GlassCard />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<GlassCard onClick={handleClick}>Click</GlassCard>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});