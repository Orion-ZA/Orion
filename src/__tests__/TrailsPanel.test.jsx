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
});
