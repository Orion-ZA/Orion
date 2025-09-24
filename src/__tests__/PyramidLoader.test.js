import React from 'react';
import { render, screen } from '@testing-library/react';
import PyramidLoader from '../components/PyramidLoader';

describe('PyramidLoader', () => {
  it('renders with correct structure', () => {
    render(<PyramidLoader />);
    
    const pyramidLoader = document.querySelector('.pyramid-loader');
    expect(pyramidLoader).toBeInTheDocument();
    expect(pyramidLoader).toHaveClass('pyramid-loader');
  });

  it('renders wrapper element', () => {
    render(<PyramidLoader />);
    
    const wrapper = document.querySelector('.wrapper');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders all four side elements', () => {
    render(<PyramidLoader />);
    
    const sides = document.querySelectorAll('.side');
    expect(sides).toHaveLength(4);
    
    sides.forEach((side, index) => {
      expect(side).toHaveClass('side');
      expect(side).toHaveClass(`side${index + 1}`);
    });
  });

  it('renders shadow element', () => {
    render(<PyramidLoader />);
    
    const shadow = document.querySelector('.shadow');
    expect(shadow).toBeInTheDocument();
  });

  it('applies correct CSS classes to all elements', () => {
    render(<PyramidLoader />);
    
    const pyramidLoader = document.querySelector('.pyramid-loader');
    expect(pyramidLoader).toHaveClass('pyramid-loader');
    
    const wrapper = document.querySelector('.wrapper');
    expect(wrapper).toHaveClass('wrapper');
    
    const sides = document.querySelectorAll('.side');
    expect(sides[0]).toHaveClass('side1');
    expect(sides[1]).toHaveClass('side2');
    expect(sides[2]).toHaveClass('side3');
    expect(sides[3]).toHaveClass('side4');
    
    const shadow = document.querySelector('.shadow');
    expect(shadow).toHaveClass('shadow');
  });

  it('renders all elements in correct hierarchy', () => {
    render(<PyramidLoader />);
    
    const pyramidLoader = document.querySelector('.pyramid-loader');
    const wrapper = pyramidLoader.querySelector('.wrapper');
    
    expect(wrapper).toBeInTheDocument();
    
    const sides = wrapper.querySelectorAll('.side');
    expect(sides).toHaveLength(4);
    
    const shadow = wrapper.querySelector('.shadow');
    expect(shadow).toBeInTheDocument();
  });
});
