import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import TrailDetail from '../pages/TrailDetail';

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => children,
}));

// Mock the useTrailDetail hook
const mockUseTrailDetail = {
  // Trail data
  trail: {
    id: 'trail-1',
    name: "Lion's Head Trail",
    description: 'A beautiful hiking trail with stunning views',
    difficulty: 'moderate',
    length: 5.2,
    elevation: 1200,
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    status: 'open',
    coordinates: { lat: 40.7128, lng: -74.006 },
  },
  loading: false,
  error: null,
  authorName: 'John Doe',

  // User data
  user: {
    uid: 'user-123',
    displayName: 'Test User',
    email: 'test@example.com',
  },
  userSaved: {
    favourites: ['trail-1'],
    wishlist: [],
    completed: [],
  },

  // Reviews data
  reviews: [
    {
      id: 'review-1',
      userName: 'Jane Smith',
      rating: 5,
      comment: 'Amazing trail!',
      timestamp: new Date('2024-01-15T10:30:00Z'),
    },
  ],
  loadingReviews: false,
  reviewSortBy: 'newest',
  setReviewSortBy: jest.fn(),
  getSortedReviews: jest.fn(() => [
    {
      id: 'review-1',
      userName: 'Jane Smith',
      rating: 5,
      comment: 'Amazing trail!',
      timestamp: new Date('2024-01-15T10:30:00Z'),
    },
  ]),

  // Weather data
  weatherData: [
    {
      date: '2024-01-20',
      minTemp: 15,
      maxTemp: 25,
      condition: 'Sunny',
      humidity: 60,
      windSpeed: 5,
    },
  ],
  loadingWeather: false,

  // Alerts data
  alerts: [
    {
      id: 'alert-1',
      type: 'hazard',
      message: 'Rock slide on trail',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      isTimed: true,
      expiresAt: new Date('2024-01-20T10:30:00Z'),
    },
  ],
  loadingAlerts: false,

  // UI state
  currentImageIndex: 0,
  setCurrentImageIndex: jest.fn(),
  activeTab: 'reviews',
  setActiveTab: jest.fn(),

  // Modal states
  showContributionModal: false,
  contributionType: 'review',
  newReview: '',
  setNewReview: jest.fn(),
  newRating: 5,
  setNewRating: jest.fn(),
  isAnonymous: false,
  setIsAnonymous: jest.fn(),
  newImages: [],
  showAlertModal: false,
  setShowAlertModal: jest.fn(),
  showReportModal: false,
  setShowReportModal: jest.fn(),
  reportType: 'trail',
  reportTargetId: 'trail-1',
  uploading: false,

  // Success popup states
  showSuccessPopup: false,
  successMessage: '',
  setShowSuccessPopup: jest.fn(),

  // Actions
  handleTrailAction: jest.fn(),
  handleShare: jest.fn(),
  handleDirections: jest.fn(),
  handleShowOnMap: jest.fn(),
  openContributionModal: jest.fn(),
  closeContributionModal: jest.fn(),
  handleImageUpload: jest.fn(),
  handleAddReview: jest.fn(),
  handleAddImages: jest.fn(),
  handleAddAlert: jest.fn(),
  openReportModal: jest.fn(),
  handleSubmitReport: jest.fn(),
  goToImage: jest.fn(),
};

jest.mock('../hooks/useTrailDetail', () => ({
  useTrailDetail: () => mockUseTrailDetail,
}));

// Mock TrailUtils
jest.mock('../components/trails/TrailUtils', () => ({
  estimateDuration: jest.fn(() => '2-3 hours'),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ArrowLeft: ({ size, ...props }) => <div data-testid='arrow-left' data-size={size} {...props} />,
}));

