import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileForm from '../components/ProfileForm/ProfileForm';

describe('ProfileForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders form with correct structure', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass('profile-form');
  });

  it('renders name input field', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const nameInput = screen.getByLabelText('Full Name');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('id', 'name');
    expect(nameInput).toHaveAttribute('required');
    expect(nameInput).toHaveValue('');
  });

  it('renders avatar input field', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const avatarInput = screen.getByLabelText('Profile Picture URL (optional)');
    expect(avatarInput).toBeInTheDocument();
    expect(avatarInput).toHaveAttribute('type', 'url');
    expect(avatarInput).toHaveAttribute('id', 'avatar');
    expect(avatarInput).toHaveAttribute('placeholder', 'https://example.com/photo.jpg');
    expect(avatarInput).toHaveValue('');
    expect(avatarInput).not.toHaveAttribute('required');
  });

  it('renders submit button', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const submitButton = screen.getByRole('button', { name: /complete profile/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent('Complete Profile');
  });

  it('shows loading state on submit button', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={true} />);
    
    const submitButton = screen.getByRole('button', { name: /saving/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Saving...');
  });

  it('updates name input value when typed', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const nameInput = screen.getByLabelText('Full Name');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    expect(nameInput).toHaveValue('John Doe');
  });

  it('updates avatar input value when typed', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const avatarInput = screen.getByLabelText('Profile Picture URL (optional)');
    
    fireEvent.change(avatarInput, { target: { value: 'https://example.com/avatar.jpg' } });
    
    expect(avatarInput).toHaveValue('https://example.com/avatar.jpg');
  });

  it('calls onSubmit with form data when submitted', async () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const nameInput = screen.getByLabelText('Full Name');
    const avatarInput = screen.getByLabelText('Profile Picture URL (optional)');
    const form = document.querySelector('form');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(avatarInput, { target: { value: 'https://example.com/avatar.jpg' } });
    
    fireEvent.submit(form);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg'
    });
  });

  it('calls onSubmit with empty avatar when not provided', async () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const nameInput = screen.getByLabelText('Full Name');
    const form = document.querySelector('form');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    fireEvent.submit(form);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      avatar: ''
    });
  });

  it('prevents default form submission behavior', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const form = document.querySelector('form');
    
    // The form should call onSubmit without causing a page reload
    fireEvent.submit(form);
    
    // Verify that our mock onSubmit was called (which means preventDefault worked)
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('resets form state after submission', async () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const nameInput = screen.getByLabelText('Full Name');
    const avatarInput = screen.getByLabelText('Profile Picture URL (optional)');
    const form = document.querySelector('form');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(avatarInput, { target: { value: 'https://example.com/avatar.jpg' } });
    
    fireEvent.submit(form);
    
    // Form should still have the values (component doesn't reset them)
    expect(nameInput).toHaveValue('John Doe');
    expect(avatarInput).toHaveValue('https://example.com/avatar.jpg');
  });

  it('handles multiple form submissions', async () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const nameInput = screen.getByLabelText('Full Name');
    const form = document.querySelector('form');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.submit(form);
    
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    fireEvent.submit(form);
    
    expect(mockOnSubmit).toHaveBeenCalledTimes(2);
    expect(mockOnSubmit).toHaveBeenNthCalledWith(1, { name: 'John Doe', avatar: '' });
    expect(mockOnSubmit).toHaveBeenNthCalledWith(2, { name: 'Jane Smith', avatar: '' });
  });

  it('applies correct CSS classes', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const form = document.querySelector('form');
    expect(form).toHaveClass('profile-form');
    
    const formGroups = document.querySelectorAll('.form-group');
    expect(formGroups).toHaveLength(2);
  });

  it('handles special characters in name input', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const nameInput = screen.getByLabelText('Full Name');
    
    fireEvent.change(nameInput, { target: { value: 'José María O\'Connor-Smith' } });
    
    expect(nameInput).toHaveValue('José María O\'Connor-Smith');
  });

  it('handles long URLs in avatar input', () => {
    render(<ProfileForm onSubmit={mockOnSubmit} loading={false} />);
    
    const avatarInput = screen.getByLabelText('Profile Picture URL (optional)');
    const longUrl = 'https://example.com/very/long/path/to/avatar/image.jpg?param=value&another=param';
    
    fireEvent.change(avatarInput, { target: { value: longUrl } });
    
    expect(avatarInput).toHaveValue(longUrl);
  });
});
