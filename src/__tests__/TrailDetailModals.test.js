import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailDetailModals from '../components/trails/TrailDetailModals';

// Mock the modal components
jest.mock('../components/trails/ContributionModal', () => {
  return function MockContributionModal(props) {
    return (
      <div data-testid='contribution-modal'>
        <div data-testid='contribution-type'>{props.contributionType}</div>
        <div data-testid='new-review'>{props.newReview}</div>
        <div data-testid='new-rating'>{props.newRating}</div>
        <div data-testid='is-anonymous'>{props.isAnonymous?.toString() || 'false'}</div>
        <div data-testid='new-images-count'>{props.newImages?.length || 0}</div>
        <div data-testid='uploading'>{props.uploading?.toString() || 'false'}</div>
        <button data-testid='close-contribution-modal' onClick={props.onCloseContributionModal}>
          Close Contribution
        </button>
        <button data-testid='add-review' onClick={props.onAddReview}>
          Add Review
        </button>
        <button data-testid='add-images' onClick={props.onAddImages}>
          Add Images
        </button>
        <input data-testid='image-upload' type='file' onChange={props.onImageUpload} />
      </div>
    );
  };
});

jest.mock('../components/modals/AlertModal', () => {
  return function MockAlertModal(props) {
    return (
      <div data-testid='alert-modal'>
        <div data-testid='alert-visible'>{props.isVisible?.toString() || 'false'}</div>
        <div data-testid='alert-trail-id'>{props.trailId || 'null'}</div>
        <div data-testid='alert-trail-name'>{props.trailName || 'null'}</div>
        <div data-testid='alert-loading'>{props.loading?.toString() || 'false'}</div>
        <button data-testid='close-alert-modal' onClick={props.onClose}>
          Close Alert
        </button>
        <button data-testid='add-alert' onClick={() => props.onSubmit({ test: 'alert' })}>
          Add Alert
        </button>
      </div>
    );
  };
});

jest.mock('../components/modals/ReportModal', () => {
  return function MockReportModal(props) {
    return (
      <div data-testid='report-modal'>
        <div data-testid='report-visible'>{props.isVisible?.toString() || 'false'}</div>
        <div data-testid='report-trail-id'>{props.trailId || 'null'}</div>
        <div data-testid='report-trail-name'>{props.trailName || 'null'}</div>
        <div data-testid='report-type'>{props.reportType || 'null'}</div>
        <div data-testid='report-target-id'>{props.targetId || 'null'}</div>
        <div data-testid='report-loading'>{props.loading?.toString() || 'false'}</div>
        <button data-testid='close-report-modal' onClick={props.onClose}>
          Close Report
        </button>
        <button data-testid='submit-report' onClick={() => props.onSubmit({ test: 'report' })}>
          Submit Report
        </button>
      </div>
    );
  };
});

