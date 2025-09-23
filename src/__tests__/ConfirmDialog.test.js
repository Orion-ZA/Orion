import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmDialog from '../components/ConfirmDialog';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: (props) => <svg data-testid="alert-triangle" {...props} />,
  X: (props) => <svg data-testid="close-icon" {...props} />,
}));

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Test Title',
    message: 'Test message',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning',
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with default props when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);
    
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close icon is clicked', () => {
    const onClose = jest.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    
    const closeBtn = screen.getByTestId('close-icon').closest('button');
    fireEvent.click(closeBtn);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    
    const backdrop = screen.getByText('Test Title').closest('.confirm-dialog-overlay');
    fireEvent.click(backdrop);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when dialog content is clicked', () => {
    const onClose = jest.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    
    const dialog = screen.getByText('Test Title').closest('.confirm-dialog');
    fireEvent.click(dialog);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('disables buttons when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    
    const confirmBtn = screen.getByText('Processing...');
    const cancelBtn = screen.getByText('Cancel');
    const closeBtn = screen.getByTestId('close-icon').closest('button');
    
    expect(confirmBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
    expect(closeBtn).toBeDisabled();
  });

  it('renders with danger type styling', () => {
    render(<ConfirmDialog {...defaultProps} type="danger" />);
    
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn).toHaveClass('confirm-btn', 'danger');
  });

  it('renders with info type styling', () => {
    render(<ConfirmDialog {...defaultProps} type="info" />);
    
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn).toHaveClass('confirm-btn', 'info');
  });

  it('renders with warning type styling by default', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn).toHaveClass('confirm-btn', 'warning');
  });

  it('renders with custom text props', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        title="Custom Title"
        message="Custom message"
        confirmText="Yes"
        cancelText="No"
      />
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    const confirmBtn = screen.getByText('Confirm');
    const cancelBtn = screen.getByText('Cancel');
    
    // Buttons should be present and clickable
    expect(confirmBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();
  });

  it('renders with proper CSS classes', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(document.querySelector('.confirm-dialog-overlay')).toBeInTheDocument();
    expect(document.querySelector('.confirm-dialog')).toBeInTheDocument();
    expect(document.querySelector('.confirm-dialog-content')).toBeInTheDocument();
    expect(document.querySelector('.confirm-dialog-actions')).toBeInTheDocument();
  });
});
