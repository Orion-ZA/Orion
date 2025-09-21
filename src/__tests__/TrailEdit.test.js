import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrailEdit from '../components/trails/TrailEdit';

// Mock Firebase and utils
jest.mock('../firebaseConfig', () => ({
  storage: {},
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://mocked.url/image.jpg')),
}));
jest.mock('../components/trails/TrailUtils', () => ({
  calculateRouteDistance: jest.fn(() => 1.23),
  formatFileSize: jest.fn(() => '1 MB'),
}));

const editTrailData = {
  id: 'trail-1',
  name: 'Test Trail',
  description: 'A nice trail',
  difficulty: 'Easy',
  distance: 2.5,
  elevationGain: 100,
  tags: ['forest', 'lake'],
  photos: ['https://img.com/1.jpg'],
  gpsRoute: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }],
  status: 'active',
};

const selectedLocation = {
  latitude: 12.3456,
  longitude: 65.4321,
  name: 'Trailhead',
};

const submitStatus = { type: '', message: '' };

describe('TrailEdit', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TrailEdit isOpen={false} editTrailData={editTrailData} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders form with pre-filled data when isOpen is true', () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        submitStatus={submitStatus}
      />
    );
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
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        onClose={onClose}
        selectedLocation={selectedLocation}
        submitStatus={submitStatus}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '' })); // Close button has no accessible name
    expect(onClose).toHaveBeenCalled();
  });

  it('adds and removes tags', () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        submitStatus={submitStatus}
      />
    );
    const tagInput = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(tagInput, { target: { value: 'river' } });
    fireEvent.click(screen.getAllByRole('button', { name: '' })[1]); // Plus icon button
    expect(screen.getByText('river')).toBeInTheDocument();

    // Remove tag
    const removeBtns = screen.getAllByRole('button', { name: '' }).filter(btn => btn.className.includes('tag-remove'));
    fireEvent.click(removeBtns[0]);
    expect(screen.queryByText('forest')).not.toBeInTheDocument();
  });

  it('handles image upload and removal', async () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        submitStatus={submitStatus}
      />
    );
    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg', size: 1024 });
    const input = screen.getByLabelText(/Add More Photos/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
      expect(screen.getByText('1 MB')).toBeInTheDocument();
    });

    // Remove new image
    const removeNewBtn = screen.getAllByTitle('Remove new image')[0];
    fireEvent.click(removeNewBtn);
    expect(screen.queryByText('photo.jpg')).not.toBeInTheDocument();
  });

  it('removes existing image', () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        submitStatus={submitStatus}
      />
    );
    const removeExistingBtn = screen.getByTitle('Remove existing image');
    fireEvent.click(removeExistingBtn);
    expect(screen.queryByText('Existing Photo 1')).not.toBeInTheDocument();
  });

  it('shows no images notice if no existing images', () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={{ ...editTrailData, photos: [] }}
        selectedLocation={selectedLocation}
        submitStatus={submitStatus}
      />
    );
    expect(screen.getByText(/No photos currently uploaded/)).toBeInTheDocument();
  });

  it('shows drawing controls and handles drawing', () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        submitStatus={submitStatus}
      />
    );
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

  it('handles undo/redo/clear route buttons', () => {
    window.confirm = jest.fn(() => true); // Always confirm
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        submitStatus={submitStatus}
      />
    );
    // Undo
    const undoBtn = screen.getByTitle('Undo last point');
    fireEvent.click(undoBtn);
    // Redo
    const redoBtn = screen.getByTitle('Redo last undone point');
    fireEvent.click(redoBtn);
    // Clear
    const clearBtn = screen.getByText('Clear');
    fireEvent.click(clearBtn);
    expect(window.confirm).toHaveBeenCalled();
  });

  it('shows auto-calculated indicator for distance', () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        submitStatus={submitStatus}
      />
    );
    expect(screen.getByTitle('Auto-calculated from route')).toBeInTheDocument();
  });

  it('shows submit status message', () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        submitStatus={{ type: 'success', message: 'Trail updated!' }}
      />
    );
    expect(screen.getByText('Trail updated!')).toBeInTheDocument();
    expect(screen.getByTestId('check-circle')).toBeInTheDocument();
  });

  it('disables submit button when required fields are missing', () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={null}
        submitStatus={submitStatus}
      />
    );
    const submitBtn = screen.getByRole('button', { name: /Update Trail/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows loading indicator when submitting', () => {
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        isSubmitting={true}
        submitStatus={submitStatus}
      />
    );
    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    render(
      <TrailEdit
        isOpen={true}
        editTrailData={editTrailData}
        selectedLocation={selectedLocation}
        onSubmit={onSubmit}
        submitStatus={submitStatus}
      />
    );
    const submitBtn = screen.getByRole('button', { name: /Update Trail/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
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