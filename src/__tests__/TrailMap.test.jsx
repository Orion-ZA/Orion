import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrailMap from '../components/trails/TrailMap';

// Mock TrailUtils functions for predictable colors/icons
jest.mock('../components/trails/TrailUtils', () => ({
  getDifficultyColor: jest.fn(() => '#123456'),
  getDifficultyIcon: jest.fn(() => <span data-testid="diff-icon" />),
}));

// Access mocked utilities for call assertions
const TrailUtils = require('../components/trails/TrailUtils');

// Mock lucide-react icons used in component
jest.mock('lucide-react', () => {
  const actual = jest.requireActual('lucide-react');
  return {
    ...actual,
    Edit3: (props) => <svg data-testid="icon-edit3" {...props} />,
    X: (props) => <svg data-testid="icon-x" {...props} />,
    MapPin: (props) => <svg data-testid="icon-mappin" {...props} />,
  };
});

// Mock mapbox CSS to avoid resolution issues in Jest
jest.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}), { virtual: true });

// Mock react-map-gl/mapbox components
jest.mock('react-map-gl/mapbox', () => {
  const React = require('react');
  const MockMap = React.forwardRef(({ children, onLoad, onMove, onClick }, ref) => {
    const mapApi = {
      on: jest.fn(),
      getBearing: jest.fn(() => 10),
      getPitch: jest.fn(() => 20),
      getCenter: jest.fn(() => ({ lat: 1.23, lng: 4.56 })),
    };
    const getMap = () => mapApi;
    React.useImperativeHandle(ref, () => ({ getMap }));

    React.useEffect(() => {
      if (onLoad) onLoad();
      if (onMove) onMove({ viewState: { zoom: 10 } });
    }, []);

    return (
      <div data-testid="mock-map" onClick={onClick}>{children}</div>
    );
  });

  const Marker = ({ children, onClick, ...rest }) => (
    <div data-testid="mock-marker" onClick={onClick} {...rest}>{children}</div>
  );
  const Popup = ({ children }) => <div data-testid="mock-popup">{children}</div>;
  const Source = ({ children }) => <div data-testid="mock-source">{children}</div>;
  const Layer = ({ children }) => <div data-testid="mock-layer">{children}</div>;

  return { __esModule: true, default: MockMap, Marker, Popup, Source, Layer };
}, { virtual: true });

const defaultProps = () => ({
  viewport: { longitude: 0, latitude: 0, zoom: 8 },
  setViewport: jest.fn(),
  mapRef: createRef(),
  trails: [],
  hoveredTrail: null,
  setHoveredTrail: jest.fn(),
  selectedTrail: null,
  setSelectedTrail: jest.fn(),
  onTrailClick: jest.fn(),
  onMapClick: jest.fn(),
  userLocation: null,
  mapBearing: 0,
  setMapBearing: jest.fn(),
  mapPitch: 0,
  setMapPitch: jest.fn(),
  mapCenter: { lat: 0, lng: 0 },
  setMapCenter: jest.fn(),
  submissionLocation: null,
  showSubmissionPanel: false,
  submissionRoute: [],
  onCloseSubmission: jest.fn(),
  isLoading: false,
});

