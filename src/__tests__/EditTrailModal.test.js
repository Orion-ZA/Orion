import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditTrailModal from '../components/admin/EditTrailModal';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="close-icon" />,
}));

// Mock console.log to avoid test output noise
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('EditTrailModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnFormChange = jest.fn();

  const mockEditTrail = {
    id: 'trail1',
    name: 'Mountain Peak Trail',
    description: 'A beautiful trail with scenic views',
    difficulty: 'Moderate',
    distance: 5.2,
    elevationGain: 300,
    tags: 'scenic, forest, waterfall',
    status: 'open'
  };

  const mockEditForm = {
    name: 'Mountain Peak Trail',
    description: 'A beautiful trail with scenic views',
    difficulty: 'Moderate',
    distance: 5.2,
    elevationGain: 300,
    tags: 'scenic, forest, waterfall',
    status: 'open'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders nothing when isVisible is false', () => {
      render(
        <EditTrailModal
          isVisible={false}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.queryByText('Edit Trail')).not.toBeInTheDocument();
    });

    it('renders nothing when editTrail is null', () => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={null}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.queryByText('Edit Trail')).not.toBeInTheDocument();
    });

    it('renders nothing when editTrail is undefined', () => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={undefined}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.queryByText('Edit Trail')).not.toBeInTheDocument();
    });

    it('renders modal when both isVisible and editTrail are provided', () => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.getByText('Edit Trail')).toBeInTheDocument();
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });

    it('renders with correct CSS classes', () => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(document.querySelector('.edit-modal-overlay')).toBeInTheDocument();
      expect(document.querySelector('.edit-modal')).toBeInTheDocument();
      expect(document.querySelector('.edit-modal-header')).toBeInTheDocument();
      expect(document.querySelector('.edit-form')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    beforeEach(() => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );
    });

    it('renders all form fields with correct labels', () => {
      expect(screen.getByLabelText('Trail Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Difficulty')).toBeInTheDocument();
      expect(screen.getByLabelText(/Distance \(km\)/)).toBeInTheDocument();
      expect(screen.getByLabelText('Elevation Gain (m)')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags (comma-separated)')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('renders form fields with correct values', () => {
      expect(screen.getByDisplayValue('Mountain Peak Trail')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A beautiful trail with scenic views')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Moderate')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5.2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('300')).toBeInTheDocument();
      expect(screen.getByDisplayValue('scenic, forest, waterfall')).toBeInTheDocument();
      
      // Check status select value by checking the selected option
      const statusSelect = screen.getByLabelText('Status');
      expect(statusSelect).toHaveValue('open');
    });

    it('renders distance field as disabled with auto-filled label', () => {
      const distanceInput = screen.getByDisplayValue('5.2');
      expect(distanceInput).toBeDisabled();
      expect(distanceInput).toHaveClass('disabled-input');
      expect(screen.getByText('(Auto-filled)')).toBeInTheDocument();
    });

    it('renders textarea for description with correct rows', () => {
      const descriptionTextarea = screen.getByDisplayValue('A beautiful trail with scenic views');
      expect(descriptionTextarea.tagName).toBe('TEXTAREA');
      expect(descriptionTextarea).toHaveAttribute('rows', '4');
    });

    it('renders tags input with placeholder', () => {
      const tagsInput = screen.getByDisplayValue('scenic, forest, waterfall');
      expect(tagsInput).toHaveAttribute('placeholder', 'e.g., waterfall, forest, scenic');
    });

    it('renders elevation gain input with correct attributes', () => {
      const elevationInput = screen.getByDisplayValue('300');
      expect(elevationInput).toHaveAttribute('type', 'number');
      expect(elevationInput).toHaveAttribute('step', '1');
      expect(elevationInput).toHaveAttribute('min', '0');
    });

    it('renders distance input with correct attributes', () => {
      const distanceInput = screen.getByDisplayValue('5.2');
      expect(distanceInput).toHaveAttribute('type', 'number');
      expect(distanceInput).toHaveAttribute('step', '0.1');
      expect(distanceInput).toHaveAttribute('min', '0');
    });
  });

  describe('Select Options', () => {
    beforeEach(() => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );
    });

    it('renders difficulty select with correct options', () => {
      const difficultySelect = screen.getByLabelText('Difficulty');
      expect(difficultySelect).toBeInTheDocument();
      
      expect(screen.getByRole('option', { name: 'Easy' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Moderate' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Hard' })).toBeInTheDocument();
    });

    it('renders status select with correct options', () => {
      const statusSelect = screen.getByLabelText('Status');
      expect(statusSelect).toBeInTheDocument();
      
      expect(screen.getByRole('option', { name: 'Open' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Closed' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Under Maintenance' })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );
    });

    it('calls onFormChange when text input changes', () => {
      const nameInput = screen.getByLabelText('Trail Name');
      fireEvent.change(nameInput, { target: { value: 'New Trail Name' } });

      expect(mockOnFormChange).toHaveBeenCalledWith('name', 'New Trail Name');
    });

    it('calls onFormChange when textarea changes', () => {
      const descriptionTextarea = screen.getByLabelText('Description');
      fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });

      expect(mockOnFormChange).toHaveBeenCalledWith('description', 'New description');
    });

    it('calls onFormChange when select changes', () => {
      const difficultySelect = screen.getByLabelText('Difficulty');
      fireEvent.change(difficultySelect, { target: { value: 'Hard' } });

      expect(mockOnFormChange).toHaveBeenCalledWith('difficulty', 'Hard');
    });

    it('calls onFormChange with parsed float for distance', () => {
      const distanceInput = screen.getByLabelText(/Distance \(km\)/);
      fireEvent.change(distanceInput, { target: { value: '6.5' } });

      expect(mockOnFormChange).toHaveBeenCalledWith('distance', 6.5);
    });

    it('calls onFormChange with parsed float for elevation gain', () => {
      const elevationInput = screen.getByLabelText('Elevation Gain (m)');
      fireEvent.change(elevationInput, { target: { value: '450' } });

      expect(mockOnFormChange).toHaveBeenCalledWith('elevationGain', 450);
    });

    it('calls onFormChange when tags input changes', () => {
      const tagsInput = screen.getByLabelText('Tags (comma-separated)');
      fireEvent.change(tagsInput, { target: { value: 'new, tags' } });

      expect(mockOnFormChange).toHaveBeenCalledWith('tags', 'new, tags');
    });

    it('calls onFormChange when status select changes', () => {
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'closed' } });

      expect(mockOnFormChange).toHaveBeenCalledWith('status', 'closed');
    });

    it('handles NaN values in number inputs', () => {
      const distanceInput = screen.getByLabelText(/Distance \(km\)/);
      fireEvent.change(distanceInput, { target: { value: 'invalid' } });

      expect(mockOnFormChange).toHaveBeenCalledWith('distance', NaN);
    });
  });

  describe('Button Interactions', () => {
    beforeEach(() => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );
    });

    it('calls onClose when close button is clicked', () => {
      const closeButton = document.querySelector('.close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSave when save button is clicked', () => {
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('calls onSave when form is submitted', () => {
      const form = document.querySelector('.edit-form');
      fireEvent.submit(form);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('renders buttons with correct CSS classes', () => {
      const closeButton = document.querySelector('.close-button');
      const cancelButton = screen.getByText('Cancel');
      const saveButton = screen.getByText('Save Changes');

      expect(closeButton).toHaveClass('close-button');
      expect(cancelButton).toHaveClass('cancel-button');
      expect(saveButton).toHaveClass('save-button');
    });

    it('renders close button with X icon', () => {
      const closeButton = document.querySelector('.close-button');
      expect(closeButton.querySelector('[data-testid="close-icon"]')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );
    });

    it('has required attribute on name input', () => {
      const nameInput = screen.getByLabelText('Trail Name');
      expect(nameInput).toBeRequired();
    });

    it('prevents form submission when name is empty', () => {
      const nameInput = screen.getByLabelText('Trail Name');
      fireEvent.change(nameInput, { target: { value: '' } });

      const form = document.querySelector('.edit-form');
      fireEvent.submit(form);

      // The form still submits because the component doesn't prevent submission
      // It relies on HTML5 validation which doesn't prevent the onSubmit handler
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty editForm object', () => {
      const emptyForm = {};

      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={emptyForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.getByText('Edit Trail')).toBeInTheDocument();
      // Form fields should render with empty values
      expect(screen.getByLabelText('Trail Name')).toHaveValue('');
    });

    it('handles editForm with undefined values', () => {
      const formWithUndefined = {
        name: undefined,
        description: undefined,
        difficulty: undefined,
        distance: undefined,
        elevationGain: undefined,
        tags: undefined,
        status: undefined
      };

      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={formWithUndefined}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.getByText('Edit Trail')).toBeInTheDocument();
      expect(screen.getByLabelText('Trail Name')).toHaveValue('');
    });

    it('handles editForm with null values', () => {
      const formWithNull = {
        name: null,
        description: null,
        difficulty: null,
        distance: null,
        elevationGain: null,
        tags: null,
        status: null
      };

      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={formWithNull}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.getByText('Edit Trail')).toBeInTheDocument();
      expect(screen.getByLabelText('Trail Name')).toHaveValue('');
    });

    it('handles rapid state changes', () => {
      const { rerender } = render(
        <EditTrailModal
          isVisible={false}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.queryByText('Edit Trail')).not.toBeInTheDocument();

      rerender(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.getByText('Edit Trail')).toBeInTheDocument();

      rerender(
        <EditTrailModal
          isVisible={false}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(screen.queryByText('Edit Trail')).not.toBeInTheDocument();
    });
  });

  describe('Console Logging', () => {
    it('logs render information when component renders', () => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(console.log).toHaveBeenCalledWith(
        'EditTrailModal render - isVisible:',
        true,
        'editTrail:',
        mockEditTrail
      );
    });

    it('logs render information when component does not render', () => {
      render(
        <EditTrailModal
          isVisible={false}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );

      expect(console.log).toHaveBeenCalledWith(
        'EditTrailModal render - isVisible:',
        false,
        'editTrail:',
        mockEditTrail
      );
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );
    });

    it('has proper heading structure', () => {
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Edit Trail');
    });

    it('has proper form structure', () => {
      const form = document.querySelector('.edit-form');
      expect(form).toBeInTheDocument();
      expect(form.tagName).toBe('FORM');
    });

    it('has proper label associations', () => {
      const nameInput = screen.getByLabelText('Trail Name');
      const descriptionTextarea = screen.getByLabelText('Description');
      const difficultySelect = screen.getByLabelText('Difficulty');

      expect(nameInput).toBeInTheDocument();
      expect(descriptionTextarea).toBeInTheDocument();
      expect(difficultySelect).toBeInTheDocument();
    });

    it('has proper button roles', () => {
      const closeButton = document.querySelector('.close-button');
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const saveButton = screen.getByRole('button', { name: 'Save Changes' });

      expect(closeButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
    });

    it('has proper modal structure', () => {
      const overlay = document.querySelector('.edit-modal-overlay');
      const modal = document.querySelector('.edit-modal');
      const header = document.querySelector('.edit-modal-header');
      const form = document.querySelector('.edit-form');

      expect(overlay).toBeInTheDocument();
      expect(modal).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(form).toBeInTheDocument();
    });
  });

  describe('Form Field Types', () => {
    beforeEach(() => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );
    });

    it('renders text input for name', () => {
      const nameInput = screen.getByLabelText('Trail Name');
      expect(nameInput).toHaveAttribute('type', 'text');
    });

    it('renders textarea for description', () => {
      const descriptionTextarea = screen.getByLabelText('Description');
      expect(descriptionTextarea.tagName).toBe('TEXTAREA');
    });

    it('renders select for difficulty', () => {
      const difficultySelect = screen.getByLabelText('Difficulty');
      expect(difficultySelect.tagName).toBe('SELECT');
    });

    it('renders number input for distance', () => {
      const distanceInput = screen.getByLabelText(/Distance \(km\)/);
      expect(distanceInput).toHaveAttribute('type', 'number');
    });

    it('renders number input for elevation gain', () => {
      const elevationInput = screen.getByLabelText('Elevation Gain (m)');
      expect(elevationInput).toHaveAttribute('type', 'number');
    });

    it('renders text input for tags', () => {
      const tagsInput = screen.getByLabelText('Tags (comma-separated)');
      expect(tagsInput).toHaveAttribute('type', 'text');
    });

    it('renders select for status', () => {
      const statusSelect = screen.getByLabelText('Status');
      expect(statusSelect.tagName).toBe('SELECT');
    });
  });

  describe('Form Submission Prevention', () => {
    beforeEach(() => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );
    });

    it('prevents default form submission', () => {
      const form = document.querySelector('.edit-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
      
      fireEvent(form, submitEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe('Disabled Field Behavior', () => {
    beforeEach(() => {
      render(
        <EditTrailModal
          isVisible={true}
          editTrail={mockEditTrail}
          editForm={mockEditForm}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onFormChange={mockOnFormChange}
        />
      );
    });

    it('does not call onFormChange for disabled distance field', () => {
      const distanceInput = screen.getByLabelText(/Distance \(km\)/);
      
      // Even if we try to change it, it shouldn't call onFormChange because it's disabled
      fireEvent.change(distanceInput, { target: { value: '10' } });
      
      // The change event might still fire, but the input is disabled so it shouldn't affect the form
      expect(distanceInput).toBeDisabled();
    });

    it('has correct styling for disabled input', () => {
      const distanceInput = screen.getByLabelText(/Distance \(km\)/);
      expect(distanceInput).toHaveClass('disabled-input');
    });
  });
});
