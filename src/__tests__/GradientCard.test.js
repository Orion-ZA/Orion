import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock styled-components completely
jest.mock('styled-components', () => ({
  __esModule: true,
  default: {
    div: jest.fn(() => {
      const React = require('react');
      return React.forwardRef(({ children, ...props }, ref) => {
        return React.createElement('div', { 
          ref,
          'data-testid': 'styled-wrapper', 
          'data-accent': props.$accent,
          className: 'styled-wrapper'
        }, children);
      });
    })
  },
}));

// Import after mocking
import GradientCard from '../components/cards/GradientCard';

describe('GradientCard', () => {
  it('renders with default props', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
      />
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders with teal accent by default', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
      />
    );
    
    const styledWrapper = screen.getByTestId('styled-wrapper');
    expect(styledWrapper).toHaveAttribute('data-accent', 'teal');
  });

  it('renders with yellow accent when specified', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        accent="yellow"
      />
    );
    
    const styledWrapper = screen.getByTestId('styled-wrapper');
    expect(styledWrapper).toHaveAttribute('data-accent', 'yellow');
  });

  it('renders with custom icon when provided', () => {
    const customIcon = <div data-testid="custom-icon">Custom Icon</div>;
    
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        icon={customIcon}
      />
    );
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByText('Custom Icon')).toBeInTheDocument();
  });

  it('renders default icon when no icon provided', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
      />
    );
    
    // Should render the default SVG icon
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 120 120');
    expect(svg).toHaveAttribute('height', '72');
    expect(svg).toHaveAttribute('width', '72');
  });

  it('renders with correct structure', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
      />
    );
    
    const card = document.querySelector('.card');
    expect(card).toBeInTheDocument();
    
    const containerCard = document.querySelector('.container-card');
    expect(containerCard).toBeInTheDocument();
    expect(containerCard).toHaveClass('bg-gradient-box');
    
    const iconWrap = document.querySelector('.icon-wrap');
    expect(iconWrap).toBeInTheDocument();
  });

  it('renders title with correct class', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
      />
    );
    
    const title = screen.getByText('Test Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('card-title');
  });

  it('renders description with correct class', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
      />
    );
    
    const description = screen.getByText('Test Description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('card-description');
  });

  it('renders with long title and description', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines';
    const longDescription = 'This is a very long description that contains multiple sentences and should display properly in the card layout without breaking the design.';
    
    render(
      <GradientCard 
        title={longTitle} 
        description={longDescription} 
      />
    );
    
    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('renders with empty title and description', () => {
    render(
      <GradientCard 
        title="" 
        description="" 
      />
    );
    
    const titleElement = document.querySelector('.card-title');
    const descriptionElement = document.querySelector('.card-description');
    
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
    expect(titleElement.textContent).toBe('');
    expect(descriptionElement.textContent).toBe('');
  });

  it('renders with special characters in title and description', () => {
    const specialTitle = 'Test Title with Special Characters: @#$%^&*()';
    const specialDescription = 'Description with émojis 🚀 and spëcial chàracters!';
    
    render(
      <GradientCard 
        title={specialTitle} 
        description={specialDescription} 
      />
    );
    
    expect(screen.getByText(specialTitle)).toBeInTheDocument();
    expect(screen.getByText(specialDescription)).toBeInTheDocument();
  });

  it('renders with React element as icon', () => {
    const reactIcon = (
      <div data-testid="react-icon">
        <span>React Icon</span>
      </div>
    );
    
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        icon={reactIcon}
      />
    );
    
    expect(screen.getByTestId('react-icon')).toBeInTheDocument();
    expect(screen.getByText('React Icon')).toBeInTheDocument();
  });

  it('renders with null icon', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        icon={null}
      />
    );
    
    // Should render default icon when icon is null
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with undefined icon', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        icon={undefined}
      />
    );
    
    // Should render default icon when icon is undefined
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles accent prop case sensitivity', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        accent="YELLOW"
      />
    );
    
    const styledWrapper = screen.getByTestId('styled-wrapper');
    expect(styledWrapper).toHaveAttribute('data-accent', 'YELLOW');
  });

  it('renders with invalid accent prop', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        accent="invalid"
      />
    );
    
    const styledWrapper = screen.getByTestId('styled-wrapper');
    expect(styledWrapper).toHaveAttribute('data-accent', 'invalid');
  });

  // Edge Cases and Error Scenarios
  it('handles undefined props gracefully', () => {
    render(<GradientCard />);
    
    const titleElement = document.querySelector('.card-title');
    const descriptionElement = document.querySelector('.card-description');
    
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
    expect(titleElement.textContent).toBe('');
    expect(descriptionElement.textContent).toBe('');
  });

  it('handles null title and description', () => {
    render(
      <GradientCard 
        title={null} 
        description={null} 
      />
    );
    
    const titleElement = document.querySelector('.card-title');
    const descriptionElement = document.querySelector('.card-description');
    
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
    expect(titleElement.textContent).toBe('');
    expect(descriptionElement.textContent).toBe('');
  });

  it('handles whitespace-only title and description', () => {
    render(
      <GradientCard 
        title="   " 
        description="\n\t  " 
      />
    );
    
    const titleElement = document.querySelector('.card-title');
    const descriptionElement = document.querySelector('.card-description');
    
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
    expect(titleElement.textContent).toBe('   ');
    expect(descriptionElement.textContent).toMatch(/\s+/);
  });

  it('handles very long strings without breaking layout', () => {
    const veryLongTitle = 'A'.repeat(1000);
    const veryLongDescription = 'B'.repeat(2000);
    
    render(
      <GradientCard 
        title={veryLongTitle} 
        description={veryLongDescription} 
      />
    );
    
    expect(screen.getByText(veryLongTitle)).toBeInTheDocument();
    expect(screen.getByText(veryLongDescription)).toBeInTheDocument();
  });

  // Accessibility Tests
  it('has proper semantic structure for screen readers', () => {
    render(
      <GradientCard 
        title="Accessible Title" 
        description="Accessible Description" 
      />
    );
    
    const titleElement = document.querySelector('.card-title');
    const descriptionElement = document.querySelector('.card-description');
    
    expect(titleElement.tagName).toBe('P');
    expect(descriptionElement.tagName).toBe('P');
  });

  it('renders SVG icon with proper accessibility attributes', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
      />
    );
    
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 120 120');
    expect(svg).toHaveAttribute('fill', 'none');
  });

  // Icon Variants Testing
  it('renders with string icon (should be treated as text)', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        icon="String Icon"
      />
    );
    
    expect(screen.getByText('String Icon')).toBeInTheDocument();
  });

  it('renders with number icon (should be converted to string)', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        icon={123}
      />
    );
    
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  // Accent Color Edge Cases
  it('handles accent prop with different data types', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        accent={123}
      />
    );
    
    const styledWrapper = screen.getByTestId('styled-wrapper');
    expect(styledWrapper).toHaveAttribute('data-accent', '123');
  });

  it('handles accent prop with boolean values', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
        accent={true}
      />
    );
    
    const styledWrapper = screen.getByTestId('styled-wrapper');
    expect(styledWrapper).toHaveAttribute('data-accent', 'true');
  });

  // Component Structure Validation
  it('maintains correct DOM hierarchy', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
      />
    );
    
    const styledWrapper = document.querySelector('[data-testid="styled-wrapper"]');
    const card = styledWrapper.querySelector('.card');
    const containerCard = card.querySelector('.container-card');
    const iconWrap = containerCard.querySelector('.icon-wrap');
    const title = containerCard.querySelector('.card-title');
    const description = containerCard.querySelector('.card-description');
    
    expect(styledWrapper).toContainElement(card);
    expect(card).toContainElement(containerCard);
    expect(containerCard).toContainElement(iconWrap);
    expect(containerCard).toContainElement(title);
    expect(containerCard).toContainElement(description);
  });

  it('applies correct CSS classes to all elements', () => {
    render(
      <GradientCard 
        title="Test Title" 
        description="Test Description" 
      />
    );
    
    expect(document.querySelector('.styled-wrapper')).toBeInTheDocument();
    expect(document.querySelector('.card')).toBeInTheDocument();
    expect(document.querySelector('.container-card')).toBeInTheDocument();
    expect(document.querySelector('.bg-gradient-box')).toBeInTheDocument();
    expect(document.querySelector('.icon-wrap')).toBeInTheDocument();
    expect(document.querySelector('.card-title')).toBeInTheDocument();
    expect(document.querySelector('.card-description')).toBeInTheDocument();
  });

  // Performance and Rendering Tests
  it('renders consistently with same props', () => {
    const props = {
      title: "Test Title",
      description: "Test Description",
      accent: "teal"
    };
    
    const { rerender } = render(<GradientCard {...props} />);
    const firstRender = document.querySelector('.card').innerHTML;
    
    rerender(<GradientCard {...props} />);
    const secondRender = document.querySelector('.card').innerHTML;
    
    expect(firstRender).toBe(secondRender);
  });

  it('updates correctly when props change', () => {
    const { rerender } = render(
      <GradientCard 
        title="Original Title" 
        description="Original Description" 
        accent="teal"
      />
    );
    
    expect(screen.getByText('Original Title')).toBeInTheDocument();
    
    rerender(
      <GradientCard 
        title="Updated Title" 
        description="Updated Description" 
        accent="yellow"
      />
    );
    
    expect(screen.getByText('Updated Title')).toBeInTheDocument();
    expect(screen.getByText('Updated Description')).toBeInTheDocument();
    expect(screen.getByTestId('styled-wrapper')).toHaveAttribute('data-accent', 'yellow');
  });

  // Unicode and Internationalization Tests
  it('handles unicode characters correctly', () => {
    const unicodeTitle = '测试标题 🚀';
    const unicodeDescription = '测试描述 with émojis and 中文';
    
    render(
      <GradientCard 
        title={unicodeTitle} 
        description={unicodeDescription} 
      />
    );
    
    expect(screen.getByText(unicodeTitle)).toBeInTheDocument();
    expect(screen.getByText(unicodeDescription)).toBeInTheDocument();
  });

  it('handles RTL text correctly', () => {
    const rtlTitle = 'כותרת בעברית';
    const rtlDescription = 'תיאור בעברית';
    
    render(
      <GradientCard 
        title={rtlTitle} 
        description={rtlDescription} 
      />
    );
    
    expect(screen.getByText(rtlTitle)).toBeInTheDocument();
    expect(screen.getByText(rtlDescription)).toBeInTheDocument();
  });

  // Error Boundary and Resilience Tests
  it('does not crash with malformed props', () => {
    expect(() => {
      render(
        <GradientCard 
          title={undefined} 
          description={undefined} 
          accent={undefined}
          icon={undefined}
        />
      );
    }).not.toThrow();
  });
});