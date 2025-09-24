import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapControls from '../components/trails/MapControls';

describe('MapControls', () => {
  const defaultProps = {
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onResetNorth: jest.fn(),
    onRecenter: jest.fn(),
    onFindLocation: jest.fn(),
    mapBearing: 0,
    mapPitch: 0,
    mapCenter: [0, 0],
    userLocation: [0, 0],
    needsRecenter: false,
    showFindLocation: false,
    isLoadingLocation: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders zoom in and zoom out buttons and calls handlers', () => {
    render(<MapControls {...defaultProps} />);
    const zoomInBtn = screen.getByTitle('Zoom In');
    const zoomOutBtn = screen.getByTitle('Zoom Out');
    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    expect(defaultProps.onZoomIn).toHaveBeenCalled();
    expect(defaultProps.onZoomOut).toHaveBeenCalled();
  });

  it('renders Reset North button when mapBearing or mapPitch is not 0', () => {
    render(<MapControls {...defaultProps} mapBearing={10} />);
    const resetNorthBtn = screen.getByTitle('Reset North');
    expect(resetNorthBtn).toBeInTheDocument();
    fireEvent.click(resetNorthBtn);
    expect(defaultProps.onResetNorth).toHaveBeenCalled();
  });

  it('does not render Reset North button when mapBearing and mapPitch are 0', () => {
    render(<MapControls {...defaultProps} />);
    expect(screen.queryByTitle('Reset North')).not.toBeInTheDocument();
  });

  it('renders Recenter button when needsRecenter is true', () => {
    render(<MapControls {...defaultProps} needsRecenter={true} />);
    const recenterBtn = screen.getByTitle('Recenter on Location');
    expect(recenterBtn).toBeInTheDocument();
    fireEvent.click(recenterBtn);
    expect(defaultProps.onRecenter).toHaveBeenCalled();
  });

  it('does not render Recenter button when needsRecenter is false', () => {
    render(<MapControls {...defaultProps} />);
    expect(screen.queryByTitle('Recenter on Location')).not.toBeInTheDocument();
  });

  it('renders Find Location button when showFindLocation is true and not loading', () => {
    render(<MapControls {...defaultProps} showFindLocation={true} />);
    const findLocationBtn = screen.getByTitle('Find My Location');
    expect(findLocationBtn).toBeInTheDocument();
    expect(findLocationBtn).not.toBeDisabled();
    fireEvent.click(findLocationBtn);
    expect(defaultProps.onFindLocation).toHaveBeenCalled();
    // Should show User icon
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('renders Find Location button with loader when isLoadingLocation is true', () => {
    render(<MapControls {...defaultProps} showFindLocation={true} isLoadingLocation={true} />);
    const findLocationBtn = screen.getByTitle('Finding Location...');
    expect(findLocationBtn).toBeInTheDocument();
    expect(findLocationBtn).toBeDisabled();
    // Should show Loader2 icon
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('does not render Find Location button when showFindLocation is false', () => {
    render(<MapControls {...defaultProps} showFindLocation={false} />);
    expect(screen.queryByTitle('Find My Location')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Finding Location...')).not.toBeInTheDocument();
  });
});

// Patch for icons to add testId for coverage
jest.mock('lucide-react', () => {
  const original = jest.requireActual('lucide-react');
  return {
    ...original,
    User: (props) => <svg data-testid="user-icon" {...props} />,
    Loader2: (props) => <svg data-testid="loader-icon" {...props} />,
    Plus: (props) => <svg {...props} />,
    Minus: (props) => <svg {...props} />,
    Compass: (props) => <svg {...props} />,
    MapPin: (props) => <svg {...props} />,
  };
});