// Mock all child components
jest.mock('../components/trails/TrailDetailHeader', () => {
  return function MockTrailDetailHeader({ onBack, onShowOnMap, onShare, onReport }) {
    return (
      <div data-testid='trail-detail-header'>
        <button onClick={onBack} data-testid='back-button'>
          Back
        </button>
        <button onClick={onShowOnMap} data-testid='show-on-map-button'>
          Show on Map
        </button>
        <button onClick={onShare} data-testid='share-button'>
          Share
        </button>
        <button onClick={onReport} data-testid='report-button'>
          Report
        </button>
      </div>
    );
  };
});

jest.mock('../components/trails/TrailDetailModals', () => {
  return function MockTrailDetailModals(props) {
    return <div data-testid='trail-detail-modals'>Modals</div>;
  };
});

jest.mock('../components/trails/TrailDetailActions', () => {
  return function MockTrailDetailActions({ user, trail, userSaved, onTrailAction }) {
    return (
      <div data-testid='trail-detail-actions'>
        <button
          onClick={() => onTrailAction('favourites', trail.id)}
          data-testid='favourite-button'
        >
          Favourite
        </button>
      </div>
    );
  };
});

jest.mock('../components/trails/TrailImageGallery', () => {
  return function MockTrailImageGallery({ images, currentImageIndex, onImageChange, onGoToImage }) {
    return (
      <div data-testid='trail-image-gallery'>
        <img src={images[0]} alt='Trail image' />
        <button onClick={() => onImageChange(1)} data-testid='next-image-button'>
          Next
        </button>
        <button onClick={() => onGoToImage(0)} data-testid='go-to-image-button'>
          Go to Image
        </button>
      </div>
    );
  };
});

jest.mock('../components/trails/TrailInfo', () => {
  return function MockTrailInfo({ trail, authorName, onDirections, estimateDuration }) {
    return (
      <div data-testid='trail-info'>
        <h1>{trail.name}</h1>
        <p>By {authorName}</p>
        <button onClick={onDirections} data-testid='directions-button'>
          Get Directions
        </button>
        <span data-testid='duration'>{estimateDuration()}</span>
      </div>
    );
  };
});

jest.mock('../components/trails/WeatherSection', () => {
  return function MockWeatherSection({ weatherData, loadingWeather }) {
    return (
      <div data-testid='weather-section'>
        {loadingWeather ? 'Loading weather...' : `Weather: ${weatherData[0]?.condition}`}
      </div>
    );
  };
});

jest.mock('../components/trails/TabSection', () => {
  return function MockTabSection({
    activeTab,
    setActiveTab,
    reviews,
    trail,
    reviewSortBy,
    setReviewSortBy,
    loadingReviews,
    getSortedReviews,
    onOpenContributionModal,
    currentImageIndex,
    setCurrentImageIndex,
    alerts,
    loadingAlerts,
    onReport,
  }) {
    return (
      <div data-testid='tab-section'>
        <button onClick={() => setActiveTab('reviews')} data-testid='reviews-tab'>
          Reviews
        </button>
        <button onClick={() => setActiveTab('media')} data-testid='media-tab'>
          Media
        </button>
        <button onClick={() => setActiveTab('alerts')} data-testid='alerts-tab'>
          Alerts
        </button>
        <button onClick={() => onOpenContributionModal('review')} data-testid='add-review-button'>
          Add Review
        </button>
        <button onClick={() => onReport('review', 'review-1')} data-testid='report-review-button'>
          Report Review
        </button>
      </div>
    );
  };
});

jest.mock('../components/SuccessPopup', () => {
  return function MockSuccessPopup({ isVisible, message, onClose }) {
    if (!isVisible) return null;
    return (
      <div data-testid='success-popup'>
        <p>{message}</p>
        <button onClick={onClose} data-testid='close-success-button'>
          Close
        </button>
      </div>
    );
  };
});

