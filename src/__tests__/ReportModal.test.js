import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportModal from '../components/modals/ReportModal';

// Mock the CSS import
jest.mock('../components/modals/ReportModal.css', () => ({}));

describe('ReportModal', () => {
  const defaultProps = {
    isVisible: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    trailId: 'test-trail-id',
    trailName: 'Test Trail',
    reportType: 'general',
    targetId: null,
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when visible', () => {
      render(<ReportModal {...defaultProps} />);
      
      expect(screen.getByText('Report General')).toBeInTheDocument();
      expect(screen.getByText('Test Trail')).toBeInTheDocument();
      expect(screen.getByText('Description *')).toBeInTheDocument();
      expect(screen.getByText('Priority Level')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      render(<ReportModal {...defaultProps} isVisible={false} />);
      
      expect(screen.queryByText('Report General')).not.toBeInTheDocument();
    });

    it('renders trail name when provided', () => {
      render(<ReportModal {...defaultProps} trailName="Mountain Trail" />);
      
      expect(screen.getByText('Mountain Trail')).toBeInTheDocument();
    });

    it('does not render trail info when trailName is not provided', () => {
      render(<ReportModal {...defaultProps} trailName={null} />);
      
      expect(screen.queryByText('Trail:')).not.toBeInTheDocument();
    });
  });

  describe('Report Categories', () => {
    it('shows general categories for general report type', () => {
      render(<ReportModal {...defaultProps} reportType="general" />);
      
      expect(screen.getByText('Bug Report')).toBeInTheDocument();
      expect(screen.getByText('Feature Request')).toBeInTheDocument();
      expect(screen.getByText('Inappropriate Content')).toBeInTheDocument();
    });

    it('shows trail-specific categories for trail report type', () => {
      render(<ReportModal {...defaultProps} reportType="trail" />);
      
      expect(screen.getByText('Inaccurate Information')).toBeInTheDocument();
      expect(screen.getByText('Safety Concern')).toBeInTheDocument();
      expect(screen.getByText('Accessibility Issue')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Needed')).toBeInTheDocument();
    });

    it('shows review-specific categories for review report type', () => {
      render(<ReportModal {...defaultProps} reportType="review" />);
      
      expect(screen.getByText('Spam')).toBeInTheDocument();
      expect(screen.getByText('Harassment')).toBeInTheDocument();
      expect(screen.getByText('False Information')).toBeInTheDocument();
      expect(screen.getByText('Off Topic')).toBeInTheDocument();
    });

    it('shows image-specific categories for image report type', () => {
      render(<ReportModal {...defaultProps} reportType="image" />);
      
      expect(screen.getByText('Not Trail Related')).toBeInTheDocument();
      expect(screen.getByText('Poor Quality')).toBeInTheDocument();
      expect(screen.getByText('Duplicate Image')).toBeInTheDocument();
      expect(screen.getByText('Copyright Violation')).toBeInTheDocument();
    });

    it('shows alert-specific categories for alert report type', () => {
      render(<ReportModal {...defaultProps} reportType="alert" />);
      
      expect(screen.getByText('Outdated Alert')).toBeInTheDocument();
      expect(screen.getByText('Inappropriate Content')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('allows selecting report category', () => {
      const mockOnSubmit = jest.fn();
      render(<ReportModal {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const bugReportButton = screen.getByText('Bug Report');
      
      act(() => {
        fireEvent.click(bugReportButton);
      });
      
      // Test that the category selection works by checking form submission
      const descriptionTextarea = screen.getByPlaceholderText('Please provide a detailed description of the issue...');
      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });
      
      const submitButton = screen.getByText('Submit Report');
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'bug_report'
        })
      );
    });

    it('allows entering description', () => {
      render(<ReportModal {...defaultProps} />);
      
      const descriptionTextarea = screen.getByPlaceholderText('Please provide a detailed description of the issue...');
      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });
      
      expect(descriptionTextarea.value).toBe('Test description');
    });

    it('shows character count for description', () => {
      render(<ReportModal {...defaultProps} />);
      
      const descriptionTextarea = screen.getByPlaceholderText('Please provide a detailed description of the issue...');
      fireEvent.change(descriptionTextarea, { target: { value: 'Test' } });
      
      expect(screen.getByText('4/1000 characters')).toBeInTheDocument();
    });

    it('allows selecting priority level', () => {
      render(<ReportModal {...defaultProps} />);
      
      const prioritySelect = screen.getByDisplayValue('Medium - Moderate concern');
      fireEvent.change(prioritySelect, { target: { value: 'high' } });
      
      expect(prioritySelect.value).toBe('high');
    });

    it('allows entering additional details', () => {
      render(<ReportModal {...defaultProps} />);
      
      const additionalTextarea = screen.getByPlaceholderText('Any additional information that might be helpful...');
      fireEvent.change(additionalTextarea, { target: { value: 'Additional info' } });
      
      expect(additionalTextarea.value).toBe('Additional info');
    });

    it('shows character count for additional details', () => {
      render(<ReportModal {...defaultProps} />);
      
      const additionalTextarea = screen.getByPlaceholderText('Any additional information that might be helpful...');
      fireEvent.change(additionalTextarea, { target: { value: 'Test' } });
      
      expect(screen.getByText('4/500 characters')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('disables submit button when no category selected', () => {
      render(<ReportModal {...defaultProps} />);
      
      const submitButton = screen.getByText('Submit Report');
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when no description provided', () => {
      render(<ReportModal {...defaultProps} />);
      
      const bugReportButton = screen.getByText('Bug Report');
      fireEvent.click(bugReportButton);
      
      const submitButton = screen.getByText('Submit Report');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when category and description are provided', () => {
      render(<ReportModal {...defaultProps} />);
      
      const bugReportButton = screen.getByText('Bug Report');
      fireEvent.click(bugReportButton);
      
      const descriptionTextarea = screen.getByPlaceholderText('Please provide a detailed description of the issue...');
      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });
      
      const submitButton = screen.getByText('Submit Report');
      expect(submitButton).not.toBeDisabled();
    });

    it('disables submit button when description is only whitespace', () => {
      render(<ReportModal {...defaultProps} />);
      
      const bugReportButton = screen.getByText('Bug Report');
      fireEvent.click(bugReportButton);
      
      const descriptionTextarea = screen.getByPlaceholderText('Please provide a detailed description of the issue...');
      fireEvent.change(descriptionTextarea, { target: { value: '   ' } });
      
      const submitButton = screen.getByText('Submit Report');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with correct data when form is submitted', () => {
      const mockOnSubmit = jest.fn();
      render(<ReportModal {...defaultProps} onSubmit={mockOnSubmit} />);
      
      // Fill out form
      const bugReportButton = screen.getByText('Bug Report');
      fireEvent.click(bugReportButton);
      
      const descriptionTextarea = screen.getByPlaceholderText('Please provide a detailed description of the issue...');
      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });
      
      const prioritySelect = screen.getByDisplayValue('Medium - Moderate concern');
      fireEvent.change(prioritySelect, { target: { value: 'high' } });
      
      const additionalTextarea = screen.getByPlaceholderText('Any additional information that might be helpful...');
      fireEvent.change(additionalTextarea, { target: { value: 'Additional info' } });
      
      // Submit form
      const submitButton = screen.getByText('Submit Report');
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        type: 'general',
        category: 'bug_report',
        description: 'Test description',
        priority: 'high',
        additionalDetails: 'Additional info',
        targetId: null,
        trailId: 'test-trail-id',
        timestamp: expect.any(String)
      });
    });

    it('does not call onSubmit when form is invalid', () => {
      const mockOnSubmit = jest.fn();
      render(<ReportModal {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByText('Submit Report');
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Modal Actions', () => {
    it('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<ReportModal {...defaultProps} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: '' }); // Close button with X icon
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<ReportModal {...defaultProps} onClose={mockOnClose} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when overlay is clicked', () => {
      const mockOnClose = jest.fn();
      render(<ReportModal {...defaultProps} onClose={mockOnClose} />);
      
      const overlay = screen.getByRole('button', { name: '' }).closest('.report-modal-overlay');
      fireEvent.click(overlay);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onClose when modal content is clicked', () => {
      const mockOnClose = jest.fn();
      render(<ReportModal {...defaultProps} onClose={mockOnClose} />);
      
      const modalContent = screen.getByText('Report General').closest('.report-modal-content');
      fireEvent.click(modalContent);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('resets form when modal is closed', () => {
      const mockOnClose = jest.fn();
      const { rerender } = render(<ReportModal {...defaultProps} onClose={mockOnClose} />);
      
      // Fill out form
      const bugReportButton = screen.getByText('Bug Report');
      fireEvent.click(bugReportButton);
      
      const descriptionTextarea = screen.getByPlaceholderText('Please provide a detailed description of the issue...');
      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });
      
      // Close modal
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // Reopen modal (simulate)
      rerender(<ReportModal {...defaultProps} isVisible={true} onClose={mockOnClose} />);
      
      const prioritySelects = screen.getAllByDisplayValue('Medium - Moderate concern');
      expect(prioritySelects[0]).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Please provide a detailed description of the issue...').value).toBe('');
    });
  });

  describe('Loading State', () => {
    it('shows loading text on submit button when loading', () => {
      render(<ReportModal {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    it('disables buttons when loading', () => {
      render(<ReportModal {...defaultProps} loading={true} />);
      
      const cancelButton = screen.getByText('Cancel');
      const submitButton = screen.getByText('Submitting...');
      
      expect(cancelButton).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Report Type Labels', () => {
    it('shows correct label for trail report type', () => {
      render(<ReportModal {...defaultProps} reportType="trail" />);
      expect(screen.getByText('Report Trail')).toBeInTheDocument();
    });

    it('shows correct label for review report type', () => {
      render(<ReportModal {...defaultProps} reportType="review" />);
      expect(screen.getByText('Report Review')).toBeInTheDocument();
    });

    it('shows correct label for image report type', () => {
      render(<ReportModal {...defaultProps} reportType="image" />);
      expect(screen.getByText('Report Image')).toBeInTheDocument();
    });

    it('shows correct label for alert report type', () => {
      render(<ReportModal {...defaultProps} reportType="alert" />);
      expect(screen.getByText('Report Alert')).toBeInTheDocument();
    });

    it('shows correct label for general report type', () => {
      render(<ReportModal {...defaultProps} reportType="general" />);
      expect(screen.getByText('Report General')).toBeInTheDocument();
    });
  });

  describe('Target ID Handling', () => {
    it('includes targetId in submission data when provided', () => {
      const mockOnSubmit = jest.fn();
      render(<ReportModal {...defaultProps} onSubmit={mockOnSubmit} targetId="review-123" />);
      
      // Fill out and submit form
      const bugReportButton = screen.getByText('Bug Report');
      fireEvent.click(bugReportButton);
      
      const descriptionTextarea = screen.getByPlaceholderText('Please provide a detailed description of the issue...');
      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });
      
      const submitButton = screen.getByText('Submit Report');
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          targetId: 'review-123'
        })
      );
    });
  });
});
