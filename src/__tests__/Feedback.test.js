import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Feedback from '../pages/Feedback';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../components/ToastContext';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp')
}));

jest.mock('../firebaseConfig', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User'
    }
  }
}));

// Mock ToastContext
jest.mock('../components/ToastContext', () => ({
  useToast: jest.fn()
}));

// Mock window.history.back
const mockHistoryBack = jest.fn();
Object.defineProperty(window, 'history', {
  value: {
    back: mockHistoryBack
  },
  writable: true
});

// Mock window.location.pathname
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/feedback'
  },
  writable: true
});

// Mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Browser)',
  writable: true
});

describe('Feedback Component', () => {
  const mockShow = jest.fn();
  const mockAddDoc = addDoc;
  const mockCollection = collection;
  const mockServerTimestamp = serverTimestamp;

  beforeEach(() => {
    jest.clearAllMocks();
    useToast.mockReturnValue({ show: mockShow });
    mockAddDoc.mockResolvedValue({ id: 'feedback-id' });
    mockCollection.mockReturnValue('feedback-collection');
    mockServerTimestamp.mockReturnValue('mock-timestamp');
  });

  describe('Component Rendering', () => {
    it('renders the feedback form initially', () => {
      render(<Feedback />);

      expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
      expect(screen.getByText('We\'re all ears! Tell us about your experience with Orion')).toBeInTheDocument();
      expect(screen.getByText('What type of feedback are you sharing?')).toBeInTheDocument();
      expect(screen.getByText('How would you rate your experience?')).toBeInTheDocument();
    });

    it('renders all feedback type options', () => {
      render(<Feedback />);

      expect(screen.getByText('General Feedback')).toBeInTheDocument();
      expect(screen.getByText('Bug Report')).toBeInTheDocument();
      expect(screen.getByText('Feature Suggestion')).toBeInTheDocument();
      expect(screen.getByText('Praise')).toBeInTheDocument();
    });

    it('renders rating stars', () => {
      render(<Feedback />);

      const stars = screen.getAllByRole('button', { name: /Rate \d+ out of 5 stars/ });
      expect(stars).toHaveLength(5);
    });

    it('renders message textarea', () => {
      render(<Feedback />);

      expect(screen.getByLabelText(/Share your thoughts with us/)).toBeInTheDocument();
    });

    it('renders contact permission checkbox', () => {
      render(<Feedback />);

      expect(screen.getByLabelText(/It's okay to contact me about this feedback/)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<Feedback />);

      expect(screen.getByRole('button', { name: /Submit Feedback/ })).toBeInTheDocument();
    });
  });

  describe('Feedback Type Selection', () => {
    it('selects general feedback by default', () => {
      render(<Feedback />);

      const generalButton = screen.getByText('General Feedback');
      expect(generalButton.closest('button')).toHaveClass('active');
    });

    it('switches to bug report type', async () => {
      render(<Feedback />);

      const bugButton = screen.getByText('Bug Report');
      await userEvent.click(bugButton);

      expect(bugButton.closest('button')).toHaveClass('active');
      expect(screen.getByText('Describe the bug you encountered')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Please include steps to reproduce/)).toBeInTheDocument();
    });

    it('switches to feature suggestion type', async () => {
      render(<Feedback />);

      const suggestionButton = screen.getByText('Feature Suggestion');
      await userEvent.click(suggestionButton);

      expect(suggestionButton.closest('button')).toHaveClass('active');
      expect(screen.getByText('Tell us about your idea')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/How would this feature improve/)).toBeInTheDocument();
    });

    it('switches to praise type', async () => {
      render(<Feedback />);

      const praiseButton = screen.getByText('Praise');
      await userEvent.click(praiseButton);

      expect(praiseButton.closest('button')).toHaveClass('active');
      expect(screen.getByText('What did you love about Orion?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/We love hearing what works well/)).toBeInTheDocument();
    });

    it('shows screenshot upload for bug reports', async () => {
      render(<Feedback />);

      const bugButton = screen.getByText('Bug Report');
      await userEvent.click(bugButton);

      expect(screen.getByText('Add a screenshot (optional)')).toBeInTheDocument();
      expect(screen.getByLabelText(/Choose file/)).toBeInTheDocument();
    });

    it('hides screenshot upload for other types', async () => {
      render(<Feedback />);

      const suggestionButton = screen.getByText('Feature Suggestion');
      await userEvent.click(suggestionButton);

      expect(screen.queryByText('Add a screenshot (optional)')).not.toBeInTheDocument();
    });
  });

  describe('Rating System', () => {
    it('allows rating selection', async () => {
      render(<Feedback />);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      expect(thirdStar).toHaveClass('active');
    });

    it('shows hover effect on rating', async () => {
      render(<Feedback />);

      const fourthStar = screen.getByRole('button', { name: 'Rate 4 out of 5 stars' });
      await userEvent.hover(fourthStar);

      expect(fourthStar).toHaveClass('active');
    });

    it('resets hover when mouse leaves', async () => {
      render(<Feedback />);

      const fourthStar = screen.getByRole('button', { name: 'Rate 4 out of 5 stars' });
      await userEvent.hover(fourthStar);
      await userEvent.unhover(fourthStar);

      expect(fourthStar).not.toHaveClass('active');
    });

    it('maintains selected rating after hover', async () => {
      render(<Feedback />);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      const fourthStar = screen.getByRole('button', { name: 'Rate 4 out of 5 stars' });

      await userEvent.click(thirdStar);
      await userEvent.hover(fourthStar);
      await userEvent.unhover(fourthStar);

      expect(thirdStar).toHaveClass('active');
      expect(fourthStar).not.toHaveClass('active');
    });
  });

  describe('Form Submission', () => {
    it('submits feedback successfully', async () => {
      render(<Feedback />);

      // Fill out form
      const bugButton = screen.getByText('Bug Report');
      await userEvent.click(bugButton);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/Please include steps to reproduce/);
      await userEvent.type(messageTextarea, 'The app crashes when I click the button');

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith('feedback-collection', {
          rating: 3,
          message: 'The app crashes when I click the button',
          type: 'bug',
          contactAllowed: true,
          createdAt: 'mock-timestamp',
          userId: 'test-user-id',
          email: 'test@example.com',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          page: '/feedback'
        });
      });

      await waitFor(() => {
        expect(mockShow).toHaveBeenCalledWith('Thank you for your feedback!', { type: 'success' });
      });
    });

    it('shows success screen after submission', async () => {
      render(<Feedback />);

      // Fill out and submit form
      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      await userEvent.type(messageTextarea, 'Great app!');

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
        expect(screen.getByText('Your input helps us improve the app for everyone.')).toBeInTheDocument();
        expect(screen.getByText('Send another feedback')).toBeInTheDocument();
        expect(screen.getByText('Go back')).toBeInTheDocument();
      });
    });

    it('resets form after successful submission', async () => {
      render(<Feedback />);

      // Fill out form
      const bugButton = screen.getByText('Bug Report');
      await userEvent.click(bugButton);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/Please include steps to reproduce/);
      await userEvent.type(messageTextarea, 'Test message');

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      });

      // Click "Send another feedback"
      const sendAnotherButton = screen.getByText('Send another feedback');
      await userEvent.click(sendAnotherButton);

      // Form should be reset
      expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
      expect(screen.getByText('General Feedback')).toBeInTheDocument();
      expect(screen.getByText('General Feedback').closest('button')).toHaveClass('active');
      expect(screen.getByPlaceholderText(/What did you like/)).toHaveValue('');
    });

    it('validates required fields', async () => {
      render(<Feedback />);

      // The submit button should be disabled when form is invalid
      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      expect(submitButton).toBeDisabled();
      
      // Try to submit the form directly to test validation
      const form = submitButton.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockShow).toHaveBeenCalledWith('Please provide both a rating and a message.', { type: 'error' });
      });
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('validates empty message', async () => {
      render(<Feedback />);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      await userEvent.type(messageTextarea, '   '); // Only whitespace

      // The submit button should be disabled when message is only whitespace
      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      expect(submitButton).toBeDisabled();
      
      // Try to submit the form directly to test validation
      const form = submitButton.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockShow).toHaveBeenCalledWith('Please provide both a rating and a message.', { type: 'error' });
      });
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('disables submit button when form is invalid', () => {
      render(<Feedback />);

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      render(<Feedback />);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      await userEvent.type(messageTextarea, 'Test message');

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Screenshot Upload', () => {
    it('handles screenshot upload', async () => {
      render(<Feedback />);

      const bugButton = screen.getByText('Bug Report');
      await userEvent.click(bugButton);

      const fileInput = screen.getByLabelText(/Choose file/);
      const file = new File(['test content'], 'screenshot.png', { type: 'image/png' });

      await userEvent.upload(fileInput, file);

      expect(screen.getByText('screenshot.png')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove screenshot' })).toBeInTheDocument();
    });

    it('rejects non-image files', async () => {
      render(<Feedback />);

      const bugButton = screen.getByText('Bug Report');
      await userEvent.click(bugButton);

      const fileInput = screen.getByLabelText(/Choose file/);
      const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });

      await userEvent.upload(fileInput, file);

      expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
    });

    it('removes uploaded screenshot', async () => {
      render(<Feedback />);

      const bugButton = screen.getByText('Bug Report');
      await userEvent.click(bugButton);

      const fileInput = screen.getByLabelText(/Choose file/);
      const file = new File(['test content'], 'screenshot.png', { type: 'image/png' });

      await userEvent.upload(fileInput, file);

      const removeButton = screen.getByRole('button', { name: 'Remove screenshot' });
      await userEvent.click(removeButton);

      expect(screen.queryByText('screenshot.png')).not.toBeInTheDocument();
    });
  });

  describe('Contact Permission', () => {
    it('toggles contact permission', async () => {
      render(<Feedback />);

      const contactCheckbox = screen.getByLabelText(/It's okay to contact me about this feedback/);
      expect(contactCheckbox).toBeChecked();

      await userEvent.click(contactCheckbox);
      expect(contactCheckbox).not.toBeChecked();

      await userEvent.click(contactCheckbox);
      expect(contactCheckbox).toBeChecked();
    });

    it('includes contact permission in submission', async () => {
      render(<Feedback />);

      const contactCheckbox = screen.getByLabelText(/It's okay to contact me about this feedback/);
      await userEvent.click(contactCheckbox);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      await userEvent.type(messageTextarea, 'Test message');

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith('feedback-collection', expect.objectContaining({
          contactAllowed: false
        }));
      });
    });
  });

  describe('Error Handling', () => {
    it('handles submission error', async () => {
      mockAddDoc.mockRejectedValue(new Error('Submission failed'));

      render(<Feedback />);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      await userEvent.type(messageTextarea, 'Test message');

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockShow).toHaveBeenCalledWith('Something went wrong. Please try again.', { type: 'error' });
      });
    });

    it('shows loading state during submission', async () => {
      mockAddDoc.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<Feedback />);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      await userEvent.type(messageTextarea, 'Test message');

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      await userEvent.click(submitButton);

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('goes back when clicking go back button', async () => {
      render(<Feedback />);

      // Submit feedback first
      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      await userEvent.type(messageTextarea, 'Test message');

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      });

      const goBackButton = screen.getByText('Go back');
      await userEvent.click(goBackButton);

      expect(mockHistoryBack).toHaveBeenCalled();
    });
  });

  describe('Help Options', () => {
    it('renders help options', () => {
      render(<Feedback />);

      expect(screen.getByText('Need immediate help?')).toBeInTheDocument();
      expect(screen.getByText('Visit Help Center')).toBeInTheDocument();
      expect(screen.getByText('Email Support')).toBeInTheDocument();
    });

    it('has correct help links', () => {
      render(<Feedback />);

      const helpCenterLink = screen.getByText('Visit Help Center');
      const emailSupportLink = screen.getByText('Email Support');

      expect(helpCenterLink.closest('a')).toHaveAttribute('href', '/help');
      expect(emailSupportLink.closest('a')).toHaveAttribute('href', 'mailto:support@orionapp.com');
    });
  });

  describe('Edge Cases', () => {
    it('handles unauthenticated user', () => {
      // Mock auth.currentUser as null
      const originalAuth = require('../firebaseConfig').auth;
      originalAuth.currentUser = null;

      render(<Feedback />);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      fireEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      fireEvent.change(messageTextarea, { target: { value: 'Test message' } });

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      fireEvent.click(submitButton);

      expect(mockAddDoc).toHaveBeenCalledWith('feedback-collection', expect.objectContaining({
        userId: null,
        email: 'Anonymous'
      }));
    });

    it('handles very long messages', async () => {
      const longMessage = 'A'.repeat(1000); // Reduced from 10000 to 1000 for performance

      render(<Feedback />);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      // Use fireEvent.change instead of userEvent.type for better performance
      fireEvent.change(messageTextarea, { target: { value: longMessage } });

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith('feedback-collection', expect.objectContaining({
          message: longMessage
        }));
      });
    });

    it('handles special characters in message', async () => {
      const specialMessage = 'Test message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

      render(<Feedback />);

      const thirdStar = screen.getByRole('button', { name: 'Rate 3 out of 5 stars' });
      await userEvent.click(thirdStar);

      const messageTextarea = screen.getByPlaceholderText(/What did you like/);
      fireEvent.change(messageTextarea, { target: { value: specialMessage } });

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/ });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalledWith('feedback-collection', expect.objectContaining({
          message: specialMessage
        }));
      });
    });
  });
});