// Helper function to render component with router
const renderWithRouter = component => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TrailDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      mockUseTrailDetail.loading = true;

      const { container } = renderWithRouter(<TrailDetail />);

      expect(screen.getByText('Loading trail details...')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when trail not found', () => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = 'Trail not found';
      mockUseTrailDetail.trail = null;

      renderWithRouter(<TrailDetail />);

      expect(screen.getByText('Trail Not Found')).toBeInTheDocument();
      expect(screen.getByText('Trail not found')).toBeInTheDocument();
      expect(screen.getByText('Back to Trails')).toBeInTheDocument();
    });

    it('shows default error message when no specific error', () => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = null;

      renderWithRouter(<TrailDetail />);

      expect(screen.getByText('Trail Not Found')).toBeInTheDocument();
      expect(screen.getByText("The trail you're looking for doesn't exist.")).toBeInTheDocument();
    });

    it('navigates back to trails when error back button is clicked', () => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = 'Trail not found';
      mockUseTrailDetail.trail = null;

      renderWithRouter(<TrailDetail />);

      const backButton = screen.getByText('Back to Trails');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trails');
    });
  });

  describe('Main Content Rendering', () => {
    beforeEach(() => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        description: 'A beautiful hiking trail with stunning views',
        difficulty: 'moderate',
        length: 5.2,
        elevation: 1200,
        images: ['https://example.com/image1.jpg'],
        photos: ['https://example.com/photo1.jpg'],
        status: 'open',
        coordinates: { lat: 40.7128, lng: -74.006 },
      };
    });

    it('renders all main components when trail data is available', () => {
      renderWithRouter(<TrailDetail />);

      expect(screen.getByTestId('trail-detail-header')).toBeInTheDocument();
      expect(screen.getByTestId('trail-image-gallery')).toBeInTheDocument();
      expect(screen.getByTestId('trail-info')).toBeInTheDocument();
      expect(screen.getByTestId('weather-section')).toBeInTheDocument();
      expect(screen.getByTestId('trail-detail-actions')).toBeInTheDocument();
      expect(screen.getByTestId('tab-section')).toBeInTheDocument();
      expect(screen.getByTestId('trail-detail-modals')).toBeInTheDocument();
    });

    it('renders trail name and author in TrailInfo', () => {
      renderWithRouter(<TrailDetail />);

      expect(screen.getByText("Lion's Head Trail")).toBeInTheDocument();
      expect(screen.getByText('By John Doe')).toBeInTheDocument();
    });

    it('renders weather data when available', () => {
      renderWithRouter(<TrailDetail />);

      expect(screen.getByText('Weather: Sunny')).toBeInTheDocument();
    });

    it('shows loading weather when weather is loading', () => {
      mockUseTrailDetail.loadingWeather = true;

      renderWithRouter(<TrailDetail />);

      expect(screen.getByText('Loading weather...')).toBeInTheDocument();
    });
  });

  describe('Header Actions', () => {
    beforeEach(() => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: ['https://example.com/image1.jpg'],
        photos: ['https://example.com/photo1.jpg'],
      };
    });

    it('calls navigate(-1) when back button is clicked', () => {
      renderWithRouter(<TrailDetail />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('calls handleShowOnMap when show on map button is clicked', () => {
      renderWithRouter(<TrailDetail />);

      const showOnMapButton = screen.getByTestId('show-on-map-button');
      fireEvent.click(showOnMapButton);

      expect(mockUseTrailDetail.handleShowOnMap).toHaveBeenCalledWith(mockNavigate);
    });

    it('calls handleShare when share button is clicked', () => {
      renderWithRouter(<TrailDetail />);

      const shareButton = screen.getByTestId('share-button');
      fireEvent.click(shareButton);

      expect(mockUseTrailDetail.handleShare).toHaveBeenCalled();
    });

    it('calls openReportModal when report button is clicked', () => {
      renderWithRouter(<TrailDetail />);

      const reportButton = screen.getByTestId('report-button');
      fireEvent.click(reportButton);

      expect(mockUseTrailDetail.openReportModal).toHaveBeenCalledWith('trail');
    });
  });

  describe('Image Gallery Interactions', () => {
    beforeEach(() => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        photos: ['https://example.com/photo1.jpg'],
      };
    });

    it('calls setCurrentImageIndex when next image button is clicked', () => {
      renderWithRouter(<TrailDetail />);

      const nextImageButton = screen.getByTestId('next-image-button');
      fireEvent.click(nextImageButton);

      expect(mockUseTrailDetail.setCurrentImageIndex).toHaveBeenCalledWith(1);
    });

    it('calls goToImage when go to image button is clicked', () => {
      renderWithRouter(<TrailDetail />);

      const goToImageButton = screen.getByTestId('go-to-image-button');
      fireEvent.click(goToImageButton);

      expect(mockUseTrailDetail.goToImage).toHaveBeenCalledWith(0);
    });
  });

  describe('Trail Actions', () => {
    beforeEach(() => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: ['https://example.com/image1.jpg'],
        photos: ['https://example.com/photo1.jpg'],
      };
    });

    it('calls handleTrailAction when favourite button is clicked', () => {
      renderWithRouter(<TrailDetail />);

      const favouriteButton = screen.getByTestId('favourite-button');
      fireEvent.click(favouriteButton);

      expect(mockUseTrailDetail.handleTrailAction).toHaveBeenCalledWith('favourites', 'trail-1');
    });
  });

  describe('Tab Section Interactions', () => {
    beforeEach(() => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: ['https://example.com/image1.jpg'],
        photos: ['https://example.com/photo1.jpg'],
      };
    });

    it('calls setActiveTab when tab buttons are clicked', () => {
      renderWithRouter(<TrailDetail />);

      const reviewsTab = screen.getByTestId('reviews-tab');
      const mediaTab = screen.getByTestId('media-tab');
      const alertsTab = screen.getByTestId('alerts-tab');

      fireEvent.click(reviewsTab);
      expect(mockUseTrailDetail.setActiveTab).toHaveBeenCalledWith('reviews');

      fireEvent.click(mediaTab);
      expect(mockUseTrailDetail.setActiveTab).toHaveBeenCalledWith('media');

      fireEvent.click(alertsTab);
      expect(mockUseTrailDetail.setActiveTab).toHaveBeenCalledWith('alerts');
    });

    it('calls openContributionModal when add review button is clicked', () => {
      renderWithRouter(<TrailDetail />);

      const addReviewButton = screen.getByTestId('add-review-button');
      fireEvent.click(addReviewButton);

      expect(mockUseTrailDetail.openContributionModal).toHaveBeenCalledWith('review');
    });

    it('calls openReportModal when report review button is clicked', () => {
      renderWithRouter(<TrailDetail />);

      const reportReviewButton = screen.getByTestId('report-review-button');
      fireEvent.click(reportReviewButton);

      expect(mockUseTrailDetail.openReportModal).toHaveBeenCalledWith('review', 'review-1');
    });
  });

  describe('Success Popup', () => {
    beforeEach(() => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: ['https://example.com/image1.jpg'],
        photos: ['https://example.com/photo1.jpg'],
      };
    });

    it('shows success popup when showSuccessPopup is true', () => {
      mockUseTrailDetail.showSuccessPopup = true;
      mockUseTrailDetail.successMessage = 'Review added successfully!';

      renderWithRouter(<TrailDetail />);

      expect(screen.getByTestId('success-popup')).toBeInTheDocument();
      expect(screen.getByText('Review added successfully!')).toBeInTheDocument();
    });

    it('does not show success popup when showSuccessPopup is false', () => {
      mockUseTrailDetail.showSuccessPopup = false;

      renderWithRouter(<TrailDetail />);

      expect(screen.queryByTestId('success-popup')).not.toBeInTheDocument();
    });

    it('calls setShowSuccessPopup(false) when close button is clicked', () => {
      mockUseTrailDetail.showSuccessPopup = true;
      mockUseTrailDetail.successMessage = 'Review added successfully!';

      renderWithRouter(<TrailDetail />);

      const closeButton = screen.getByTestId('close-success-button');
      fireEvent.click(closeButton);

      expect(mockUseTrailDetail.setShowSuccessPopup).toHaveBeenCalledWith(false);
    });
  });

  describe('Component Props Passing', () => {
    beforeEach(() => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: ['https://example.com/image1.jpg'],
        photos: ['https://example.com/photo1.jpg'],
      };
    });

    it('passes correct props to TrailImageGallery', () => {
      renderWithRouter(<TrailDetail />);

      // The component should render with the correct images
      expect(screen.getByAltText('Trail image')).toHaveAttribute(
        'src',
        'https://example.com/image1.jpg'
      );
    });

    it('passes correct props to TrailInfo', () => {
      renderWithRouter(<TrailDetail />);

      expect(screen.getByText("Lion's Head Trail")).toBeInTheDocument();
      expect(screen.getByText('By John Doe')).toBeInTheDocument();
    });

    it('passes correct props to WeatherSection', () => {
      // Ensure weather data is available and not loading
      mockUseTrailDetail.loadingWeather = false;
      mockUseTrailDetail.weatherData = [
        {
          date: '2024-01-20',
          minTemp: 15,
          maxTemp: 25,
          condition: 'Sunny',
          humidity: 60,
          windSpeed: 5,
        },
      ];

      renderWithRouter(<TrailDetail />);

      expect(screen.getByText('Weather: Sunny')).toBeInTheDocument();
    });

    it('passes correct props to TrailDetailActions', () => {
      renderWithRouter(<TrailDetail />);

      expect(screen.getByTestId('trail-detail-actions')).toBeInTheDocument();
    });

    it('passes correct props to TabSection', () => {
      renderWithRouter(<TrailDetail />);

      expect(screen.getByTestId('tab-section')).toBeInTheDocument();
    });

    it('passes correct props to TrailDetailModals', () => {
      renderWithRouter(<TrailDetail />);

      expect(screen.getByTestId('trail-detail-modals')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    beforeEach(() => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: ['https://example.com/image1.jpg'],
        photos: ['https://example.com/photo1.jpg'],
      };
    });

    it('applies correct CSS classes to main container', () => {
      const { container } = renderWithRouter(<TrailDetail />);

      expect(container.querySelector('.trail-detail-page')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-content')).toBeInTheDocument();
    });

    it('applies correct CSS classes to loading state', () => {
      mockUseTrailDetail.loading = true;

      const { container } = renderWithRouter(<TrailDetail />);

      expect(container.querySelector('.trail-detail-page')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-loading')).toBeInTheDocument();
      expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('applies correct CSS classes to error state', () => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = 'Trail not found';
      mockUseTrailDetail.trail = null;

      const { container } = renderWithRouter(<TrailDetail />);

      expect(container.querySelector('.trail-detail-page')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-error')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing trail images gracefully', () => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: [],
        photos: [],
      };

      renderWithRouter(<TrailDetail />);

      expect(screen.getByTestId('trail-image-gallery')).toBeInTheDocument();
    });

    it('handles missing weather data gracefully', () => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: ['https://example.com/image1.jpg'],
        photos: ['https://example.com/photo1.jpg'],
      };
      mockUseTrailDetail.weatherData = [];

      renderWithRouter(<TrailDetail />);

      expect(screen.getByTestId('weather-section')).toBeInTheDocument();
    });

    it('handles missing alerts data gracefully', () => {
      mockUseTrailDetail.loading = false;
      mockUseTrailDetail.error = null;
      mockUseTrailDetail.trail = {
        id: 'trail-1',
        name: "Lion's Head Trail",
        images: ['https://example.com/image1.jpg'],
        photos: ['https://example.com/photo1.jpg'],
      };
      mockUseTrailDetail.alerts = [];

      renderWithRouter(<TrailDetail />);

      expect(screen.getByTestId('tab-section')).toBeInTheDocument();
    });
  });
});
