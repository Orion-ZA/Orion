import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminIcon from '../components/admin/AdminIcon';

describe('AdminIcon', () => {
  it('renders with default props', () => {
    render(<AdminIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '18');
    expect(svg).toHaveAttribute('height', '18');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '2');
    expect(svg).toHaveAttribute('stroke-linecap', 'round');
    expect(svg).toHaveAttribute('stroke-linejoin', 'round');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
  });

  it('renders with custom size', () => {
    render(<AdminIcon size={32} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders with custom className', () => {
    render(<AdminIcon className='custom-class' />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders with custom title', () => {
    render(<AdminIcon title='Custom Admin Title' />);
    const svg = document.querySelector('svg');
    const title = svg.querySelector('title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Custom Admin Title');
    expect(svg).toHaveAttribute('aria-hidden', 'false');
  });

  it('renders with default title when no title provided', () => {
    render(<AdminIcon />);
    const svg = document.querySelector('svg');
    const title = svg.querySelector('title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Admin');
    expect(svg).toHaveAttribute('aria-hidden', 'false');
  });

  it('sets aria-hidden to true when title is empty', () => {
    render(<AdminIcon title='' />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the correct crown paths', () => {
    render(<AdminIcon />);
    const svg = document.querySelector('svg');
    const paths = svg.querySelectorAll('path');

    // First path (crown main shape)
    expect(paths[0]).toHaveAttribute(
      'd',
      'M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z'
    );

    // Second path (crown base)
    expect(paths[1]).toHaveAttribute('d', 'M5 21h14');
  });

  it('renders with custom color prop', () => {
    render(<AdminIcon color='#ff0000' />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', '#ff0000');
  });

  it('renders all SVG elements in correct order', () => {
    render(<AdminIcon />);
    const svg = document.querySelector('svg');
    const children = Array.from(svg.children);

    // Should have title, path, path in that order
    expect(children[0].tagName).toBe('title');
    expect(children[1].tagName).toBe('path');
    expect(children[2].tagName).toBe('path');
  });

  it('handles multiple props correctly', () => {
    render(<AdminIcon size={24} className='admin-icon-class' title='Administrator Access' />);
    const svg = document.querySelector('svg');

    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveClass('admin-icon-class');
    expect(svg.querySelector('title')).toHaveTextContent('Administrator Access');
  });

  it('renders without crashing when all props are undefined', () => {
    render(<AdminIcon className={undefined} title={undefined} size={undefined} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '18'); // default size
    expect(svg).toHaveAttribute('height', '18'); // default size
    expect(svg.querySelector('title')).toHaveTextContent('Admin'); // default title
  });

  it('renders with zero size', () => {
    render(<AdminIcon size={0} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '0');
    expect(svg).toHaveAttribute('height', '0');
  });

  it('renders with negative size', () => {
    render(<AdminIcon size={-10} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '-10');
    expect(svg).toHaveAttribute('height', '-10');
  });

  it('renders with very large size', () => {
    render(<AdminIcon size={1000} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '1000');
    expect(svg).toHaveAttribute('height', '1000');
  });

  it('renders with empty string className', () => {
    render(<AdminIcon className='' />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('class', '');
  });

  it('renders with multiple class names', () => {
    render(<AdminIcon className='class1 class2 class3' />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('class1');
    expect(svg).toHaveClass('class2');
    expect(svg).toHaveClass('class3');
  });
});
