// Badges API service for fetching hiking badges
const BADGES_API_URL = 'https://hiking-logbook-hezw.onrender.com/api/public/badges';

export const fetchBadges = async () => {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(BADGES_API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Badges service not found');
      } else if (response.status >= 500) {
        throw new Error('Badges service is temporarily unavailable');
      } else {
        throw new Error(`Unable to fetch badges (${response.status})`);
      }
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('Badges service returned an error');
    }

    return {
      badges: data.data || [],
      totalBadges: data.totalBadges || 0,
      categories: data.categories || [],
      note: data.note || '',
    };
  } catch (error) {
    console.error('Error fetching badges:', error);

    // Provide more user-friendly error messages
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to badges service.');
    }

    throw error;
  }
};

// Helper function to get badges by category
export const getBadgesByCategory = (badges, category) => {
  return badges.filter(badge => badge.category === category);
};

// Helper function to get badges by difficulty
export const getBadgesByDifficulty = (badges, difficulty) => {
  return badges.filter(badge => badge.difficulty === difficulty);
};
