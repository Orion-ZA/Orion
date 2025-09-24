import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import TrailSubmission from '../components/trails/TrailSubmission';

// Mock stylesheet import used by the component (avoids Jest CSS parsing errors)
// Important: match the exact specifier used inside the component ('./TrailSubmission.css')
jest.mock('../components/trails/TrailSubmission.css', () => ({}), { virtual: true });
jest.mock('./TrailSubmission.css', () => ({}), { virtual: true });

// Mock icon library to avoid SVG noise and focus on behavior
jest.mock('lucide-react', () => new Proxy({}, {
  get: () => () => null
}));

// Mock Firebase storage APIs used in the component
jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/image.jpg'))
}));

// Mock the storage export so ref() call receives something
jest.mock('../firebaseConfig', () => ({
  storage: {}
}));

// JSDOM URL API shims
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob://mock');
  global.URL.revokeObjectURL = jest.fn();
});

const renderComponent = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(() => Promise.resolve()),
    isSubmitting: false,
    submitStatus: {},
    selectedLocation: { latitude: -33.9249, longitude: 18.4241, name: 'Cape Town' },
    onLocationSelect: jest.fn(),
    onRouteUpdate: jest.fn()
  };
  return render(React.createElement(TrailSubmission, { ...defaultProps, ...props }));
};