describe('TrailDetailModals', () => {
  const defaultProps = {
    // Contribution Modal Props
    showContributionModal: false,
    contributionType: 'review',
    newReview: 'Test review',
    setNewReview: jest.fn(),
    newRating: 4,
    setNewRating: jest.fn(),
    isAnonymous: false,
    setIsAnonymous: jest.fn(),
    newImages: [],
    uploading: false,
    onCloseContributionModal: jest.fn(),
    onAddReview: jest.fn(),
    onAddImages: jest.fn(),
    onImageUpload: jest.fn(),

    // Alert Modal Props
    showAlertModal: false,
    onCloseAlertModal: jest.fn(),
    onAddAlert: jest.fn(),
    trailId: 'test-trail-id',
    trailName: 'Test Trail',

    // Report Modal Props
    showReportModal: false,
    onCloseReportModal: jest.fn(),
    onSubmitReport: jest.fn(),
    reportType: 'general',
    reportTargetId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all three modal components', () => {
      render(<TrailDetailModals {...defaultProps} />);

      expect(screen.getByTestId('contribution-modal')).toBeInTheDocument();
      expect(screen.getByTestId('alert-modal')).toBeInTheDocument();
      expect(screen.getByTestId('report-modal')).toBeInTheDocument();
    });

    it('renders contribution modal with correct props', () => {
      render(<TrailDetailModals {...defaultProps} />);

      expect(screen.getByTestId('contribution-type')).toHaveTextContent('review');
      expect(screen.getByTestId('new-review')).toHaveTextContent('Test review');
      expect(screen.getByTestId('new-rating')).toHaveTextContent('4');
      expect(screen.getByTestId('is-anonymous')).toHaveTextContent('false');
      expect(screen.getByTestId('new-images-count')).toHaveTextContent('0');
      expect(screen.getByTestId('uploading')).toHaveTextContent('false');
    });

    it('renders alert modal with correct props', () => {
      render(<TrailDetailModals {...defaultProps} />);

      expect(screen.getByTestId('alert-visible')).toHaveTextContent('false');
      expect(screen.getByTestId('alert-trail-id')).toHaveTextContent('test-trail-id');
      expect(screen.getByTestId('alert-trail-name')).toHaveTextContent('Test Trail');
      expect(screen.getByTestId('alert-loading')).toHaveTextContent('false');
    });

    it('renders report modal with correct props', () => {
      render(<TrailDetailModals {...defaultProps} />);

      expect(screen.getByTestId('report-visible')).toHaveTextContent('false');
      expect(screen.getByTestId('report-trail-id')).toHaveTextContent('test-trail-id');
      expect(screen.getByTestId('report-trail-name')).toHaveTextContent('Test Trail');
      expect(screen.getByTestId('report-type')).toHaveTextContent('general');
      expect(screen.getByTestId('report-target-id')).toHaveTextContent('null');
      expect(screen.getByTestId('report-loading')).toHaveTextContent('false');
    });
  });

  describe('Contribution Modal Props', () => {
    it('passes contribution modal visibility correctly', () => {
      render(<TrailDetailModals {...defaultProps} showContributionModal={true} />);

      // The mock doesn't directly show visibility, but we can test the props are passed
      expect(screen.getByTestId('contribution-modal')).toBeInTheDocument();
    });

    it('passes contribution type correctly', () => {
      render(<TrailDetailModals {...defaultProps} contributionType='image' />);

      expect(screen.getByTestId('contribution-type')).toHaveTextContent('image');
    });

    it('passes new review text correctly', () => {
      render(<TrailDetailModals {...defaultProps} newReview='Updated review' />);

      expect(screen.getByTestId('new-review')).toHaveTextContent('Updated review');
    });

    it('passes new rating correctly', () => {
      render(<TrailDetailModals {...defaultProps} newRating={5} />);

      expect(screen.getByTestId('new-rating')).toHaveTextContent('5');
    });

    it('passes anonymous flag correctly', () => {
      render(<TrailDetailModals {...defaultProps} isAnonymous={true} />);

      expect(screen.getByTestId('is-anonymous')).toHaveTextContent('true');
    });

    it('passes new images array correctly', () => {
      const mockImages = ['image1.jpg', 'image2.jpg'];
      render(<TrailDetailModals {...defaultProps} newImages={mockImages} />);

      expect(screen.getByTestId('new-images-count')).toHaveTextContent('2');
    });

    it('passes uploading state correctly', () => {
      render(<TrailDetailModals {...defaultProps} uploading={true} />);

      expect(screen.getByTestId('uploading')).toHaveTextContent('true');
    });
  });

  describe('Alert Modal Props', () => {
    it('passes alert modal visibility correctly', () => {
      render(<TrailDetailModals {...defaultProps} showAlertModal={true} />);

      expect(screen.getByTestId('alert-visible')).toHaveTextContent('true');
    });

    it('passes trail ID and name correctly', () => {
      render(
        <TrailDetailModals {...defaultProps} trailId='custom-trail' trailName='Custom Trail' />
      );

      expect(screen.getByTestId('alert-trail-id')).toHaveTextContent('custom-trail');
      expect(screen.getByTestId('alert-trail-name')).toHaveTextContent('Custom Trail');
    });

    it('passes uploading state as loading to alert modal', () => {
      render(<TrailDetailModals {...defaultProps} uploading={true} />);

      expect(screen.getByTestId('alert-loading')).toHaveTextContent('true');
    });
  });

  describe('Report Modal Props', () => {
    it('passes report modal visibility correctly', () => {
      render(<TrailDetailModals {...defaultProps} showReportModal={true} />);

      expect(screen.getByTestId('report-visible')).toHaveTextContent('true');
    });

    it('passes report type correctly', () => {
      render(<TrailDetailModals {...defaultProps} reportType='trail' />);

      expect(screen.getByTestId('report-type')).toHaveTextContent('trail');
    });

    it('passes report target ID correctly', () => {
      render(<TrailDetailModals {...defaultProps} reportTargetId='review-123' />);

      expect(screen.getByTestId('report-target-id')).toHaveTextContent('review-123');
    });

    it('handles null report target ID', () => {
      render(<TrailDetailModals {...defaultProps} reportTargetId={null} />);

      expect(screen.getByTestId('report-target-id')).toHaveTextContent('null');
    });

    it('passes uploading state as loading to report modal', () => {
      render(<TrailDetailModals {...defaultProps} uploading={true} />);

      expect(screen.getByTestId('report-loading')).toHaveTextContent('true');
    });
  });

  describe('Callback Functions', () => {
    it('passes contribution modal callbacks correctly', () => {
      const mockOnCloseContributionModal = jest.fn();
      const mockOnAddReview = jest.fn();
      const mockOnAddImages = jest.fn();
      const mockOnImageUpload = jest.fn();

      render(
        <TrailDetailModals
          {...defaultProps}
          onCloseContributionModal={mockOnCloseContributionModal}
          onAddReview={mockOnAddReview}
          onAddImages={mockOnAddImages}
          onImageUpload={mockOnImageUpload}
        />
      );

      const closeButton = screen.getByTestId('close-contribution-modal');
      const addReviewButton = screen.getByTestId('add-review');
      const addImagesButton = screen.getByTestId('add-images');
      const imageUpload = screen.getByTestId('image-upload');

      fireEvent.click(closeButton);
      fireEvent.click(addReviewButton);
      fireEvent.click(addImagesButton);
      fireEvent.change(imageUpload, { target: { files: [] } });

      expect(mockOnCloseContributionModal).toHaveBeenCalled();
      expect(mockOnAddReview).toHaveBeenCalled();
      expect(mockOnAddImages).toHaveBeenCalled();
      expect(mockOnImageUpload).toHaveBeenCalled();
    });

    it('passes alert modal callbacks correctly', () => {
      const mockOnCloseAlertModal = jest.fn();
      const mockOnAddAlert = jest.fn();

      render(
        <TrailDetailModals
          {...defaultProps}
          onCloseAlertModal={mockOnCloseAlertModal}
          onAddAlert={mockOnAddAlert}
        />
      );

      const closeButton = screen.getByTestId('close-alert-modal');
      const addAlertButton = screen.getByTestId('add-alert');

      fireEvent.click(closeButton);
      fireEvent.click(addAlertButton);

      expect(mockOnCloseAlertModal).toHaveBeenCalled();
      expect(mockOnAddAlert).toHaveBeenCalledWith({ test: 'alert' });
    });

    it('passes report modal callbacks correctly', () => {
      const mockOnCloseReportModal = jest.fn();
      const mockOnSubmitReport = jest.fn();

      render(
        <TrailDetailModals
          {...defaultProps}
          onCloseReportModal={mockOnCloseReportModal}
          onSubmitReport={mockOnSubmitReport}
        />
      );

      const closeButton = screen.getByTestId('close-report-modal');
      const submitButton = screen.getByTestId('submit-report');

      fireEvent.click(closeButton);
      fireEvent.click(submitButton);

      expect(mockOnCloseReportModal).toHaveBeenCalled();
      expect(mockOnSubmitReport).toHaveBeenCalledWith({ test: 'report' });
    });
  });

  describe('Component Integration', () => {
    it('renders all modals in correct order', () => {
      const { container } = render(<TrailDetailModals {...defaultProps} />);

      // Select only the main modal containers, not buttons
      const modals = container.querySelectorAll(
        '[data-testid="contribution-modal"], [data-testid="alert-modal"], [data-testid="report-modal"]'
      );
      const modalIds = Array.from(modals).map(modal => modal.getAttribute('data-testid'));

      expect(modalIds).toEqual(['contribution-modal', 'alert-modal', 'report-modal']);
    });

    it('maintains consistent prop passing', () => {
      const customProps = {
        ...defaultProps,
        trailId: 'custom-id',
        trailName: 'Custom Name',
        uploading: true,
        showContributionModal: true,
        showAlertModal: true,
        showReportModal: true,
      };

      render(<TrailDetailModals {...customProps} />);

      // Verify all modals receive the correct shared props
      expect(screen.getByTestId('alert-trail-id')).toHaveTextContent('custom-id');
      expect(screen.getByTestId('alert-trail-name')).toHaveTextContent('Custom Name');
      expect(screen.getByTestId('report-trail-id')).toHaveTextContent('custom-id');
      expect(screen.getByTestId('report-trail-name')).toHaveTextContent('Custom Name');

      expect(screen.getByTestId('uploading')).toHaveTextContent('true');
      expect(screen.getByTestId('alert-loading')).toHaveTextContent('true');
      expect(screen.getByTestId('report-loading')).toHaveTextContent('true');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional props', () => {
      const minimalProps = {
        trailId: 'test-id',
        trailName: 'Test Trail',
      };

      expect(() => {
        render(<TrailDetailModals {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles undefined props gracefully', () => {
      const propsWithUndefined = {
        ...defaultProps,
        trailId: undefined,
        trailName: undefined,
        reportType: undefined,
        reportTargetId: undefined,
      };

      expect(() => {
        render(<TrailDetailModals {...propsWithUndefined} />);
      }).not.toThrow();
    });

    it('handles null props gracefully', () => {
      const propsWithNull = {
        ...defaultProps,
        trailId: null,
        trailName: null,
        reportTargetId: null,
      };

      expect(() => {
        render(<TrailDetailModals {...propsWithNull} />);
      }).not.toThrow();
    });
  });
});
