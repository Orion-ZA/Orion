import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingFooter from '../components/landing/LandingFooter';

describe('LandingFooter', () => {
  it('renders footer with correct structure', () => {
    render(<LandingFooter />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('landing-footer');
  });

  it('applies correct inline styles', () => {
    render(<LandingFooter />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveStyle({
      background: '#0b1a2e',
      color: '#fff'
    });
  });

  it('renders footer inner container with correct styles', () => {
    render(<LandingFooter />);
    
    const footerInner = document.querySelector('.footer-inner');
    expect(footerInner).toBeInTheDocument();
    expect(footerInner).toHaveStyle({
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '28px 20px',
      display: 'grid',
      gap: '16px',
      gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))'
    });
  });

  it('renders Explore section', () => {
    render(<LandingFooter />);
    
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Trail Moments')).toBeInTheDocument();
    expect(screen.getByText('Local favorites')).toBeInTheDocument();
    expect(screen.getByText('Browse by activity')).toBeInTheDocument();
  });

  it('renders Maps section', () => {
    render(<LandingFooter />);
    
    expect(screen.getByText('Maps')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  it('renders Company section', () => {
    render(<LandingFooter />);
    
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  it('renders Community section', () => {
    render(<LandingFooter />);
    
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Gift membership')).toBeInTheDocument();
  });

  it('renders copyright section', () => {
    render(<LandingFooter />);
    
    expect(screen.getByText('© 2025 Orion • Find Your Outside')).toBeInTheDocument();
  });

  it('applies correct styles to section headings', () => {
    render(<LandingFooter />);
    
    const headings = screen.getAllByRole('heading', { level: 3 });
    headings.forEach(heading => {
      expect(heading).toHaveStyle({
        fontSize: '1.05rem',
        marginBottom: '12px'
      });
    });
  });

  it('applies correct styles to links', () => {
    render(<LandingFooter />);
    
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      expect(link).toHaveStyle({
        display: 'block',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: '8px'
      });
    });
  });

  it('applies correct styles to copyright section', () => {
    render(<LandingFooter />);
    
    // Find the copyright div by looking for the div that contains the copyright text
    const copyrightDiv = document.querySelector('footer > div:last-child');
    
    // Check that the element has inline styles applied
    expect(copyrightDiv).toHaveAttribute('style');
    const style = copyrightDiv.getAttribute('style');
    // The styles are applied to the div containing the copyright text
    expect(style).toContain('text-align: center');
    expect(style).toContain('padding: 12px 20px');
    expect(style).toContain('color: rgba(255, 255, 255, 0.75)');
  });

  it('renders all navigation links with correct href attributes', () => {
    render(<LandingFooter />);
    
    const exploreLinks = [
      { text: 'Trail Moments', href: '#explore' },
      { text: 'Local favorites', href: '#submit' },
      { text: 'Browse by activity', href: '#community' }
    ];
    
    const mapsLinks = [
      { text: 'Search', href: '#home' },
      { text: 'Stats', href: '#reviews' }
    ];
    
    const companyLinks = [
      { text: 'About', href: '/' },
      { text: 'Jobs', href: '/' }
    ];
    
    const communityLinks = [
      { text: 'Support', href: '/' },
      { text: 'Gift membership', href: '/' }
    ];
    
    [...exploreLinks, ...mapsLinks, ...companyLinks, ...communityLinks].forEach(({ text, href }) => {
      const link = screen.getByText(text);
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('renders with correct number of sections', () => {
    render(<LandingFooter />);
    
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(4);
    
    const sections = ['Explore', 'Maps', 'Company', 'Community'];
    sections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it('renders with correct number of links per section', () => {
    render(<LandingFooter />);
    
    // Explore section should have 3 links
    const exploreSection = screen.getByText('Explore').parentElement;
    const exploreLinks = exploreSection.querySelectorAll('a');
    expect(exploreLinks).toHaveLength(3);
    
    // Maps section should have 2 links
    const mapsSection = screen.getByText('Maps').parentElement;
    const mapsLinks = mapsSection.querySelectorAll('a');
    expect(mapsLinks).toHaveLength(2);
    
    // Company section should have 2 links
    const companySection = screen.getByText('Company').parentElement;
    const companyLinks = companySection.querySelectorAll('a');
    expect(companyLinks).toHaveLength(2);
    
    // Community section should have 2 links
    const communitySection = screen.getByText('Community').parentElement;
    const communityLinks = communitySection.querySelectorAll('a');
    expect(communityLinks).toHaveLength(2);
  });
});
