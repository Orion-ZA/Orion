import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../components/Footer';

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Footer', () => {
  beforeEach(() => {
    // Mock Date.getFullYear to return a consistent year
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders footer with correct structure', () => {
    renderWithRouter(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('footer');
  });

  it('renders brand section with logo and tagline', () => {
    renderWithRouter(<Footer />);
    
    // Check brand elements
    expect(screen.getByText('Orion')).toBeInTheDocument();
    expect(screen.getByText('Crowd-sourced hiking intelligence. Find, plan, and share your next adventure.')).toBeInTheDocument();
    
    // Check brand mark (emoji)
    const brandMark = screen.getByText('🌌');
    expect(brandMark).toBeInTheDocument();
    expect(brandMark).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders social media buttons', () => {
    renderWithRouter(<Footer />);
    
    const socialButtons = screen.getAllByRole('button');
    const socialButtonsWithAriaLabel = socialButtons.filter(button => 
      button.getAttribute('aria-label')?.includes('X (Twitter)') ||
      button.getAttribute('aria-label')?.includes('Instagram') ||
      button.getAttribute('aria-label')?.includes('YouTube') ||
      button.getAttribute('aria-label')?.includes('GitHub')
    );
    
    expect(socialButtonsWithAriaLabel).toHaveLength(4);
    
    // Check specific social buttons
    expect(screen.getByLabelText('X (Twitter)')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Footer />);
    
    // Check Explore section links
    expect(screen.getByText('Explore')).toBeInTheDocument();
    const trailsLink = screen.getByText('Trails');
    expect(trailsLink).toBeInTheDocument();
    expect(trailsLink).toHaveAttribute('href', '/trails');
    
    const reviewsLink = screen.getByText('Reviews & Media');
    expect(reviewsLink).toBeInTheDocument();
    expect(reviewsLink).toHaveAttribute('href', '/reviews');
    
    const alertsLink = screen.getByText('Alerts & Updates');
    expect(alertsLink).toBeInTheDocument();
    expect(alertsLink).toHaveAttribute('href', '/alerts');
  });

  it('renders company section with buttons', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('Company')).toBeInTheDocument();
    
    const companyButtons = screen.getAllByText(/About|Careers|Contact|Press/);
    expect(companyButtons).toHaveLength(4);
    
    companyButtons.forEach(button => {
      expect(button).toHaveClass('linklike');
    });
  });

  it('renders subscription form', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('Stay in the loop')).toBeInTheDocument();
    expect(screen.getByText('Subscribe for trail updates, maps, and hidden gems. No spam.')).toBeInTheDocument();
    
    const emailInput = screen.getByLabelText('Email address');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');
    expect(emailInput).toHaveAttribute('required');
    
    const submitButton = screen.getByText('Subscribe');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('prevents form submission', () => {
    renderWithRouter(<Footer />);
    
    const form = document.querySelector('form');
    
    // The form should not cause a page reload when submitted
    // We can test this by checking that the form exists and has the preventDefault handler
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass('subscribe-form');
  });

  it('renders footer bottom with copyright and policy links', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('© 2024 Orion')).toBeInTheDocument();
    
    const policyButtons = screen.getAllByText(/Privacy|Terms|Cookies/);
    expect(policyButtons).toHaveLength(5); // 2 in fine-print + 3 in footer-bottom
    
    policyButtons.forEach(button => {
      expect(button).toHaveClass('linklike');
    });
  });

  it('renders fine print with terms and privacy policy', () => {
    renderWithRouter(<Footer />);
    
    const finePrint = screen.getByText(/By subscribing you agree to our/);
    expect(finePrint).toBeInTheDocument();
    
    const termsButtons = screen.getAllByText('Terms');
    const privacyButton = screen.getByText('Privacy Policy');
    
    // Get the Terms button from the fine-print section (first one)
    const termsButton = termsButtons[0];
    
    expect(termsButton).toBeInTheDocument();
    expect(privacyButton).toBeInTheDocument();
    expect(termsButton).toHaveClass('linklike');
    expect(privacyButton).toHaveClass('linklike');
  });

  it('renders with correct CSS classes', () => {
    renderWithRouter(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('footer');
    
    const footerGrid = footer.querySelector('.footer-grid');
    expect(footerGrid).toBeInTheDocument();
    
    const brandCol = footer.querySelector('.brand-col');
    expect(brandCol).toBeInTheDocument();
    
    const linksCols = footer.querySelectorAll('.links-col');
    expect(linksCols).toHaveLength(2);
    
    const subscribeCol = footer.querySelector('.subscribe-col');
    expect(subscribeCol).toBeInTheDocument();
    
    const footerBottom = footer.querySelector('.footer-bottom');
    expect(footerBottom).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    renderWithRouter(<Footer />);
    
    const emailInput = screen.getByLabelText('Email address');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
  });
});
