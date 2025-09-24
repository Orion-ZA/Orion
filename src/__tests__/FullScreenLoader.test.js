import React from 'react';
import { render, screen } from '@testing-library/react';
import FullScreenLoader from '../components/FullScreenLoader';

// Mock PyramidLoader component
jest.mock('../components/PyramidLoader', () => {
  return function MockPyramidLoader() {
    return <div data-testid="pyramid-loader">Pyramid Loader</div>;
  };
});

describe('FullScreenLoader', () => {
  it('renders with correct structure', () => {
    render(<FullScreenLoader />);
    
    const overlay = screen.getByTestId('pyramid-loader').parentElement.parentElement;
    expect(overlay).toHaveClass('fullscreen-loader-overlay');
    
    const loaderStack = overlay.querySelector('.loader-stack');
    expect(loaderStack).toBeInTheDocument();
  });

  it('renders PyramidLoader component', () => {
    render(<FullScreenLoader />);
    
    const pyramidLoader = screen.getByTestId('pyramid-loader');
    expect(pyramidLoader).toBeInTheDocument();
    expect(pyramidLoader).toHaveTextContent('Pyramid Loader');
  });

  it('renders Orion title', () => {
    render(<FullScreenLoader />);
    
    const title = screen.getByText('Orion');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('loader-title');
  });

  it('applies correct CSS classes', () => {
    render(<FullScreenLoader />);
    
    const overlay = screen.getByTestId('pyramid-loader').parentElement.parentElement;
    expect(overlay).toHaveClass('fullscreen-loader-overlay');
    
    const loaderStack = overlay.querySelector('.loader-stack');
    expect(loaderStack).toBeInTheDocument();
    
    const title = screen.getByText('Orion');
    expect(title).toHaveClass('loader-title');
  });

  it('renders in correct order', () => {
    render(<FullScreenLoader />);
    
    const loaderStack = screen.getByTestId('pyramid-loader').parentElement;
    const children = Array.from(loaderStack.children);
    
    // First child should be PyramidLoader
    expect(children[0]).toHaveAttribute('data-testid', 'pyramid-loader');
    
    // Second child should be title
    expect(children[1]).toHaveTextContent('Orion');
    expect(children[1]).toHaveClass('loader-title');
  });
});
