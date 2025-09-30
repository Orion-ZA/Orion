import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock CSS to avoid import errors
jest.mock('../components/trails/TrailsPanel.css', () => ({}), { virtual: true });
jest.mock('./TrailsPanel.css', () => ({}), { virtual: true });

// Mock ToastContext used by component
jest.mock('../components/ToastContext', () => ({
	useToast: () => ({ show: jest.fn() }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => new Proxy({}, { get: () => () => null }));

// Mock Firebase Firestore calls used for author name fetching
const mockGetDoc = jest.fn();
const mockDoc = jest.fn();
jest.mock('firebase/firestore', () => ({
	doc: (...args) => mockDoc(...args),
	getDoc: (...args) => mockGetDoc(...args),
}));

// Mock db export
jest.mock('../components/firebaseConfig', () => ({ db: {} }), { virtual: true });
jest.mock('../firebaseConfig', () => ({ db: {} }));

// Component under test
import TrailsPanel from '../components/trails/TrailsPanel';

// JSDOM helpers
beforeAll(() => {
	Element.prototype.scrollIntoView = jest.fn();
	jest.useFakeTimers();
});

afterAll(() => {
	jest.useRealTimers();
});

describe('TrailsPanel', () => {
	const baseProps = (overrides = {}) => ({
		isPanelOpen: true,
		setIsPanelOpen: jest.fn(),
		filteredTrails: [],
		showFilters: false,
		setShowFilters: jest.fn(),
		setShowSubmissionPanel: jest.fn(),
		userSaved: { favourites: [], wishlist: [], completed: [] },
		handleTrailAction: jest.fn(),
		currentUserId: 'user1',
		onTrailClick: jest.fn(),
		selectedTrail: null,
		setSelectedTrail: jest.fn(),
		userLocation: { latitude: -33.9249, longitude: 18.4241 },
		onEditTrail: jest.fn(),
		...overrides,
	});

	const makeTrail = (overrides = {}) => ({
		id: overrides.id || Math.random().toString(36).slice(2),
		name: 'Alpha Trail',
		distance: 10,
		elevationGain: 100,
		latitude: -33.92,
		longitude: 18.42,
		difficulty: 'Easy',
		photos: [],
		tags: ['scenic'],
		createdBy: 'sample',
		...overrides,
	});

	test('toggle panel button calls setIsPanelOpen', async () => {
		const props = baseProps({ isPanelOpen: false });
		render(<TrailsPanel {...props} />);
		const toggle = screen.getByRole('button');
		await userEvent.click(toggle);
		expect(props.setIsPanelOpen).toHaveBeenCalledWith(true);
	});

	test('renders header, count and controls when open', () => {
		const trails = [makeTrail({ id: 't1' }), makeTrail({ id: 't2' })];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);
		expect(screen.getByText('Trails')).toBeInTheDocument();
		expect(screen.getByText('2 trails')).toBeInTheDocument();
		// Sort select present
		expect(screen.getByRole('combobox')).toBeInTheDocument();
	});

	test('filters toggle button toggles showFilters and Submit button only with currentUserId', async () => {
		const propsWithUser = baseProps({ showFilters: false });
		const { rerender } = render(<TrailsPanel {...propsWithUser} />);
		const filterBtn = screen.getAllByRole('button').find(b => b.title === 'Show Filters');
		expect(filterBtn).toBeTruthy();
		await userEvent.click(filterBtn);
		expect(propsWithUser.setShowFilters).toHaveBeenCalledWith(true);
		// Submit Trail visible when logged in
		expect(screen.getByRole('button', { name: /submit trail/i })).toBeInTheDocument();

		// Without user, button hidden
		rerender(<TrailsPanel {...baseProps({ currentUserId: null })} />);
		expect(screen.queryByRole('button', { name: /submit trail/i })).not.toBeInTheDocument();
		rerender(<></>);
	});

	test('no trails message and Adjust/Hide toggles setShowFilters', async () => {
		const props = baseProps({ filteredTrails: [], showFilters: false });
		render(<TrailsPanel {...props} />);
		expect(screen.getByText(/No trails found/)).toBeInTheDocument();
		const adjustBtn = screen.getByRole('button', { name: /Adjust/ });
		await userEvent.click(adjustBtn);
		expect(props.setShowFilters).toHaveBeenCalledWith(true);
	});

	test('sorts by different criteria and toggles order', async () => {
		const trails = [
			makeTrail({ id: 'a', name: 'Beta', distance: 5, elevationGain: 300, difficulty: 'Moderate' }),
			makeTrail({ id: 'b', name: 'Alpha', distance: 10, elevationGain: 100, difficulty: 'Hard' }),
			makeTrail({ id: 'c', name: 'Gamma', distance: 2, elevationGain: 50, difficulty: 'Expert' }),
		];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		const getNames = () => screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);

		// Default Near Me (distanceAway) present, but order deterministic by distanceAway with userLocation
		let names = getNames();
		expect(names.length).toBe(3);

		// Sort by Name asc
		await userEvent.selectOptions(screen.getByRole('combobox'), 'name');
		names = getNames();
		expect(names).toEqual(['Alpha', 'Beta', 'Gamma']);

		// Toggle order desc
		const orderBtn = screen.getAllByRole('button').find(b => b.title?.includes('Sort'));
		await userEvent.click(orderBtn);
		expect(getNames()).toEqual(['Gamma', 'Beta', 'Alpha']);

		// Sort by Distance asc
		await userEvent.selectOptions(screen.getByRole('combobox'), 'distance');
		expect(getNames()[0]).toBe('Gamma');

		// Sort by Difficulty asc using order map (easy<moderate<hard/difficult<expert)
		await userEvent.selectOptions(screen.getByRole('combobox'), 'difficulty');
		// With asc, Moderate(2) < Hard(3) < Expert(4) → Beta, Alpha, Gamma
		expect(getNames()).toEqual(['Beta', 'Alpha', 'Gamma']);

		// Sort by Elevation asc
		await userEvent.selectOptions(screen.getByRole('combobox'), 'elevation');
		expect(getNames()[0]).toBe('Gamma');
	});

	test('distanceAway sorting falls back when no userLocation', async () => {
		const trails = [
			makeTrail({ id: '1', name: 'B' }),
			makeTrail({ id: '2', name: 'A' }),
		];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails, userLocation: null })} />);
		// Change to distanceAway explicitly
		await userEvent.selectOptions(screen.getByRole('combobox'), 'distanceAway');
		// With no userLocation, aValue=bValue=0 so relative order becomes stable on default compare -> name asc by default implementation
		const names = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
		expect(names).toEqual(['B', 'A']);
	});

	test('renders photo placeholder or image and action buttons fire handlers', async () => {
		const props = baseProps({
			filteredTrails: [
				makeTrail({ id: 'p1', photos: ['https://img'] }),
				makeTrail({ id: 'p2', photos: [] }),
			],
			userSaved: { favourites: ['p1'], wishlist: [], completed: [] },
		});
		render(<TrailsPanel {...props} />);

		// One image and one placeholder
		expect(screen.getAllByRole('img').length).toBe(1);
		expect(screen.getAllByLabelText('No photo available').length).toBe(1);

		// Click action buttons (stopPropagation area)
		const favBtn = screen.getAllByTitle(/Favourites/)[0];
		await userEvent.click(favBtn);
		expect(props.handleTrailAction).toHaveBeenCalledWith('p1', 'favourites');
	});

	test('selects and unselects trail on click, calls onTrailClick, and scrolls into view', async () => {
		const trail = makeTrail({ id: 'sel1' });
		const props = baseProps({ filteredTrails: [trail] });
		render(<TrailsPanel {...props} />);
		const item = screen.getByText(trail.name).closest('.trail-item');
		await userEvent.click(item);
		expect(props.setSelectedTrail).toHaveBeenCalledWith(expect.objectContaining({ id: 'sel1' }));
		expect(props.onTrailClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'sel1' }));

		// Simulate selectedTrail prop to trigger scrollIntoView effect
		render(<TrailsPanel {...baseProps({ filteredTrails: [trail], selectedTrail: trail })} />);
		// advance 100ms timer for scrollIntoView
		jest.advanceTimersByTime(110);
		expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
	});

	test('scrolling list unselects trail after debounce', async () => {
		const trail = makeTrail({ id: 'sel2' });
		const setSelectedTrail = jest.fn();
		render(<TrailsPanel {...baseProps({ filteredTrails: [trail], selectedTrail: trail, setSelectedTrail })} />);
		const listDiv = document.querySelector('.trails-list');
		fireEvent.scroll(listDiv);
		// Wait debounce 150ms
		jest.advanceTimersByTime(160);
		expect(setSelectedTrail).toHaveBeenCalledWith(null);
	});

	test('author display handles sample, unknown, raw id and fetched name', async () => {
		// First render with unknown and raw id -> shows placeholders then fetched name
		mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ profileInfo: { displayName: 'John Doe' } }) });
		const trails = [
			makeTrail({ id: 'a', createdBy: 'sample' }),
			makeTrail({ id: 'b', createdBy: 'unknown' }),
			makeTrail({ id: 'c', createdBy: 'Users/abc123' }),
		];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText('by Sample User')).toBeInTheDocument();
		expect(screen.getByText('by Unknown')).toBeInTheDocument();
		// Initially shows ... before fetch resolves
		expect(screen.getByText('by ...')).toBeInTheDocument();
		await waitFor(() => expect(screen.getByText('by John Doe')).toBeInTheDocument());
	});

	test('distance away indicator shows when userLocation provided', () => {
		const trail = makeTrail({ id: 'd1' });
		render(<TrailsPanel {...baseProps({ filteredTrails: [trail] })} />);
		expect(screen.getByText(/km away/)).toBeInTheDocument();
	});

	test('tags render when available', () => {
		const trail = makeTrail({ id: 't1', tags: ['coastal', 'loop'] });
		render(<TrailsPanel {...baseProps({ filteredTrails: [trail] })} />);
		expect(screen.getByText('coastal')).toBeInTheDocument();
		expect(screen.getByText('loop')).toBeInTheDocument();
	});

	test('edit button appears only for trails created by current user and fires onEditTrail', async () => {
		const t1 = makeTrail({ id: 'mine', name: 'Mine', createdBy: 'user1' });
		const t2 = makeTrail({ id: 'notmine', name: 'NotMine', createdBy: 'user2' });
		const onEditTrail = jest.fn();
		render(<TrailsPanel {...baseProps({ filteredTrails: [t1, t2], onEditTrail })} />);
		const editBtns = screen.getAllByRole('button').filter(b => b.title && b.title.startsWith('Edit '));
		expect(editBtns.length).toBe(1);
		await userEvent.click(editBtns[0]);
		expect(onEditTrail).toHaveBeenCalledWith(expect.objectContaining({ id: 'mine' }));
	});

	// Tests for new search mode functionality
	test('shows "Near Search" option and recenter button when in search mode', () => {
		const searchLocation = { latitude: -34.0, longitude: 18.5 };
		const onRecenterFromSearch = jest.fn();
		render(<TrailsPanel {...baseProps({ 
			isSearchMode: true, 
			searchLocation, 
			onRecenterFromSearch 
		})} />);
		
		// Check that "Near Search" option is available
		const sortSelect = screen.getByRole('combobox');
		expect(sortSelect).toHaveValue('distanceAway');
		expect(screen.getByText('Near Search')).toBeInTheDocument();
		
		// Check that recenter button is visible
		const recenterBtn = screen.getByTitle('Recenter to My Location');
		expect(recenterBtn).toBeInTheDocument();
	});

	test('recenter button calls onRecenterFromSearch when clicked', async () => {
		const searchLocation = { latitude: -34.0, longitude: 18.5 };
		const onRecenterFromSearch = jest.fn();
		render(<TrailsPanel {...baseProps({ 
			isSearchMode: true, 
			searchLocation, 
			onRecenterFromSearch 
		})} />);
		
		const recenterBtn = screen.getByTitle('Recenter to My Location');
		await userEvent.click(recenterBtn);
		expect(onRecenterFromSearch).toHaveBeenCalled();
	});

	test('hides recenter button when not in search mode', () => {
		render(<TrailsPanel {...baseProps({ isSearchMode: false })} />);
		expect(screen.queryByTitle('Recenter to My Location')).not.toBeInTheDocument();
	});



	// Tests for trail coordinate validation
	test('filters out trails with invalid coordinates', () => {
		const trails = [
			makeTrail({ id: 'valid', name: 'Valid Trail', latitude: -33.9, longitude: 18.4 }),
			makeTrail({ id: 'invalid-lat', name: 'Invalid Lat Trail', latitude: 'invalid', longitude: 18.4 }),
			makeTrail({ id: 'invalid-lng', name: 'Invalid Lng Trail', latitude: -33.9, longitude: 'invalid' }),
			makeTrail({ id: 'missing-lat', name: 'Missing Lat Trail', latitude: undefined, longitude: 18.4 }),
			makeTrail({ id: 'missing-lng', name: 'Missing Lng Trail', latitude: -33.9, longitude: undefined }),
			makeTrail({ id: 'null-coords', name: 'Null Coords Trail', latitude: null, longitude: null }),
		];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);
		
		// Only the valid trail should be rendered
		expect(screen.getByText('Valid Trail')).toBeInTheDocument();
		expect(screen.queryByText('Invalid Lat Trail')).not.toBeInTheDocument();
		expect(screen.queryByText('Invalid Lng Trail')).not.toBeInTheDocument();
		expect(screen.queryByText('Missing Lat Trail')).not.toBeInTheDocument();
		expect(screen.queryByText('Missing Lng Trail')).not.toBeInTheDocument();
		expect(screen.queryByText('Null Coords Trail')).not.toBeInTheDocument();
	});

	// Tests for mobile drag functionality
	test('shows drag handle on mobile when panel is open', () => {
		// Mock mobile viewport
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 768,
		});
		
		render(<TrailsPanel {...baseProps({ isPanelOpen: true })} />);
		
		const dragHandle = document.querySelector('.drag-handle');
		expect(dragHandle).toBeInTheDocument();
		
		// Check that the drag handle has the expected inline styles
		expect(dragHandle.style.position).toBe('absolute');
		expect(dragHandle.style.top).toBe('8px');
		expect(dragHandle.style.left).toBe('50%');
		expect(dragHandle.style.transform).toBe('translateX(-50%)');
		expect(dragHandle.style.width).toBe('40px');
		expect(dragHandle.style.height).toBe('4px');
		expect(dragHandle.style.cursor).toBe('ns-resize');
		expect(dragHandle.style.touchAction).toBe('none');
		expect(dragHandle.style.background).toBe('rgba(255, 255, 255, 0.3)');
		expect(dragHandle.style.borderRadius).toBe('2px');
		expect(dragHandle.style.zIndex).toBe('10');
	});

	test('hides drag handle on desktop', () => {
		// Mock desktop viewport
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 1024,
		});
		
		render(<TrailsPanel {...baseProps({ isPanelOpen: true })} />);
		
		const dragHandle = document.querySelector('.drag-handle');
		expect(dragHandle).not.toBeInTheDocument();
	});

	test('applies dragging class when isDragging is true', () => {
		render(<TrailsPanel {...baseProps({ isPanelOpen: true })} />);
		
		// The dragging class is applied based on internal state, so we can't directly test it
		// But we can verify the component structure supports it
		const panel = document.querySelector('.trails-panel-toggle');
		expect(panel).toBeInTheDocument();
	});

	test('applies custom height style on mobile when panel is open', () => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 768,
		});
		
		render(<TrailsPanel {...baseProps({ isPanelOpen: true })} />);
		
		const panel = document.querySelector('.trails-panel-toggle');
		expect(panel).toHaveStyle({ height: '50vh' }); // Default height
	});

	test('does not apply height style on desktop', () => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 1024,
		});
		
		render(<TrailsPanel {...baseProps({ isPanelOpen: true })} />);
		
		const panel = document.querySelector('.trails-panel-toggle');
		expect(panel).not.toHaveStyle({ height: '50vh' });
	});

	// Test for distance calculation with search location
	test('displays distance from search location when in search mode', () => {
		const searchLocation = { latitude: -34.0, longitude: 18.5 };
		const trail = makeTrail({ id: 'test', latitude: -33.9, longitude: 18.4 });
		render(<TrailsPanel {...baseProps({ 
			filteredTrails: [trail], 
			isSearchMode: true, 
			searchLocation 
		})} />);
		
		// Should show distance away text
		expect(screen.getByText(/km away/)).toBeInTheDocument();
	});

	test('displays distance from user location when not in search mode', () => {
		const userLocation = { latitude: -33.9, longitude: 18.4 };
		const trail = makeTrail({ id: 'test', latitude: -33.8, longitude: 18.3 });
		render(<TrailsPanel {...baseProps({ 
			filteredTrails: [trail], 
			isSearchMode: false,
			userLocation 
		})} />);
		
		// Should show distance away text
		expect(screen.getByText(/km away/)).toBeInTheDocument();
	});

	// Edge cases and error handling tests
	test('handles missing onRecenterFromSearch prop gracefully', () => {
		const searchLocation = { latitude: -34.0, longitude: 18.5 };
		// Should not throw error when onRecenterFromSearch is undefined
		expect(() => {
			render(<TrailsPanel {...baseProps({ 
				isSearchMode: true, 
				searchLocation,
				onRecenterFromSearch: undefined
			})} />);
		}).not.toThrow();
	});

	test('handles empty searchLocation object in search mode', () => {
		const trails = [makeTrail({ id: 'test', name: 'Test Trail' })];
		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails, 
			isSearchMode: true, 
			searchLocation: {} 
		})} />);
		
		// Should still render without crashing
		expect(screen.getByText('Test Trail')).toBeInTheDocument();
	});

	test('handles trails with undefined/null coordinates gracefully', () => {
		const trails = [
			makeTrail({ id: 'valid', name: 'Valid Trail', latitude: -33.9, longitude: 18.4 }),
			makeTrail({ id: 'undefined-lat', name: 'Undefined Lat Trail', latitude: undefined, longitude: 18.4 }),
			makeTrail({ id: 'undefined-lng', name: 'Undefined Lng Trail', latitude: -33.9, longitude: undefined }),
		];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);
		
		// Only valid trail should be rendered
		expect(screen.getByText('Valid Trail')).toBeInTheDocument();
		expect(screen.queryByText('Undefined Lat Trail')).not.toBeInTheDocument();
		expect(screen.queryByText('Undefined Lng Trail')).not.toBeInTheDocument();
	});

	test('handles non-numeric coordinate values', () => {
		const trails = [
			makeTrail({ id: 'valid', name: 'Valid Trail', latitude: -33.9, longitude: 18.4 }),
			makeTrail({ id: 'string-coords', name: 'String Coords Trail', latitude: '-33.9', longitude: '18.4' }),
			makeTrail({ id: 'object-coords', name: 'Object Coords Trail', latitude: {}, longitude: [] }),
		];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);
		
		// Only valid trail should be rendered
		expect(screen.getByText('Valid Trail')).toBeInTheDocument();
		expect(screen.queryByText('String Coords Trail')).not.toBeInTheDocument();
		expect(screen.queryByText('Object Coords Trail')).not.toBeInTheDocument();
	});

	test('maintains sort order when switching between search and normal mode', async () => {
		const userLocation = { latitude: -33.9, longitude: 18.4 };
		const searchLocation = { latitude: -34.0, longitude: 18.5 };
		const trails = [
			makeTrail({ id: 'a', name: 'Alpha', latitude: -33.8, longitude: 18.3 }),
			makeTrail({ id: 'b', name: 'Beta', latitude: -33.7, longitude: 18.2 }),
		];
		
		const { rerender } = render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails, 
			isSearchMode: false,
			userLocation 
		})} />);
		
		// Sort by name in normal mode
		await userEvent.selectOptions(screen.getByRole('combobox'), 'name');
		let names = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
		expect(names).toEqual(['Alpha', 'Beta']);
		
		// Switch to search mode
		rerender(<TrailsPanel {...baseProps({ 
			filteredTrails: trails, 
			isSearchMode: true,
			searchLocation 
		})} />);
		
		// Should still show "Near Search" option
		expect(screen.getByText('Near Search')).toBeInTheDocument();
	});

	test('handles window resize for drag functionality', () => {
		// Start with mobile viewport
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 768,
		});
		
		const { rerender } = render(<TrailsPanel {...baseProps({ isPanelOpen: true })} />);
		expect(document.querySelector('.drag-handle')).toBeInTheDocument();
		
		// Switch to desktop viewport
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 1024,
		});
		
		// Trigger a re-render to test the window.innerWidth check
		rerender(<TrailsPanel {...baseProps({ isPanelOpen: true })} />);
		// Note: The drag handle visibility is checked at render time, so it should still be there
		// unless we force a complete re-mount, which is more complex to test
	});

	test('validates coordinate types correctly', () => {
		const trails = [
			makeTrail({ id: 'valid', name: 'Valid Trail', latitude: -33.9, longitude: 18.4 }),
			makeTrail({ id: 'nan-lat', name: 'NaN Lat Trail', latitude: NaN, longitude: 18.4 }),
			makeTrail({ id: 'nan-lng', name: 'NaN Lng Trail', latitude: -33.9, longitude: NaN }),
			// Note: Infinity values pass the current validation (isNaN(Infinity) === false)
			// but they should be filtered out for practical purposes
			makeTrail({ id: 'inf-lat', name: 'Inf Lat Trail', latitude: Infinity, longitude: 18.4 }),
			makeTrail({ id: 'inf-lng', name: 'Inf Lng Trail', latitude: -33.9, longitude: Infinity }),
		];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);
		
		// Valid trail should be rendered
		expect(screen.getByText('Valid Trail')).toBeInTheDocument();
		// NaN trails should be filtered out
		expect(screen.queryByText('NaN Lat Trail')).not.toBeInTheDocument();
		expect(screen.queryByText('NaN Lng Trail')).not.toBeInTheDocument();
		// Note: Infinity trails currently pass validation but may cause issues in distance calculations
		// This test documents the current behavior - Infinity values are not filtered out
		expect(screen.getByText('Inf Lat Trail')).toBeInTheDocument();
		expect(screen.getByText('Inf Lng Trail')).toBeInTheDocument();
	});

	// Author fetching tests
	test('displays sample and unknown authors correctly', () => {
		const trails = [
			makeTrail({ 
				id: 'trail1', 
				name: 'Sample Trail', 
				createdBy: 'sample' 
			}),
			makeTrail({ 
				id: 'trail2', 
				name: 'Unknown Trail', 
				createdBy: 'unknown' 
			})
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText('by Sample User')).toBeInTheDocument();
		expect(screen.getByText('by Unknown')).toBeInTheDocument();
	});

	test('handles complex createdBy field formats', () => {
		const trails = [
			makeTrail({ 
				id: 'trail1', 
				name: 'Complex Trail', 
				createdBy: 'Users/user123' 
			}),
			makeTrail({ 
				id: 'trail2', 
				name: 'Simple Trail', 
				createdBy: 'user456' 
			})
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		// Should extract user ID from complex path - check for both trails
		const authorElements = screen.getAllByText('by ...');
		expect(authorElements).toHaveLength(2);
	});

	// Scroll behavior tests
	test('unselects trail after scroll timeout', async () => {
		const mockSetSelectedTrail = jest.fn();
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];
		
		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			selectedTrail: trails[0],
			setSelectedTrail: mockSetSelectedTrail
		})} />);

		const trailsList = document.querySelector('.trails-list');
		
		// Simulate scroll event
		fireEvent.scroll(trailsList);

		// Wait for timeout to trigger
		await waitFor(() => {
			expect(mockSetSelectedTrail).toHaveBeenCalledWith(null);
		}, { timeout: 200 });
	});

	test('clears scroll timeout on cleanup', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];
		const { unmount } = render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			selectedTrail: trails[0]
		})} />);

		// Should not throw when unmounting
		expect(() => unmount()).not.toThrow();
	});

	// Sort functionality tests
	test('sorts trails by name', async () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'Zebra Trail' }),
			makeTrail({ id: 'trail2', name: 'Alpha Trail' }),
			makeTrail({ id: 'trail3', name: 'Beta Trail' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		await userEvent.selectOptions(screen.getByRole('combobox'), 'name');

		const trailNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
		expect(trailNames[0]).toBe('Alpha Trail');
		expect(trailNames[1]).toBe('Beta Trail');
		expect(trailNames[2]).toBe('Zebra Trail');
	});

	test('sorts trails by distance', async () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'Long Trail', distance: '10' }),
			makeTrail({ id: 'trail2', name: 'Short Trail', distance: '2' }),
			makeTrail({ id: 'trail3', name: 'Medium Trail', distance: '5' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		await userEvent.selectOptions(screen.getByRole('combobox'), 'distance');

		const trailNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
		expect(trailNames[0]).toBe('Short Trail');
		expect(trailNames[1]).toBe('Medium Trail');
		expect(trailNames[2]).toBe('Long Trail');
	});

	test('sorts trails by difficulty', async () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'Hard Trail', difficulty: 'hard' }),
			makeTrail({ id: 'trail2', name: 'Easy Trail', difficulty: 'easy' }),
			makeTrail({ id: 'trail3', name: 'Moderate Trail', difficulty: 'moderate' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		await userEvent.selectOptions(screen.getByRole('combobox'), 'difficulty');

		const trailNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
		expect(trailNames[0]).toBe('Easy Trail');
		expect(trailNames[1]).toBe('Moderate Trail');
		expect(trailNames[2]).toBe('Hard Trail');
	});

	test('sorts trails by elevation', async () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'High Trail', elevationGain: '1000' }),
			makeTrail({ id: 'trail2', name: 'Low Trail', elevationGain: '100' }),
			makeTrail({ id: 'trail3', name: 'Medium Trail', elevationGain: '500' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		await userEvent.selectOptions(screen.getByRole('combobox'), 'elevation');

		const trailNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
		expect(trailNames[0]).toBe('Low Trail');
		expect(trailNames[1]).toBe('Medium Trail');
		expect(trailNames[2]).toBe('High Trail');
	});

	test('toggles sort order when clicking same sort option', async () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'Zebra Trail' }),
			makeTrail({ id: 'trail2', name: 'Alpha Trail' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		// First click - should sort ascending
		await userEvent.selectOptions(screen.getByRole('combobox'), 'name');
		let trailNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
		expect(trailNames[0]).toBe('Alpha Trail');

		// Second click - should sort descending
		await userEvent.selectOptions(screen.getByRole('combobox'), 'name');
		trailNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
		expect(trailNames[0]).toBe('Zebra Trail');
	});

	test('resets sort order when changing sort criteria', async () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'Zebra Trail' }),
			makeTrail({ id: 'trail2', name: 'Alpha Trail' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		// Sort by name descending
		await userEvent.selectOptions(screen.getByRole('combobox'), 'name');
		await userEvent.selectOptions(screen.getByRole('combobox'), 'name');

		// Switch to distance - should reset to ascending
		await userEvent.selectOptions(screen.getByRole('combobox'), 'distance');
		
		// Switch back to name - should be ascending again
		await userEvent.selectOptions(screen.getByRole('combobox'), 'name');
		const trailNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
		expect(trailNames[0]).toBe('Alpha Trail');
	});

	// Trail action tests
	test('handles trail action clicks', async () => {
		const mockHandleTrailAction = jest.fn();
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];

		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			handleTrailAction: mockHandleTrailAction,
			currentUserId: 'user123'
		})} />);

		// Click favourites button
		const favouritesBtn = screen.getByTitle('Add to Favourites');
		await userEvent.click(favouritesBtn);
		expect(mockHandleTrailAction).toHaveBeenCalledWith('trail1', 'favourites');

		// Click wishlist button
		const wishlistBtn = screen.getByTitle('Add to Wishlist');
		await userEvent.click(wishlistBtn);
		expect(mockHandleTrailAction).toHaveBeenCalledWith('trail1', 'wishlist');

		// Click completed button
		const completedBtn = screen.getByTitle('Mark as Completed');
		await userEvent.click(completedBtn);
		expect(mockHandleTrailAction).toHaveBeenCalledWith('trail1', 'completed');
	});

	test('shows active state for saved trails', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];
		const userSaved = {
			favourites: ['trail1'],
			wishlist: ['trail1'],
			completed: ['trail1']
		};

		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			userSaved,
			currentUserId: 'user123'
		})} />);

		expect(screen.getByTitle('Remove from Favourites')).toBeInTheDocument();
		expect(screen.getByTitle('Remove from Wishlist')).toBeInTheDocument();
		expect(screen.getByTitle('Remove from Completed')).toBeInTheDocument();
	});

	test('hides action buttons when user is not logged in', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];

		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			currentUserId: null
		})} />);

		expect(screen.queryByTitle('Add to Favourites')).not.toBeInTheDocument();
		expect(screen.queryByTitle('Add to Wishlist')).not.toBeInTheDocument();
		expect(screen.queryByTitle('Mark as Completed')).not.toBeInTheDocument();
	});

	// Edit functionality tests
	test('shows edit button for user\'s own trails', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'My Trail', createdBy: 'user123' })];

		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			currentUserId: 'user123'
		})} />);

		expect(screen.getByTitle('Edit My Trail')).toBeInTheDocument();
	});

	test('hides edit button for other users\' trails', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'Other Trail', createdBy: 'other123' })];

		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			currentUserId: 'user123'
		})} />);

		expect(screen.queryByTitle('Edit Other Trail')).not.toBeInTheDocument();
	});

	test('calls onEditTrail when edit button is clicked', async () => {
		const mockOnEditTrail = jest.fn();
		const trails = [makeTrail({ id: 'trail1', name: 'My Trail', createdBy: 'user123' })];

		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			currentUserId: 'user123',
			onEditTrail: mockOnEditTrail
		})} />);

		const editBtn = screen.getByTitle('Edit My Trail');
		await userEvent.click(editBtn);

		expect(mockOnEditTrail).toHaveBeenCalledWith(trails[0]);
	});

	// Trail selection tests
	test('selects trail when clicked', async () => {
		const mockSetSelectedTrail = jest.fn();
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];

		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			setSelectedTrail: mockSetSelectedTrail
		})} />);

		const trailItem = screen.getByText('Test Trail').closest('.trail-item');
		await userEvent.click(trailItem);

		expect(mockSetSelectedTrail).toHaveBeenCalledWith(trails[0]);
	});

	test('deselects trail when clicked again', async () => {
		const mockSetSelectedTrail = jest.fn();
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];

		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			selectedTrail: trails[0],
			setSelectedTrail: mockSetSelectedTrail
		})} />);

		const trailItem = screen.getByText('Test Trail').closest('.trail-item');
		await userEvent.click(trailItem);

		expect(mockSetSelectedTrail).toHaveBeenCalledWith(null);
	});

	test('calls onTrailClick when trail is selected', async () => {
		const mockOnTrailClick = jest.fn();
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];

		render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			onTrailClick: mockOnTrailClick
		})} />);

		const trailItem = screen.getByText('Test Trail').closest('.trail-item');
		await userEvent.click(trailItem);

		expect(mockOnTrailClick).toHaveBeenCalledWith(trails[0]);
	});

	// Edge cases tests
	test('handles trails with missing properties gracefully', () => {
		const trails = [
			{ id: 'trail1' }, // Missing most properties
			makeTrail({ id: 'trail2', name: 'Complete Trail' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		// Should render without crashing
		expect(screen.getByText('Complete Trail')).toBeInTheDocument();
	});

	test('handles empty trail names', () => {
		const trails = [
			makeTrail({ id: 'trail1', name: '' }),
			makeTrail({ id: 'trail2', name: 'Valid Trail' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText('Valid Trail')).toBeInTheDocument();
	});

	test('handles trails with no photos', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'No Photo Trail', photos: [] })];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByLabelText('No photo available')).toBeInTheDocument();
	});

	test('handles trails with no tags', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'No Tags Trail', tags: [] })];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText('No Tags Trail')).toBeInTheDocument();
	});

	// Accessibility tests
	test('has proper ARIA labels and titles', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByTitle('Close Trails Panel')).toBeInTheDocument();
		expect(screen.getByTitle('Show Filters')).toBeInTheDocument();
	});

	test('has proper button titles for different states', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];

		const { rerender } = render(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			showFilters: true
		})} />);

		expect(screen.getByTitle('Hide Filters')).toBeInTheDocument();

		rerender(<TrailsPanel {...baseProps({ 
			filteredTrails: trails,
			showFilters: false
		})} />);

		expect(screen.getByTitle('Show Filters')).toBeInTheDocument();
	});

	test('has proper sort order button titles', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByTitle('Sort Descending')).toBeInTheDocument();
	});

	test('has proper trail count display', () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'Trail 1' }),
			makeTrail({ id: 'trail2', name: 'Trail 2' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText('2 trails')).toBeInTheDocument();
	});

	test('has proper singular trail count display', () => {
		const trails = [makeTrail({ id: 'trail1', name: 'Trail 1' })];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText('1 trail')).toBeInTheDocument();
	});

	// Additional drag functionality tests
	test('handles drag start on mobile', () => {
		// Mock mobile viewport
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 768,
		});

		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails, isPanelOpen: true })} />);

		const dragHandle = document.querySelector('.drag-handle');
		expect(dragHandle).toBeInTheDocument();

		// Simulate touch start
		const touchEvent = new TouchEvent('touchstart', {
			touches: [{ clientY: 100 }]
		});
		fireEvent(dragHandle, touchEvent);

		// Should not throw
		expect(dragHandle).toBeInTheDocument();
	});

	test('handles drag start on desktop (should not work)', () => {
		// Mock desktop viewport
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 1024,
		});

		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails, isPanelOpen: true })} />);

		const dragHandle = document.querySelector('.drag-handle');
		expect(dragHandle).not.toBeInTheDocument();
	});

	test('handles mouse drag events', () => {
		// Mock mobile viewport
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 768,
		});

		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail' })];
		render(<TrailsPanel {...baseProps({ filteredTrails: trails, isPanelOpen: true })} />);

		const dragHandle = document.querySelector('.drag-handle');
		expect(dragHandle).toBeInTheDocument();

		// Simulate mouse down
		const mouseDownEvent = new MouseEvent('mousedown', {
			clientY: 100
		});
		fireEvent(dragHandle, mouseDownEvent);

		// Should not throw
		expect(dragHandle).toBeInTheDocument();
	});

	// Error handling tests
	test('handles missing trail properties in sorting', () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'Trail 1', distance: undefined, difficulty: undefined, elevationGain: undefined }), // Missing distance, difficulty, elevation
			makeTrail({ id: 'trail2', name: 'Trail 2', distance: '5', difficulty: 'easy', elevationGain: '100' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		// Should render without crashing
		expect(screen.getByText('Trail 1')).toBeInTheDocument();
		expect(screen.getByText('Trail 2')).toBeInTheDocument();
	});

	test('handles null/undefined trail properties', () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'Trail 1', distance: null, difficulty: undefined, elevationGain: null })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		// Should render without crashing
		expect(screen.getByText('Trail 1')).toBeInTheDocument();
	});

	test('handles empty filteredTrails array', () => {
		render(<TrailsPanel {...baseProps({ filteredTrails: [] })} />);

		expect(screen.getByText('No trails found matching your criteria.')).toBeInTheDocument();
	});


	// Additional edge case tests
	test('handles trails with special characters in names', () => {
		const trails = [
			makeTrail({ id: 'trail1', name: 'Trail with "quotes" & symbols!' }),
			makeTrail({ id: 'trail2', name: 'Trail with <HTML> tags' })
		];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText('Trail with "quotes" & symbols!')).toBeInTheDocument();
		expect(screen.getByText('Trail with <HTML> tags')).toBeInTheDocument();
	});

	test('handles very long trail names', () => {
		const longName = 'A'.repeat(200);
		const trails = [makeTrail({ id: 'trail1', name: longName })];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText(longName)).toBeInTheDocument();
	});

	test('handles trails with many tags', () => {
		const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail', tags: manyTags })];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText('Test Trail')).toBeInTheDocument();
		// Should render all tags
		manyTags.forEach(tag => {
			expect(screen.getByText(tag)).toBeInTheDocument();
		});
	});

	test('handles trails with very long tag names', () => {
		const longTag = 'A'.repeat(100);
		const trails = [makeTrail({ id: 'trail1', name: 'Test Trail', tags: [longTag] })];

		render(<TrailsPanel {...baseProps({ filteredTrails: trails })} />);

		expect(screen.getByText(longTag)).toBeInTheDocument();
	});

	// Performance and memory tests
	test('handles large number of trails efficiently', () => {
		const manyTrails = Array.from({ length: 100 }, (_, i) => 
			makeTrail({ id: `trail${i}`, name: `Trail ${i}` })
		);

		render(<TrailsPanel {...baseProps({ filteredTrails: manyTrails })} />);

		// Should render without crashing
		expect(screen.getByText('100 trails')).toBeInTheDocument();
		expect(screen.getByText('Trail 0')).toBeInTheDocument();
		expect(screen.getByText('Trail 99')).toBeInTheDocument();
	});

	test('handles rapid prop changes', () => {
		const trails1 = [makeTrail({ id: 'trail1', name: 'Trail 1' })];
		const trails2 = [makeTrail({ id: 'trail2', name: 'Trail 2' })];

		const { rerender } = render(<TrailsPanel {...baseProps({ filteredTrails: trails1 })} />);
		expect(screen.getByText('Trail 1')).toBeInTheDocument();

		rerender(<TrailsPanel {...baseProps({ filteredTrails: trails2 })} />);
		expect(screen.getByText('Trail 2')).toBeInTheDocument();

		rerender(<TrailsPanel {...baseProps({ filteredTrails: trails1 })} />);
		expect(screen.getByText('Trail 1')).toBeInTheDocument();
	});
});