describe('TrailSubmission', () => {
  test('renders nothing when closed', () => {
    renderComponent({ isOpen: false });
    expect(screen.queryByText('Submit New Trail')).not.toBeInTheDocument();
  });

  test('renders header and location when open', () => {
    renderComponent();
    expect(screen.getByText('Submit New Trail')).toBeInTheDocument();
    expect(screen.getByText(/Location selected/)).toBeInTheDocument();
  });

  test('validates required fields and enables submit when filled', async () => {
    renderComponent();

    const submitBtn = screen.getByRole('button', { name: /submit trail/i });
    expect(submitBtn).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/Trail Name/i), 'Lion\'s Head');
    await userEvent.selectOptions(screen.getByLabelText(/Difficulty/i), 'Moderate');
    await userEvent.clear(screen.getByLabelText(/Distance \(km\)/i));
    await userEvent.type(screen.getByLabelText(/Distance \(km\)/i), '5.5');

    expect(submitBtn).toBeEnabled();
  });

  test('adds and removes tags', async () => {
    renderComponent();

    const tagInput = screen.getByLabelText(/Tags/i);
    await userEvent.type(tagInput, 'scenic');
    // Click the "+" add tag button by its class since it has no accessible name
    const addButtons = screen.getAllByRole('button');
    const addTagBtn = addButtons.find(btn => btn.className.includes('tag-add-btn'));
    expect(addTagBtn).toBeTruthy();
    await userEvent.click(addTagBtn);
    expect(screen.getByText('scenic')).toBeInTheDocument();

    // Remove tag
    const removeButtons = screen.getAllByRole('button');
    const removeTagBtn = removeButtons.find(btn => btn.className.includes('tag-remove'));
    expect(removeTagBtn).toBeTruthy();
    await userEvent.click(removeTagBtn);
    expect(screen.queryByText('scenic')).not.toBeInTheDocument();
  });

  test('uploads images, shows previews and allows removal', async () => {
    renderComponent();

    const file = new File([new ArrayBuffer(10)], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Photos/i, { selector: 'input[type="file"]' });

    await waitFor(() => expect(input).toBeInTheDocument());
    await userEvent.upload(input, [file]);

    expect(screen.getByText(/1 file selected/)).toBeInTheDocument();

    // Remove the image via the remove button in preview
    const removeButtons = screen.getAllByRole('button');
    const removeImageBtn = removeButtons.find(btn => btn.className.includes('remove-image-btn'));
    expect(removeImageBtn).toBeTruthy();
    await userEvent.click(removeImageBtn);

    expect(screen.getByText(/0 files selected/)).toBeInTheDocument();
  });

  test('does not submit when required fields missing (validation early return)', async () => {
    const onSubmit = jest.fn();
    renderComponent({ onSubmit, selectedLocation: null });

    const submitBtn = screen.getByRole('button', { name: /submit trail/i });
    expect(submitBtn).toBeDisabled();
    await userEvent.click(submitBtn);
    // Force submit event to hit validation early return path
    const form = submitBtn.closest('form');
    fireEvent.submit(form);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('start/stop drawing and auto-calculates distance when route changes', async () => {
    let latestRouteApi = null;
    const onRouteUpdate = jest.fn((points, api) => {
      latestRouteApi = api;
    });

    renderComponent({ onRouteUpdate });

    // Start drawing
    const startBtn = screen.getByRole('button', { name: /start drawing/i });
    await userEvent.click(startBtn);

    // add two points via exposed api
    expect(latestRouteApi).toBeTruthy();
    await act(async () => {
      latestRouteApi.addRoutePoint(18.4241, -33.9249);
    });
    await act(async () => {
      latestRouteApi.addRoutePoint(18.4250, -33.9255);
    });

    // distance input becomes readOnly and shows a value
    const distanceInput = screen.getByLabelText(/Distance \(km\)/i);
    await waitFor(() => expect(distanceInput).toHaveAttribute('readonly'));
    expect(distanceInput.value).not.toBe('');

    // Stop drawing
    const stopBtn = screen.getByRole('button', { name: /stop drawing/i });
    await userEvent.click(stopBtn);
  });

  test('submits includes gpsRoute when points drawn', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    let api = null;
    renderComponent({ onSubmit, onRouteUpdate: (pts, a) => { api = a; } });

    await userEvent.type(screen.getByLabelText(/Trail Name/i), 'Route Trail');
    await userEvent.selectOptions(screen.getByLabelText(/Difficulty/i), 'Easy');
    const distanceInput = screen.getByLabelText(/Distance \(km\)/i);
    await userEvent.clear(distanceInput);
    await userEvent.type(distanceInput, '1.0');

    // start drawing to enable point additions
    await userEvent.click(screen.getByRole('button', { name: /start drawing/i }));
    expect(api).toBeTruthy();
    await act(async () => { api.addRoutePoint(18.1, -33.1); });
    await act(async () => { api.addRoutePoint(18.2, -33.2); });

    await userEvent.click(screen.getByRole('button', { name: /submit trail/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(Array.isArray(payload.gpsRoute)).toBe(true);
    expect(payload.gpsRoute.length).toBeGreaterThanOrEqual(2);
    expect(payload.gpsRoute[0]).toHaveProperty('lat');
    expect(payload.gpsRoute[0]).toHaveProperty('lng');
  });

  test('clear, undo, and redo route update points and notify parent', async () => {
    const onRouteUpdate = jest.fn();
    let latestApi = null;
    renderComponent({ onRouteUpdate: (pts, api) => { latestApi = api; onRouteUpdate(pts, api); } });

    await userEvent.click(screen.getByRole('button', { name: /start drawing/i }));
    await act(async () => { latestApi.addRoutePoint(1, 1); });
    await act(async () => { latestApi.addRoutePoint(2, 2); });
    await act(async () => { latestApi.addRoutePoint(3, 3); });

    // wait for undo to appear (buttons render when there are points)
    const undoBtn = await screen.findByTitle('Undo last point');
    await userEvent.click(undoBtn);
    await userEvent.click(undoBtn);
    // Redo once
    const redoBtn = await screen.findByTitle('Redo last undone point');
    await userEvent.click(redoBtn);

    // Clear route should call onRouteUpdate with []
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearBtn);
    const lastCall = onRouteUpdate.mock.calls.at(-1);
    expect(lastCall[0]).toEqual([]);
  });

  test('updates elevation input to cover onChange branch', async () => {
    renderComponent();
    const elevationInput = screen.getByLabelText(/Elevation Gain \(m\)/i);
    await userEvent.clear(elevationInput);
    await userEvent.type(elevationInput, '250');
    expect(elevationInput).toHaveValue(250);
  });

  test('submits with uploaded images and calls onSubmit payload', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    const storage = require('firebase/storage');
    storage.getDownloadURL.mockResolvedValue('https://example.com/image.jpg');
    renderComponent({ onSubmit });

    await userEvent.type(screen.getByLabelText(/Trail Name/i), 'Table Mountain');
    await userEvent.selectOptions(screen.getByLabelText(/Difficulty/i), 'Hard');
    await userEvent.clear(screen.getByLabelText(/Distance \(km\)/i));
    await userEvent.type(screen.getByLabelText(/Distance \(km\)/i), '12.3');

    const file = new File([new ArrayBuffer(10)], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Photos/i, { selector: 'input[type="file"]' });
    await userEvent.upload(input, [file]);

    await userEvent.click(screen.getByRole('button', { name: /submit trail/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: 'Table Mountain',
      difficulty: 'Hard',
      distance: 12.3,
      elevationGain: 0,
      photos: ['https://example.com/image.jpg'],
      status: 'open',
      location: { lat: -33.9249, lng: 18.4241 },
      gpsRoute: []
    });
  });

  test('handles upload error path and logs error', async () => {
    const { uploadBytes } = require('firebase/storage');
    uploadBytes.mockRejectedValueOnce(new Error('upload failed'));
    const onSubmit = jest.fn(() => Promise.resolve());
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderComponent({ onSubmit });
    await userEvent.type(screen.getByLabelText(/Trail Name/i), 'Error Trail');
    await userEvent.selectOptions(screen.getByLabelText(/Difficulty/i), 'Moderate');
    await userEvent.clear(screen.getByLabelText(/Distance \(km\)/i));
    await userEvent.type(screen.getByLabelText(/Distance \(km\)/i), '3');

    await userEvent.click(screen.getByRole('button', { name: /submit trail/i }));
    // onSubmit still called because error happens per image, but we didn't upload images, so no error.
    // Instead, add a file to trigger upload failure.
    const file = new File([new ArrayBuffer(10)], 'bad.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Photos/i, { selector: 'input[type="file"]' });
    await userEvent.upload(input, [file]);
    await userEvent.click(screen.getByRole('button', { name: /submit trail/i }));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    spy.mockRestore();
  });

  test('updates text inputs and adds tag via Enter key', async () => {
    renderComponent();
    await userEvent.type(screen.getByLabelText(/Place Name/i), 'Cape Town CBD');
    await userEvent.type(screen.getByLabelText(/Description/i), 'A lovely route');
    const tagInput = screen.getByLabelText(/Tags/i);
    await userEvent.type(tagInput, 'coastal');
    // Press Enter to add tag
    await userEvent.type(tagInput, '{enter}');
    expect(screen.getByText('coastal')).toBeInTheDocument();
  });

  test('resets form when closed', async () => {
    const { rerender } = renderComponent();
    const nameInput = screen.getByLabelText(/Trail Name/i);
    await userEvent.type(nameInput, 'To Reset');
    expect(nameInput).toHaveValue('To Reset');

    rerender(React.createElement(TrailSubmission, {
      isOpen: false,
      onClose: jest.fn(),
      onSubmit: jest.fn(() => Promise.resolve()),
      isSubmitting: false,
      submitStatus: {},
      selectedLocation: { latitude: -33.9, longitude: 18.4 },
      onLocationSelect: jest.fn(),
      onRouteUpdate: jest.fn()
    }));

    // component unmounts when closed, so inputs disappear
    await waitFor(() => expect(screen.queryByLabelText(/Trail Name/i)).not.toBeInTheDocument());
  });
});


