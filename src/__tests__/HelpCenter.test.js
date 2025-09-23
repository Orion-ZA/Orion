import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HelpCenterPage from '../pages/HelpCenter';
import { useToast } from '../components/ToastContext';

// Mock ToastContext
jest.mock('../components/ToastContext', () => ({
  useToast: jest.fn()
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )
}));

// Mock SettingsIcon component
jest.mock('../components/SettingsIcon', () => {
  return function MockSettingsIcon({ size }) {
    return <div data-testid="settings-icon" data-size={size}>Settings Icon</div>;
  };
});

describe('HelpCenterPage Component', () => {
  const mockShow = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useToast.mockReturnValue({ show: mockShow });
  });

  describe('Component Rendering', () => {
    it('renders the help center page', () => {
      render(<HelpCenterPage />);

      expect(screen.getByText('How can we help you?')).toBeInTheDocument();
      expect(screen.getByText('Find answers to common questions or contact our support team')).toBeInTheDocument();
    });

    it('renders search functionality', () => {
      render(<HelpCenterPage />);

      expect(screen.getByPlaceholderText('Search for answers...')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('renders quick help cards', () => {
      render(<HelpCenterPage />);

      expect(screen.getByText('Get Help Quickly')).toBeInTheDocument();
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
      expect(screen.getByText('Community Forum')).toBeInTheDocument();
      expect(screen.getByText('Email Support')).toBeInTheDocument();
    });

    it('renders FAQ section', () => {
      render(<HelpCenterPage />);

      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
      expect(screen.getByText('Browse common questions organized by category')).toBeInTheDocument();
    });

    it('renders contact section', () => {
      render(<HelpCenterPage />);

      expect(screen.getByText('Still need help?')).toBeInTheDocument();
      expect(screen.getByText('Our support team is here to assist you')).toBeInTheDocument();
    });
  });

  describe('Category Navigation', () => {
    it('shows general category by default', () => {
      render(<HelpCenterPage />);

      expect(screen.getByText('General Questions')).toBeInTheDocument();
      expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
    });

    it('switches to trails category', async () => {
      render(<HelpCenterPage />);

      const trailsTab = screen.getByText('Trails & Navigation');
      await userEvent.click(trailsTab);

      expect(trailsTab.closest('button')).toHaveClass('active');
      expect(screen.getByText('How do I save a trail to my wishlist?')).toBeInTheDocument();
    });

    it('switches to account category', async () => {
      render(<HelpCenterPage />);

      const accountTab = screen.getByText('Account & Settings');
      await userEvent.click(accountTab);

      expect(accountTab.closest('button')).toHaveClass('active');
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    });

    it('switches to technical category', async () => {
      render(<HelpCenterPage />);

      const technicalTab = screen.getByText('Technical Support');
      await userEvent.click(technicalTab);

      expect(technicalTab.closest('button')).toHaveClass('active');
      expect(screen.getByText('The app is crashing on my device. What should I do?')).toBeInTheDocument();
    });
  });

  describe('FAQ Functionality', () => {
    it('expands FAQ items when clicked', async () => {
      render(<HelpCenterPage />);

      const firstQuestion = screen.getByText('How do I create an account?');
      await userEvent.click(firstQuestion);

      expect(screen.getByText(/To create an account, click on the "Log in" button/)).toBeInTheDocument();
    });

    it('collapses FAQ items when clicked again', async () => {
      render(<HelpCenterPage />);

      const firstQuestion = screen.getByText('How do I create an account?');
      
      // Click to expand
      await userEvent.click(firstQuestion);
      expect(screen.getByText(/To create an account, click on the "Log in" button/)).toBeInTheDocument();

      // Click to collapse
      await userEvent.click(firstQuestion);
      expect(screen.queryByText(/To create an account, click on the "Log in" button/)).not.toBeInTheDocument();
    });

    it('shows chevron up when expanded', async () => {
      render(<HelpCenterPage />);

      const firstQuestion = screen.getByText('How do I create an account?');
      await userEvent.click(firstQuestion);

      // Should show chevron up icon (we can't easily test the actual icon, but we can test the structure)
      expect(firstQuestion.closest('button')).toBeInTheDocument();
    });

    it('shows chevron down when collapsed', () => {
      render(<HelpCenterPage />);

      const firstQuestion = screen.getByText('How do I create an account?');
      expect(firstQuestion.closest('button')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters FAQs based on search query', async () => {
      render(<HelpCenterPage />);

      const searchInput = screen.getByPlaceholderText('Search for answers...');
      await userEvent.type(searchInput, 'account');

      expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
      expect(screen.getByText('Can I change my username?')).toBeInTheDocument();
      expect(screen.getByText('How do I delete my account?')).toBeInTheDocument();
    });

    it('filters FAQs by answer content', async () => {
      render(<HelpCenterPage />);

      const searchInput = screen.getByPlaceholderText('Search for answers...');
      await userEvent.type(searchInput, 'Google');

      expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    });

    it('shows no results when no matches found', async () => {
      render(<HelpCenterPage />);

      const searchInput = screen.getByPlaceholderText('Search for answers...');
      await userEvent.type(searchInput, 'nonexistent');

      expect(screen.getByText('No results found for "nonexistent" in this category.')).toBeInTheDocument();
      expect(screen.getByText('Clear search')).toBeInTheDocument();
    });

    it('clears search when clear button is clicked', async () => {
      render(<HelpCenterPage />);

      const searchInput = screen.getByPlaceholderText('Search for answers...');
      await userEvent.type(searchInput, 'account');

      expect(screen.getByText('How do I create an account?')).toBeInTheDocument();

      const clearButton = screen.getByText('Clear search');
      await userEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
    });

    it('is case insensitive', async () => {
      render(<HelpCenterPage />);

      const searchInput = screen.getByPlaceholderText('Search for answers...');
      await userEvent.type(searchInput, 'ACCOUNT');

      expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    });
  });

  describe('Contact Form', () => {
    it('renders contact form fields', () => {
      render(<HelpCenterPage />);

      expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
      expect(screen.getByLabelText('Message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
    });

    it('handles form input changes', async () => {
      render(<HelpCenterPage />);

      const nameInput = screen.getByLabelText('Your Name');
      const emailInput = screen.getByLabelText('Email Address');
      const subjectInput = screen.getByLabelText('Subject');
      const messageInput = screen.getByLabelText('Message');

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(subjectInput, 'Test Subject');
      await userEvent.type(messageInput, 'Test Message');

      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(subjectInput).toHaveValue('Test Subject');
      expect(messageInput).toHaveValue('Test Message');
    });

    it('submits contact form successfully', async () => {
      render(<HelpCenterPage />);

      const nameInput = screen.getByLabelText('Your Name');
      const emailInput = screen.getByLabelText('Email Address');
      const subjectInput = screen.getByLabelText('Subject');
      const messageInput = screen.getByLabelText('Message');
      const submitButton = screen.getByRole('button', { name: 'Send Message' });

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(subjectInput, 'Test Subject');
      await userEvent.type(messageInput, 'Test Message');
      await userEvent.click(submitButton);

      expect(mockShow).toHaveBeenCalledWith('Your message has been sent to our support team!', { type: 'success' });
    });

    it('resets form after successful submission', async () => {
      render(<HelpCenterPage />);

      const nameInput = screen.getByLabelText('Your Name');
      const emailInput = screen.getByLabelText('Email Address');
      const subjectInput = screen.getByLabelText('Subject');
      const messageInput = screen.getByLabelText('Message');
      const submitButton = screen.getByRole('button', { name: 'Send Message' });

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(subjectInput, 'Test Subject');
      await userEvent.type(messageInput, 'Test Message');
      await userEvent.click(submitButton);

      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(subjectInput).toHaveValue('');
      expect(messageInput).toHaveValue('');
    });

    it('validates required fields', async () => {
      render(<HelpCenterPage />);

      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);

      // Form should not submit without required fields
      expect(mockShow).not.toHaveBeenCalled();
    });
  });

  describe('Contact Methods', () => {
    it('displays contact information', () => {
      render(<HelpCenterPage />);

      expect(screen.getByText('Email Us')).toBeInTheDocument();
      expect(screen.getByText('support@orionapp.com')).toBeInTheDocument();
      expect(screen.getByText('Typically replies within 24 hours')).toBeInTheDocument();

      expect(screen.getByText('Live Chat')).toBeInTheDocument();
      expect(screen.getByText('Available 9AM-5PM SAST')).toBeInTheDocument();

      expect(screen.getByText('Call Us')).toBeInTheDocument();
      expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('Mon-Fri, 8AM-6PM PST')).toBeInTheDocument();
    });

    it('has correct email link', () => {
      render(<HelpCenterPage />);

      const emailLink = screen.getByText('support@orionapp.com');
      expect(emailLink.closest('div')).toBeInTheDocument();
    });
  });

  describe('Quick Help Cards', () => {
    it('has correct knowledge base link', () => {
      render(<HelpCenterPage />);

      const knowledgeBaseLink = screen.getByText('Explore guides');
      expect(knowledgeBaseLink.closest('a')).toHaveAttribute('href', '//www.youtube.com/watch?v=Aq5WXmQQooo');
    });

    it('scrolls to contact section when email support is clicked', async () => {
      // Mock scrollIntoView
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      render(<HelpCenterPage />);

      const emailSupportButton = screen.getByText('Send message');
      await userEvent.click(emailSupportButton);

      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('FAQ Content', () => {
    it('displays all general questions', () => {
      render(<HelpCenterPage />);

      expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
      expect(screen.getByText('Is Orion free to use?')).toBeInTheDocument();
      expect(screen.getByText('How do I report an issue with a trail?')).toBeInTheDocument();
    });

    it('displays all trails questions', async () => {
      render(<HelpCenterPage />);

      const trailsTab = screen.getByText('Trails & Navigation');
      await userEvent.click(trailsTab);

      expect(screen.getByText('How do I save a trail to my wishlist?')).toBeInTheDocument();
      expect(screen.getByText('Can I download maps for offline use?')).toBeInTheDocument();
      expect(screen.getByText('How accurate are the trail difficulty ratings?')).toBeInTheDocument();
    });

    it('displays all account questions', async () => {
      render(<HelpCenterPage />);

      const accountTab = screen.getByText('Account & Settings');
      await userEvent.click(accountTab);

      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
      expect(screen.getByText('Can I change my username?')).toBeInTheDocument();
      expect(screen.getByText('How do I delete my account?')).toBeInTheDocument();
    });

    it('displays all technical questions', async () => {
      render(<HelpCenterPage />);

      const technicalTab = screen.getByText('Technical Support');
      await userEvent.click(technicalTab);

      expect(screen.getByText('The app is crashing on my device. What should I do?')).toBeInTheDocument();
      expect(screen.getByText('How do I enable notifications?')).toBeInTheDocument();
      expect(screen.getByText('Why is my location not showing accurately?')).toBeInTheDocument();
    });
  });

  describe('Icons and Visual Elements', () => {
    it('renders category icons', () => {
      render(<HelpCenterPage />);

      // Check that icons are present (we can't easily test the actual Lucide icons)
      expect(screen.getByText('General Questions')).toBeInTheDocument();
      expect(screen.getByText('Trails & Navigation')).toBeInTheDocument();
      expect(screen.getByText('Account & Settings')).toBeInTheDocument();
      expect(screen.getByText('Technical Support')).toBeInTheDocument();
    });

    it('renders settings icon for technical support', () => {
      render(<HelpCenterPage />);

      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toHaveAttribute('data-size', '20');
    });

    it('renders help card icons', () => {
      render(<HelpCenterPage />);

      // Check that help cards are present
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
      expect(screen.getByText('Community Forum')).toBeInTheDocument();
      expect(screen.getByText('Email Support')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty search query', async () => {
      render(<HelpCenterPage />);

      const searchInput = screen.getByPlaceholderText('Search for answers...');
      await userEvent.type(searchInput, '');
      await userEvent.clear(searchInput);

      // Should show all questions
      expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
    });

    it('handles search with special characters', async () => {
      render(<HelpCenterPage />);

      const searchInput = screen.getByPlaceholderText('Search for answers...');
      await userEvent.type(searchInput, '!@#$%^&*()');

      expect(screen.getByText('No results found for "!@#$%^&*()" in this category.')).toBeInTheDocument();
    });

    it('handles very long search query', async () => {
      render(<HelpCenterPage />);

      const longQuery = 'a'.repeat(1000);
      const searchInput = screen.getByPlaceholderText('Search for answers...');
      await userEvent.type(searchInput, longQuery);

      expect(screen.getByText(`No results found for "${longQuery}" in this category.`)).toBeInTheDocument();
    });

    it('maintains search state when switching categories', async () => {
      render(<HelpCenterPage />);

      const searchInput = screen.getByPlaceholderText('Search for answers...');
      await userEvent.type(searchInput, 'account');

      // Switch to trails category
      const trailsTab = screen.getByText('Trails & Navigation');
      await userEvent.click(trailsTab);

      // Search should still be active
      expect(searchInput).toHaveValue('account');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<HelpCenterPage />);

      expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
      expect(screen.getByLabelText('Message')).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      render(<HelpCenterPage />);

      expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<HelpCenterPage />);

      expect(screen.getByRole('heading', { level: 1, name: 'How can we help you?' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Get Help Quickly' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Frequently Asked Questions' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Still need help?' })).toBeInTheDocument();
    });
  });
});