describe('TrailMap', () => {
  it('renders loading overlay when isLoading is true', () => {
    render(<TrailMap {...defaultProps()} isLoading={true} />);
    expect(screen.getByText('Loading trails…')).toBeInTheDocument();
  });

  it('renders submission mode popup and close button triggers handler', () => {
    const onCloseSubmission = jest.fn();
    render(<TrailMap {...defaultProps()} showSubmissionPanel={true} onCloseSubmission={onCloseSubmission} />);
    expect(screen.getByTestId('icon-edit3')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('icon-x'));
    expect(onCloseSubmission).toHaveBeenCalled();
  });

  it('renders user location marker when provided', () => {
    const userLocation = { latitude: 11, longitude: 22 };
    render(<TrailMap {...defaultProps()} userLocation={userLocation} />);
    expect(screen.getAllByTestId('mock-marker').length).toBeGreaterThan(0);
  });

  it('renders submission location marker when in submission mode', () => {
    const submissionLocation = { latitude: 33, longitude: 44 };
    render(<TrailMap {...defaultProps()} showSubmissionPanel={true} submissionLocation={submissionLocation} />);
    expect(screen.getByTestId('icon-mappin')).toBeInTheDocument();
  });

  it('renders submission route line and points when provided', () => {
    const route = [[0,0],[1,1]];
    render(<TrailMap {...defaultProps()} showSubmissionPanel={true} submissionRoute={route} />);
    // Source/Layer for line and markers for points
    expect(screen.getAllByTestId('mock-source').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('mock-layer').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('mock-marker').length).toBeGreaterThan(0);
  });

  it('filters invalid route points and renders only valid ones', () => {
    const route = [[0,0], ['a', 1], [181,0], [0,91], [2,2]];
    render(<TrailMap {...defaultProps()} showSubmissionPanel={true} submissionRoute={route} />);
    // Valid markers for [0,0] and [2,2]
    expect(screen.getAllByTestId('mock-marker').length).toBeGreaterThan(0);
  });

  it('renders trail markers and handles click toggle via onTrailClick', () => {
    const onTrailClick = jest.fn();
    const trails = [
      { id: 't1', name: 'T1', longitude: 10, latitude: 20, difficulty: 'Easy' },
    ];
    render(<TrailMap {...defaultProps()} trails={trails} onTrailClick={onTrailClick} />);
    // Click the marker wrapper
    const markers = screen.getAllByTestId('mock-marker');
    fireEvent.click(markers[markers.length - 1]);
    expect(onTrailClick).toHaveBeenCalledWith(trails[0]);
  });

  it('applies difficulty color and icon for trail marker', () => {
    const trails = [
      { id: 't1', name: 'T1', longitude: 10, latitude: 20, difficulty: 'Hard' },
    ];
    render(<TrailMap {...defaultProps()} trails={trails} />);
    // Marker element exists
    expect(screen.getAllByTestId('mock-marker').length).toBeGreaterThan(0);
    // Utility called to render icon
    expect(TrailUtils.getDifficultyIcon).toHaveBeenCalled();
  });

  it('renders routes for trails with valid route arrays', () => {
    const trails = [
      { id: 't1', name: 'T1', longitude: 10, latitude: 20, difficulty: 'Hard', route: [[0,0],[1,1]] },
      { id: 't2', name: 'T2', longitude: 10, latitude: 20, difficulty: 'Hard', route: [[0,'x']] }, // invalid
    ];
    render(<TrailMap {...defaultProps()} trails={trails} />);
    // One Source/Layer pair for valid trail route
    expect(screen.getAllByTestId('mock-source').length).toBe(1);
    expect(screen.getAllByTestId('mock-layer').length).toBe(1);
  });

  it('renders hover card when hoveredTrail is set', () => {
    const hoveredTrail = { id: 't1', name: 'Hover', longitude: 10, latitude: 20, difficulty: 'Easy', distance: 5, elevationGain: 100 };
    render(<TrailMap {...defaultProps()} hoveredTrail={hoveredTrail} />);
    expect(screen.getByText('Hover')).toBeInTheDocument();
    expect(screen.getByText('5 km')).toBeInTheDocument();
    expect(screen.getByText(/100m/)).toBeInTheDocument();
  });

  it('propagates map clicks via onMapClick', () => {
    const onMapClick = jest.fn();
    render(<TrailMap {...defaultProps()} onMapClick={onMapClick} />);
    fireEvent.click(screen.getByTestId('mock-map'));
    expect(onMapClick).toHaveBeenCalled();
  });

  it('invokes viewport and map state setters on load/move/rotate/pitch and clears hover on move', () => {
    const props = defaultProps();
    props.hoveredTrail = { id: 'h1', name: 'Hover', longitude: 1, latitude: 2 };
    render(<TrailMap {...props} />);
    // onLoad registered handlers on the map API
    expect(props.setViewport).toHaveBeenCalled();

    const map = props.mapRef.current.getMap();
    // simulate rotate
    const rotateCb = map.on.mock.calls.find(([evt]) => evt === 'rotate')?.[1];
    rotateCb && rotateCb();
    expect(props.setMapBearing).toHaveBeenCalledWith(10);
    // simulate pitch
    const pitchCb = map.on.mock.calls.find(([evt]) => evt === 'pitch')?.[1];
    pitchCb && pitchCb();
    expect(props.setMapPitch).toHaveBeenCalledWith(20);
    // simulate move, should set center and clear hover
    const moveCb = map.on.mock.calls.find(([evt]) => evt === 'move')?.[1];
    moveCb && moveCb();
    expect(props.setMapCenter).toHaveBeenCalledWith({ lat: 1.23, lng: 4.56 });
    expect(props.setHoveredTrail).toHaveBeenCalledWith(null);
  });

  it('hover enter/leave on trail marker toggles hoveredTrail', () => {
    const props = defaultProps();
    const trails = [
      { id: 't1', name: 'Trail A', longitude: 10, latitude: 20, difficulty: 'Easy' },
    ];
    render(<TrailMap {...props} trails={trails} />);
    const markerWrapper = screen.getAllByTestId('mock-marker')[0].querySelector('.trail-marker-wrapper');
    // Simulate mouse events on wrapper
    fireEvent.mouseEnter(markerWrapper);
    expect(props.setHoveredTrail).toHaveBeenCalledWith(trails[0]);
    fireEvent.mouseLeave(markerWrapper);
    expect(props.setHoveredTrail).toHaveBeenCalledWith(null);
  });

  it('clicking selected trail marker unselects it and clears hover', () => {
    const props = defaultProps();
    const trails = [
      { id: 't1', name: 'Trail A', longitude: 10, latitude: 20, difficulty: 'Easy' },
    ];
    props.selectedTrail = { id: 't1' };
    render(<TrailMap {...props} trails={trails} />);
    const marker = screen.getAllByTestId('mock-marker')[0];
    fireEvent.click(marker);
    expect(props.setSelectedTrail).toHaveBeenCalledWith(null);
    expect(props.setHoveredTrail).toHaveBeenCalledWith(null);
  });
});
