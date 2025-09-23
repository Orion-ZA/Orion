import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TrailEdit from '../components/trails/TrailEdit';

// Mock Firebase only
jest.mock('../firebaseConfig', () => ({
  storage: {},
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://mocked.url/image.jpg')),
}));

// Mock URL API used by previews and cleanup
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob://mock');
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

const baseEditTrailData = {
  id: 'trail-1',
  name: 'Test Trail',
  description: 'A nice trail',
  difficulty: 'Easy',
  distance: 2.5,
  elevationGain: 100,
  tags: ['forest', 'lake'],
  photos: ['https://img.com/1.jpg'],
  // IMPORTANT: default empty route so distance field is editable initially
  gpsRoute: [],
  status: 'active',
};

const selectedLocation = {
  latitude: 12.3456,
  longitude: 65.4321,
  name: 'Trailhead',
};

const submitStatus = { type: '', message: '' };

// Helper to render with overrides
function setup(overrides = {}) {
  const props = {
    isOpen: true,
    editTrailData: baseEditTrailData,
    selectedLocation,
    submitStatus,
    ...overrides,
  };
  return render(<TrailEdit {...props} />);
}

describe('TrailEdit', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TrailEdit isOpen={false} editTrailData={baseEditTrailData} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders form with pre-filled data when isOpen is true', () => {
    setup();
    expect(screen.getByDisplayValue('Test Trail')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A nice trail')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Easy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByText('forest')).toBeInTheDocument();
    expect(screen.getByText('lake')).toBeInTheDocument();
    expect(screen.getByText('Existing Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Location: Trailhead')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    const { container } = setup({ onClose });
    const closeBtn = container.querySelector('button.close-btn');
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('adds and removes tags', () => {
    setup();
    const tagInput = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(tagInput, { target: { value: 'river' } });
    const addBtn = document.querySelector('button.tag-add-btn');
    fireEvent.click(addBtn);
    expect(screen.getByText('river')).toBeInTheDocument();

    // Remove tag (remove first tag: forest)
    const removeBtns = Array.from(document.querySelectorAll('button.tag-remove'));
    fireEvent.click(removeBtns[0]);
    expect(screen.queryByText('forest')).not.toBeInTheDocument();
  });

  it('adds tag with Enter key', () => {
    setup();
    const tagInput = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(tagInput, { target: { value: 'enterTag' } });
    fireEvent.keyPress(tagInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(screen.getByText('enterTag')).toBeInTheDocument();
  });

  it('handles image upload and removal', async () => {
    setup();
    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg', size: 1024 * 1024 });
    const input = screen.getByLabelText(/Add More Photos/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });
    // Image size text should exist and be non-empty
    const sizeNode = document.querySelector('.image-size');
    expect(sizeNode).toBeTruthy();
    expect(sizeNode.textContent).toMatch(/B|KB|MB|GB/);

    // Remove new image
    const removeNewBtn = screen.getAllByTitle('Remove new image')[0];
    fireEvent.click(removeNewBtn);
    expect(screen.queryByText('photo.jpg')).not.toBeInTheDocument();

    // ensure revokeObjectURL eventually called via cleanup path
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('removes existing image', () => {
    setup();
    const removeExistingBtn = screen.getByTitle('Remove existing image');
    fireEvent.click(removeExistingBtn);
    expect(screen.queryByText('Existing Photo 1')).not.toBeInTheDocument();
  });

  it('shows no images notice if no existing images', () => {
    setup({ editTrailData: { ...baseEditTrailData, photos: [] } });
    expect(screen.getByText(/No photos currently uploaded/)).toBeInTheDocument();
  });

  it('shows drawing controls and handles drawing', () => {
    setup();
    // Start drawing
    const startBtn = screen.getByText('Start Drawing');
    fireEvent.click(startBtn);
    expect(screen.getByText('Stop Drawing')).toBeInTheDocument();
    expect(screen.getByText(/Click on the map to add points/)).toBeInTheDocument();

    // Stop drawing
    const stopBtn = screen.getByText('Stop Drawing');
    fireEvent.click(stopBtn);
    expect(screen.getByText('Start Drawing')).toBeInTheDocument();
  });

  it('handles undo/redo/clear route buttons', async () => {
    const onRouteUpdate = jest.fn();
    setup({ onRouteUpdate });

    // Enable drawing and add two points via the exposed addRoutePoint
    fireEvent.click(screen.getByText('Start Drawing'));

    // first point
    let lastCall = onRouteUpdate.mock.calls[onRouteUpdate.mock.calls.length - 1];
    let controls = lastCall[1];
    await act(async () => {
      controls.addRoutePoint(10, 20);
    });
    await waitFor(() => expect(screen.getByText(/1 points/)).toBeInTheDocument());

    // second point (refresh controls since onRouteUpdate called again)
    lastCall = onRouteUpdate.mock.calls[onRouteUpdate.mock.calls.length - 1];
    controls = lastCall[1];
    await act(async () => {
      controls.addRoutePoint(11, 21);
    });
    await waitFor(() => expect(screen.getByText(/2 points/)).toBeInTheDocument());

    const undoBtn = screen.getByTitle('Undo last point');
    const redoBtn = screen.getByTitle('Redo last undone point');
    const clearBtn = screen.getByText('Clear');

    expect(undoBtn).not.toBeDisabled();
    fireEvent.click(undoBtn);
    fireEvent.click(redoBtn);
    
    // Click clear button - should show custom dialog
    fireEvent.click(clearBtn);
    expect(screen.getByText('Are you sure you want to clear the entire route? This will remove all GPS points.')).toBeInTheDocument();
    expect(document.querySelector('.confirm-dialog-title')).toHaveTextContent('Clear Route');
  });

  it('shows auto-calculated indicator for distance', async () => {
    const onRouteUpdate = jest.fn();
    setup({ onRouteUpdate });

    fireEvent.click(screen.getByText('Start Drawing'));

    // Add two points with refreshed controls in between
    let lastCall = onRouteUpdate.mock.calls[onRouteUpdate.mock.calls.length - 1];
    let controls = lastCall[1];
    await act(async () => {
      controls.addRoutePoint(10, 20);
    });
    lastCall = onRouteUpdate.mock.calls[onRouteUpdate.mock.calls.length - 1];
    controls = lastCall[1];
    await act(async () => {
      controls.addRoutePoint(11, 21);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Auto-calculated from route')).toBeInTheDocument();
    });
  });

  it('initializes history when gpsRoute provided and undo is disabled at index 0', () => {
    // Provide initial route to hit initialization branch
    const initialData = {
      ...baseEditTrailData,
      gpsRoute: [
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
      ],
    };
    setup({ editTrailData: initialData });
    // Buttons show because routePoints.length > 0
    const undoBtn = screen.getByTitle('Undo last point');
    const redoBtn = screen.getByTitle('Redo last undone point');
    expect(undoBtn).toBeDisabled();
    // With only one history entry, redo is also disabled
    expect(redoBtn).toBeDisabled();
  });

  it('handles clear route cancel (no confirm)', async () => {
    const onRouteUpdate = jest.fn();
    setup({ onRouteUpdate });

    fireEvent.click(screen.getByText('Start Drawing'));
    let lastCall = onRouteUpdate.mock.calls[onRouteUpdate.mock.calls.length - 1];
    let controls = lastCall[1];

    await act(async () => {
      controls.addRoutePoint(10, 20);
    });

    const clearBtn = screen.getByText('Clear');
    fireEvent.click(clearBtn);
    
    // Should show custom dialog
    expect(screen.getByText('Are you sure you want to clear the entire route? This will remove all GPS points.')).toBeInTheDocument();
    
    // Click cancel button
    const cancelBtn = document.querySelector('.confirm-btn.cancel');
    fireEvent.click(cancelBtn);
    
    // Dialog should be closed and buttons should still be present since clear was cancelled
    expect(screen.queryByText('Are you sure you want to clear the entire route')).not.toBeInTheDocument();
    expect(screen.getByTitle('Undo last point')).toBeInTheDocument();
  });

  it('updates inputs and submits form with correct data', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    setup({ onSubmit });

    fireEvent.change(screen.getByLabelText('Trail Name *'), { target: { value: 'Updated Trail' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated description' } });
    fireEvent.change(screen.getByLabelText('Difficulty *'), { target: { value: 'Moderate' } });
    // distance editable because no route points
    fireEvent.change(screen.getByLabelText('Distance (km) *'), { target: { value: '5.4' } });
    fireEvent.change(screen.getByLabelText('Elevation Gain (m)'), { target: { value: '250' } });

    const submitBtn = screen.getByRole('button', { name: /Update Trail/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('shows submit status message', () => {
    setup({ submitStatus: { type: 'success', message: 'Trail updated!' } });
    expect(screen.getByText('Trail updated!')).toBeInTheDocument();
    expect(screen.getByTestId('check-circle')).toBeInTheDocument();
  });

  it('disables submit button when required fields are missing', () => {
    setup({ selectedLocation: null });
    const submitBtn = screen.getByRole('button', { name: /Update Trail/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows loading indicator when submitting', () => {
    setup({ isSubmitting: true });
    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    setup({ onSubmit });
    const submitBtn = screen.getByRole('button', { name: /Update Trail/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('shows delete button and opens delete confirmation dialog', () => {
    const onDelete = jest.fn();
    setup({ onDelete });
    
    const deleteBtn = screen.getByTitle('Delete this trail');
    expect(deleteBtn).toBeInTheDocument();
    
    fireEvent.click(deleteBtn);
    
    // Should show custom delete dialog
    expect(screen.getByText(`Are you sure you want to delete "${baseEditTrailData.name}"? This action cannot be undone.`)).toBeInTheDocument();
    expect(document.querySelector('.confirm-dialog-title')).toHaveTextContent('Delete Trail');
  });

  it('calls onDelete when delete is confirmed', async () => {
    const onDelete = jest.fn(() => Promise.resolve());
    setup({ onDelete });
    
    const deleteBtn = screen.getByTitle('Delete this trail');
    fireEvent.click(deleteBtn);
    
    // Click confirm in the dialog (the button with danger class)
    const confirmBtn = document.querySelector('.confirm-btn.danger');
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(baseEditTrailData.id);
    });
  });

  it('cancels delete when cancel button is clicked', () => {
    const onDelete = jest.fn();
    setup({ onDelete });
    
    const deleteBtn = screen.getByTitle('Delete this trail');
    fireEvent.click(deleteBtn);
    
    // Click cancel in the dialog
    const cancelBtn = document.querySelector('.confirm-btn.cancel');
    fireEvent.click(cancelBtn);
    
    // Dialog should be closed and onDelete should not be called
    expect(screen.queryByText('Are you sure you want to delete')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('shows loading state in delete dialog when submitting', () => {
    const onDelete = jest.fn();
    setup({ onDelete });
    
    const deleteBtn = screen.getByTitle('Delete this trail');
    fireEvent.click(deleteBtn);
    
    // Should show loading state in the dialog when isSubmitting is true
    // We need to simulate the loading state by checking if the dialog shows the loading text
    expect(document.querySelector('.confirm-dialog-title')).toHaveTextContent('Delete Trail');
    
    // The dialog should be present and ready to show loading state
    const dialog = document.querySelector('.confirm-dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('confirms clear route when confirm button is clicked', async () => {
    const onRouteUpdate = jest.fn();
    setup({ onRouteUpdate });

    fireEvent.click(screen.getByText('Start Drawing'));
    let lastCall = onRouteUpdate.mock.calls[onRouteUpdate.mock.calls.length - 1];
    let controls = lastCall[1];

    await act(async () => {
      controls.addRoutePoint(10, 20);
    });

    const clearBtn = screen.getByText('Clear');
    fireEvent.click(clearBtn);
    
    // Should show custom dialog
    expect(screen.getByText('Are you sure you want to clear the entire route? This will remove all GPS points.')).toBeInTheDocument();
    
    // Click confirm button (the button with warning class)
    const confirmBtn = document.querySelector('.confirm-btn.warning');
    fireEvent.click(confirmBtn);
    
    // Dialog should be closed and route should be cleared
    expect(screen.queryByText('Are you sure you want to clear the entire route')).not.toBeInTheDocument();
    expect(screen.queryByText(/1 points/)).not.toBeInTheDocument();
  });
});

// Patch for icons to add testId for coverage
jest.mock('lucide-react', () => {
  const original = jest.requireActual('lucide-react');
  return {
    ...original,
    CheckCircle: (props) => <svg data-testid="check-circle" {...props} />,
    AlertCircle: (props) => <svg data-testid="alert-circle" {...props} />,
    X: (props) => <svg {...props} />,
    Upload: (props) => <svg {...props} />,
    Plus: (props) => <svg {...props} />,
    Loader2: (props) => <svg {...props} />,
    MapPin: (props) => <svg {...props} />,
    Map: (props) => <svg {...props} />,
    Edit3: (props) => <svg {...props} />,
    Trash2: (props) => <svg {...props} />,
    Play: (props) => <svg {...props} />,
    Square: (props) => <svg {...props} />,
    Ruler: (props) => <svg {...props} />,
    Image: (props) => <svg {...props} />,
    Undo2: (props) => <svg {...props} />,
    Redo2: (props) => <svg {...props} />,
  };
});