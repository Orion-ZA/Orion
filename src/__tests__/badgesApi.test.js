import { fetchBadges, getBadgesByCategory, getBadgesByDifficulty } from '../utils/badgesApi';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Badges API', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('fetchBadges returns correct data structure', async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          name: "First Steps",
          description: "Completed your very first hike",
          category: "achievement",
          difficulty: "standard"
        },
        {
          name: "Distance Walker",
          description: "Hiked a total distance of 100 km",
          category: "achievement",
          difficulty: "standard"
        }
      ],
      totalBadges: 2,
      categories: ["achievement"],
      note: "Badges are awarded automatically based on hiking activity"
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await fetchBadges();

    expect(result).toEqual({
      badges: mockResponse.data,
      totalBadges: mockResponse.totalBadges,
      categories: mockResponse.categories,
      note: mockResponse.note
    });
  });

  test('fetchBadges handles API errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    await expect(fetchBadges()).rejects.toThrow('Unable to connect to badges service.');
  });

  test('fetchBadges handles timeout errors', async () => {
    const abortError = new Error('Request timed out');
    abortError.name = 'AbortError';
    fetch.mockRejectedValueOnce(abortError);

    await expect(fetchBadges()).rejects.toThrow('Request timed out. Please check your connection.');
  });

  test('fetchBadges handles unsuccessful response', async () => {
    const mockResponse = {
      success: false,
      data: []
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await expect(fetchBadges()).rejects.toThrow('Badges service returned an error');
  });

  test('fetchBadges handles 404 errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(fetchBadges()).rejects.toThrow('Badges service not found');
  });

  test('fetchBadges handles 500 errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchBadges()).rejects.toThrow('Badges service is temporarily unavailable');
  });

  test('getBadgesByCategory filters correctly', () => {
    const badges = [
      { name: "First Steps", category: "achievement" },
      { name: "Some Other Badge", category: "milestone" }
    ];

    const achievementBadges = getBadgesByCategory(badges, 'achievement');
    expect(achievementBadges).toHaveLength(1);
    expect(achievementBadges[0].name).toBe("First Steps");
  });

  test('getBadgesByDifficulty filters correctly', () => {
    const badges = [
      { name: "First Steps", difficulty: "standard" },
      { name: "Hard Badge", difficulty: "advanced" }
    ];

    const standardBadges = getBadgesByDifficulty(badges, 'standard');
    expect(standardBadges).toHaveLength(1);
    expect(standardBadges[0].name).toBe("First Steps");
  });
});
