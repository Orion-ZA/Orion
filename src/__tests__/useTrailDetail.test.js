import { renderHook, act } from '@testing-library/react';
import { useTrailDetail } from '../hooks/useTrailDetail';

// Mock all the hooks and utilities
jest.mock('../hooks/useTrailData', () => ({
  useTrailData: jest.fn()
}));

jest.mock('../hooks/useTrailUserActions', () => ({
  useTrailUserActions: jest.fn()
}));

jest.mock('../hooks/useTrailModals', () => ({
  useTrailModals: jest.fn()
}));

jest.mock('../hooks/useTrailContent', () => ({
  useTrailContent: jest.fn()
}));

jest.mock('../components/ToastContext', () => ({
  useToast: jest.fn()
}));

jest.mock('../utils/trailNavigation', () => ({
  createTrailNavigationActions: jest.fn()
}));

import { useTrailData } from '../hooks/useTrailData';
import { useTrailUserActions } from '../hooks/useTrailUserActions';
import { useTrailModals } from '../hooks/useTrailModals';
import { useTrailContent } from '../hooks/useTrailContent';
import { useToast } from '../components/ToastContext';
import { createTrailNavigationActions } from '../utils/trailNavigation';

describe('useTrailDetail', () => {
  const mockTrail = {
    id: 'trail-123',
    name: 'Test Trail',
    description: 'A beautiful trail',
    location: { latitude: 40.7128, longitude: -74.0060 }
  };

  const mockUser = {
    uid: 'user-123',
    displayName: 'Test User'
  };

  const mockTrailData = {
    trail: mockTrail,
    loading: false,
    error: null,
    authorName: 'John Doe',
    setTrail: jest.fn()
  };

  const mockUserActions = {
    user: mockUser,
    userSaved: { favourites: ['trail-123'], wishlist: [], completed: [] },
    handleTrailAction: jest.fn()
  };

  const mockContent = {
    reviews: [{ id: '1', comment: 'Great trail!', rating: 5 }],
    loadingReviews: false,
    reviewSortBy: 'newest',
    setReviewSortBy: jest.fn(),
    getSortedReviews: jest.fn(() => [{ id: '1', comment: 'Great trail!', rating: 5 }]),
    weatherData: [{ date: '2023-01-01', minTemp: 10, maxTemp: 20 }],
    loadingWeather: false,
    fetchReviews: jest.fn(),
    alerts: [{ id: '1', message: 'Trail closed' }],
    loadingAlerts: false
  };

  const mockModals = {
    showContributionModal: false,
    showAlertModal: false,
    showReportModal: false,
    contributionType: '',
    newReview: '',
    setNewReview: jest.fn(),
    newRating: 5,
    setNewRating: jest.fn(),
    isAnonymous: false,
    setIsAnonymous: jest.fn(),
    newImages: [],
    reportType: 'general',
    reportTargetId: null,
    uploading: false,
    showSuccessPopup: false,
    successMessage: '',
    setShowSuccessPopup: jest.fn(),
    openContributionModal: jest.fn(),
    closeContributionModal: jest.fn(),
    handleImageUpload: jest.fn(),
    handleAddReview: jest.fn(),
    handleAddImages: jest.fn(),
    handleAddAlert: jest.fn(),
    openReportModal: jest.fn(),
    handleSubmitReport: jest.fn(),
    setShowAlertModal: jest.fn(),
    setShowReportModal: jest.fn()
  };

  const mockNavigationActions = {
    handleShare: jest.fn(),
    handleDirections: jest.fn(),
    handleShowOnMap: jest.fn()
  };

  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTrailData.mockReturnValue(mockTrailData);
    useTrailUserActions.mockReturnValue(mockUserActions);
    useTrailContent.mockReturnValue(mockContent);
    useTrailModals.mockReturnValue(mockModals);
    useToast.mockReturnValue({ show: mockShowToast });
    createTrailNavigationActions.mockReturnValue(mockNavigationActions);
  });

  describe('Hook Integration', () => {
    it('integrates all hooks correctly', () => {
      const { result } = renderHook(() => useTrailDetail());

      expect(useTrailData).toHaveBeenCalled();
      expect(useTrailUserActions).toHaveBeenCalled();
      expect(useTrailContent).toHaveBeenCalledWith(mockTrail);
      expect(useTrailModals).toHaveBeenCalledWith(mockUser, 'trail-123', 'Test Trail', mockTrailData.setTrail, mockContent.fetchReviews);
      expect(createTrailNavigationActions).toHaveBeenCalledWith(null, mockShowToast);
    });

    it('returns all expected data', () => {
      const { result } = renderHook(() => useTrailDetail());

      // Trail data
      expect(result.current.trail).toEqual(mockTrail);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.authorName).toBe('John Doe');

      // User data
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.userSaved).toEqual({ favourites: ['trail-123'], wishlist: [], completed: [] });

      // Reviews data
      expect(result.current.reviews).toEqual(mockContent.reviews);
      expect(result.current.loadingReviews).toBe(false);
      expect(result.current.reviewSortBy).toBe('newest');
      expect(result.current.getSortedReviews).toBeDefined();

      // Weather data
      expect(result.current.weatherData).toEqual(mockContent.weatherData);
      expect(result.current.loadingWeather).toBe(false);

      // Alerts data
      expect(result.current.alerts).toEqual(mockContent.alerts);
      expect(result.current.loadingAlerts).toBe(false);

      // UI state
      expect(result.current.currentImageIndex).toBe(0);
      expect(result.current.activeTab).toBe('reviews');
    });
  });

  describe('UI State Management', () => {
    it('manages current image index', () => {
      const { result } = renderHook(() => useTrailDetail());

      act(() => {
        result.current.goToImage(2);
      });

      expect(result.current.currentImageIndex).toBe(2);
    });

    it('manages active tab', () => {
      const { result } = renderHook(() => useTrailDetail());

      act(() => {
        result.current.setActiveTab('weather');
      });

      expect(result.current.activeTab).toBe('weather');
    });
  });

  describe('Action Handlers', () => {
    it('provides trail action handler', () => {
      const { result } = renderHook(() => useTrailDetail());

      act(() => {
        result.current.handleTrailAction('favourites', 'trail-456');
      });

      expect(mockUserActions.handleTrailAction).toHaveBeenCalledWith('favourites', 'trail-456');
    });

    it('provides share handler with trail name', () => {
      const { result } = renderHook(() => useTrailDetail());

      act(() => {
        result.current.handleShare();
      });

      expect(mockNavigationActions.handleShare).toHaveBeenCalledWith('Test Trail');
    });

    it('provides directions handler with trail data', () => {
      const { result } = renderHook(() => useTrailDetail());

      act(() => {
        result.current.handleDirections();
      });

      expect(mockNavigationActions.handleDirections).toHaveBeenCalledWith(mockTrail);
    });

    it('provides show on map handler with trail and navigate', () => {
      const mockNavigate = jest.fn();
      const { result } = renderHook(() => useTrailDetail());

      act(() => {
        result.current.handleShowOnMap(mockNavigate);
      });

      expect(mockNavigationActions.handleShowOnMap).toHaveBeenCalledWith(mockTrail, mockNavigate);
    });
  });

  describe('Modal Actions Integration', () => {
    it('spreads modal actions correctly', () => {
      const { result } = renderHook(() => useTrailDetail());

      // Check that modal actions are available
      expect(result.current.openContributionModal).toBe(mockModals.openContributionModal);
      expect(result.current.closeContributionModal).toBe(mockModals.closeContributionModal);
      expect(result.current.handleImageUpload).toBe(mockModals.handleImageUpload);
      expect(result.current.handleAddReview).toBe(mockModals.handleAddReview);
      expect(result.current.handleAddImages).toBe(mockModals.handleAddImages);
      expect(result.current.handleAddAlert).toBe(mockModals.handleAddAlert);
      expect(result.current.openReportModal).toBe(mockModals.openReportModal);
      expect(result.current.handleSubmitReport).toBe(mockModals.handleSubmitReport);
      expect(result.current.setShowAlertModal).toBe(mockModals.setShowAlertModal);
      expect(result.current.setShowReportModal).toBe(mockModals.setShowReportModal);
    });

    it('provides modal state', () => {
      const { result } = renderHook(() => useTrailDetail());

      expect(result.current.showContributionModal).toBe(false);
      expect(result.current.showAlertModal).toBe(false);
      expect(result.current.showReportModal).toBe(false);
      expect(result.current.contributionType).toBe('');
      expect(result.current.newReview).toBe('');
      expect(result.current.newRating).toBe(5);
      expect(result.current.isAnonymous).toBe(false);
      expect(result.current.newImages).toEqual([]);
      expect(result.current.reportType).toBe('general');
      expect(result.current.reportTargetId).toBe(null);
      expect(result.current.uploading).toBe(false);
      expect(result.current.showSuccessPopup).toBe(false);
      expect(result.current.successMessage).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('handles null trail data', () => {
      useTrailData.mockReturnValue({
        ...mockTrailData,
        trail: null
      });

      const { result } = renderHook(() => useTrailDetail());

      expect(result.current.trail).toBe(null);
      expect(result.current.handleShare()).toBeUndefined();
      expect(result.current.handleDirections()).toBeUndefined();
    });

    it('handles null user', () => {
      useTrailUserActions.mockReturnValue({
        ...mockUserActions,
        user: null
      });

      const { result } = renderHook(() => useTrailDetail());

      expect(result.current.user).toBe(null);
    });

    it('handles loading states', () => {
      useTrailData.mockReturnValue({
        ...mockTrailData,
        loading: true
      });

      useTrailContent.mockReturnValue({
        ...mockContent,
        loadingReviews: true,
        loadingWeather: true,
        loadingAlerts: true
      });

      const { result } = renderHook(() => useTrailDetail());

      expect(result.current.loading).toBe(true);
      expect(result.current.loadingReviews).toBe(true);
      expect(result.current.loadingWeather).toBe(true);
      expect(result.current.loadingAlerts).toBe(true);
    });

    it('handles error states', () => {
      useTrailData.mockReturnValue({
        ...mockTrailData,
        error: 'Failed to load trail'
      });

      const { result } = renderHook(() => useTrailDetail());

      expect(result.current.error).toBe('Failed to load trail');
    });
  });

  describe('Navigation Actions', () => {
    it('creates navigation actions with correct parameters', () => {
      renderHook(() => useTrailDetail());

      expect(createTrailNavigationActions).toHaveBeenCalledWith(null, mockShowToast);
    });

    it('handles navigation actions when trail is null', () => {
      useTrailData.mockReturnValue({
        ...mockTrailData,
        trail: null
      });

      const { result } = renderHook(() => useTrailDetail());

      act(() => {
        result.current.handleShare();
      });

      expect(mockNavigationActions.handleShare).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Content Integration', () => {
    it('passes trail to useTrailContent', () => {
      const customTrail = { id: 'custom-trail', name: 'Custom Trail' };
      useTrailData.mockReturnValue({
        ...mockTrailData,
        trail: customTrail
      });

      renderHook(() => useTrailDetail());

      expect(useTrailContent).toHaveBeenCalledWith(customTrail);
    });

    it('handles content loading states', () => {
      useTrailContent.mockReturnValue({
        ...mockContent,
        loadingReviews: true,
        loadingWeather: true,
        loadingAlerts: true
      });

      const { result } = renderHook(() => useTrailDetail());

      expect(result.current.loadingReviews).toBe(true);
      expect(result.current.loadingWeather).toBe(true);
      expect(result.current.loadingAlerts).toBe(true);
    });
  });

  describe('State Updates', () => {
    it('allows manual state updates', () => {
      const { result } = renderHook(() => useTrailDetail());

      act(() => {
        result.current.setCurrentImageIndex(3);
      });

      expect(result.current.currentImageIndex).toBe(3);

      act(() => {
        result.current.setActiveTab('alerts');
      });

      expect(result.current.activeTab).toBe('alerts');
    });

    it('allows review sort changes', () => {
      const { result } = renderHook(() => useTrailDetail());

      act(() => {
        result.current.setReviewSortBy('oldest');
      });

      expect(mockContent.setReviewSortBy).toHaveBeenCalledWith('oldest');
    });
  });
});
