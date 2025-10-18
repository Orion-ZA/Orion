import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertModal from '../components/modals/AlertModal';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

describe('AlertModal', () => {
  const defaultProps = {
    isVisible: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    trailId: 'trail123',
    trailName: 'Test Trail',
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders modal when visible', () => {
      render(<AlertModal {...defaultProps} />);
      
      expect(screen.getByText('Add Alert')).toBeInTheDocument();
      expect(screen.getByText('Test Trail')).toBeInTheDocument();
      expect(screen.getByText('Alert Type')).toBeInTheDocument();
      expect(screen.getByText('Alert Message')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      render(<AlertModal {...defaultProps} isVisible={false} />);
      
      expect(screen.queryByText('Add Alert')).not.toBeInTheDocument();
    });

    it('renders without trail name when not provided', () => {
      const { trailName, ...propsWithoutTrailName } = defaultProps;
      render(<AlertModal {...propsWithoutTrailName} />);
      
      expect(screen.getByText('Add Alert')).toBeInTheDocument();
      expect(screen.queryByText('Trail:')).not.toBeInTheDocument();
    });

    it('renders with correct icons', () => {
      render(<AlertModal {...defaultProps} />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('renders all alert type options', () => {
      render(<AlertModal {...defaultProps} />);
      
      const select = screen.getByLabelText('Alert Type');
      expect(select).toBeInTheDocument();
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(6);
      expect(screen.getByRole('option', { name: 'General' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Safety' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Weather' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Maintenance' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Wildlife' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Closure' })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates alert type when selected', () => {
      render(<AlertModal {...defaultProps} />);
      
      const select = screen.getByLabelText('Alert Type');
      fireEvent.change(select, { target: { value: 'safety' } });
      
      expect(select.value).toBe('safety');
    });

    it('updates alert message when typed', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test alert message' } });
      
      expect(textarea.value).toBe('Test alert message');
    });

    it('shows character count for message', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      expect(screen.getByText('12/500 characters')).toBeInTheDocument();
    });

    it('toggles timed alert checkbox', () => {
      render(<AlertModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      expect(checkbox.checked).toBe(false);
      
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('shows duration input when timed alert is enabled', () => {
      render(<AlertModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument();
      expect(screen.getByText('Alert will automatically expire after the specified duration')).toBeInTheDocument();
    });

    it('hides duration input when timed alert is disabled', () => {
      render(<AlertModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);
      
      expect(screen.queryByLabelText('Duration (minutes)')).not.toBeInTheDocument();
    });

    it('updates duration when typed', () => {
      render(<AlertModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '60' } });
      
      expect(durationInput.value).toBe('60');
    });

    it('handles invalid duration input', () => {
      render(<AlertModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: 'invalid' } });
      
      expect(durationInput.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('disables submit button when message is empty', () => {
      render(<AlertModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when message is provided', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      expect(submitButton).not.toBeDisabled();
    });

    it('disables submit button when message is only whitespace', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: '   ' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when timed alert is enabled but duration is empty', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when timed alert duration is zero or negative', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '0' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when timed alert has valid duration', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '60' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      expect(submitButton).not.toBeDisabled();
    });

    it('disables buttons when loading', () => {
      render(<AlertModal {...defaultProps} loading={true} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const submitButton = screen.getByRole('button', { name: 'Submitting...' });
      
      expect(cancelButton).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with correct data for general alert', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test alert message' } });
      
      const select = screen.getByLabelText('Alert Type');
      fireEvent.change(select, { target: { value: 'safety' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        message: 'Test alert message',
        type: 'safety',
        duration: null,
        isTimed: false
      });
    });

    it('calls onSubmit with correct data for timed alert', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Timed alert message' } });
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '120' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        message: 'Timed alert message',
        type: 'general',
        duration: 120,
        isTimed: true
      });
    });

    it('does not call onSubmit when message is empty', () => {
      render(<AlertModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when timed alert has invalid duration', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '-5' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when message is empty (early return test)', () => {
      render(<AlertModal {...defaultProps} />);
      
      // Don't fill in any message
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when message is only whitespace (early return test)', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: '   \n\t   ' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when timed alert duration is zero (early return test)', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '0' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when timed alert duration is negative (early return test)', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '-10' } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when timed alert is enabled but duration is null (early return test)', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      // Don't set any duration value
      const submitButton = screen.getByRole('button', { name: 'Submit Alert' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Modal Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      render(<AlertModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', () => {
      render(<AlertModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when overlay is clicked', () => {
      render(<AlertModal {...defaultProps} />);
      
      const overlay = document.querySelector('.alert-modal-overlay');
      fireEvent.click(overlay);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('does not call onClose when modal content is clicked', () => {
      render(<AlertModal {...defaultProps} />);
      
      const modalContent = screen.getByText('Add Alert').closest('.alert-modal-content');
      fireEvent.click(modalContent);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('resets form when modal is closed', () => {
      render(<AlertModal {...defaultProps} />);
      
      // Fill out form
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const select = screen.getByLabelText('Alert Type');
      fireEvent.change(select, { target: { value: 'safety' } });
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '60' } });
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);
      
      // Verify onClose was called (which should reset the form in the parent component)
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles missing props gracefully', () => {
      render(<AlertModal isVisible={true} />);
      
      expect(screen.getByText('Add Alert')).toBeInTheDocument();
    });

    it('handles very long messages', () => {
      render(<AlertModal {...defaultProps} />);
      
      const longMessage = 'a'.repeat(500);
      const textarea = screen.getByLabelText('Alert Message');
      fireEvent.change(textarea, { target: { value: longMessage } });
      
      expect(screen.getByText('500/500 characters')).toBeInTheDocument();
    });

    it('handles duration input with decimal values', () => {
      render(<AlertModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '60.5' } });
      
      expect(durationInput.value).toBe('60');
    });

    it('handles duration input with very large values', () => {
      render(<AlertModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      fireEvent.change(durationInput, { target: { value: '999999' } });
      
      expect(durationInput.value).toBe('999999');
    });

    it('handles rapid checkbox toggling', () => {
      render(<AlertModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      
      fireEvent.click(checkbox);
      expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument();
      
      fireEvent.click(checkbox);
      expect(screen.queryByLabelText('Duration (minutes)')).not.toBeInTheDocument();
      
      fireEvent.click(checkbox);
      expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<AlertModal {...defaultProps} />);
      
      expect(screen.getByLabelText('Alert Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Alert Message')).toBeInTheDocument();
      expect(screen.getByLabelText(/Make this a timed alert/)).toBeInTheDocument();
    });

    it('has proper button roles', () => {
      render(<AlertModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Alert' })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<AlertModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Add Alert');
    });

    it('has proper input constraints', () => {
      render(<AlertModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/Make this a timed alert/);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText('Duration (minutes)');
      expect(durationInput).toHaveAttribute('min', '1');
      expect(durationInput).toHaveAttribute('max', '1440');
    });

    it('has proper textarea constraints', () => {
      render(<AlertModal {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Alert Message');
      expect(textarea).toHaveAttribute('maxLength', '500');
      expect(textarea).toHaveAttribute('rows', '4');
    });
  });
});
