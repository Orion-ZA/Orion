import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ContributionModal from '../components/trails/ContributionModal';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: ({ size, fill, color, ...props }) => <div data-testid="star" data-size={size} data-fill={fill} data-color={color} {...props} />
}));

describe('ContributionModal', () => {
  const defaultProps = {
    showContributionModal: true,
    contributionType: 'review',
    newReview: '',
    setNewReview: jest.fn(),
    newRating: 5,
    setNewRating: jest.fn(),
    isAnonymous: false,
    setIsAnonymous: jest.fn(),
    newImages: [],
    alertMessage: '',
    setAlertMessage: jest.fn(),
    alertType: 'general',
    setAlertType: jest.fn(),
    uploading: false,
    onCloseContributionModal: jest.fn(),
    onAddReview: jest.fn(),
    onAddImages: jest.fn(),
    onAddAlert: jest.fn(),
    onImageUpload: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render nothing when showContributionModal is false', () => {
      const { container } = render(<ContributionModal {...defaultProps} showContributionModal={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render modal when showContributionModal is true', () => {
      const { container } = render(<ContributionModal {...defaultProps} />);
      
      expect(container.querySelector('.trail-detail-modal-overlay')).toBeInTheDocument();
      expect(screen.getByText('Add Review')).toBeInTheDocument();
    });

    it('should render with correct CSS classes', () => {
      const { container } = render(<ContributionModal {...defaultProps} />);
      
      expect(container.querySelector('.trail-detail-modal-overlay')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-modal-content')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-modal-header')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-modal-body')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-modal-footer')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<ContributionModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: '×' });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Modal Header', () => {
    it('should show correct title for review type', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      expect(screen.getByText('Add Review')).toBeInTheDocument();
    });

    it('should show correct title for image type', () => {
      render(<ContributionModal {...defaultProps} contributionType="image" />);
      
      expect(screen.getByText('Upload Images')).toBeInTheDocument();
    });

    it('should show correct title for alert type', () => {
      render(<ContributionModal {...defaultProps} contributionType="alert" />);
      
      expect(screen.getByText('Add Alert')).toBeInTheDocument();
    });

    it('should call onCloseContributionModal when close button is clicked', () => {
      render(<ContributionModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: '×' });
      fireEvent.click(closeButton);
      
      expect(defaultProps.onCloseContributionModal).toHaveBeenCalledTimes(1);
    });

    it('should call onCloseContributionModal when overlay is clicked', () => {
      const { container } = render(<ContributionModal {...defaultProps} />);
      
      const overlay = container.querySelector('.trail-detail-modal-overlay');
      fireEvent.click(overlay);
      
      expect(defaultProps.onCloseContributionModal).toHaveBeenCalledTimes(1);
    });

    it('should not call onCloseContributionModal when modal content is clicked', () => {
      const { container } = render(<ContributionModal {...defaultProps} />);
      
      const modalContent = container.querySelector('.trail-detail-modal-content');
      fireEvent.click(modalContent);
      
      expect(defaultProps.onCloseContributionModal).not.toHaveBeenCalled();
    });
  });

  describe('Review Form', () => {
    it('should render review form when contributionType is review', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Your Review')).toBeInTheDocument();
      expect(screen.getByText('Post anonymously')).toBeInTheDocument();
    });

    it('should render star rating input', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const stars = screen.getAllByTestId('star');
      expect(stars).toHaveLength(5);
    });

    it('should call setNewRating when star is clicked', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const stars = screen.getAllByTestId('star');
      fireEvent.click(stars[2]); // Click third star
      
      expect(defaultProps.setNewRating).toHaveBeenCalledWith(3);
    });

    it('should highlight stars based on current rating', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" newRating={3} />);
      
      const stars = screen.getAllByTestId('star');
      
      // First three stars should be filled
      expect(stars[0]).toHaveAttribute('data-fill', 'currentColor');
      expect(stars[1]).toHaveAttribute('data-fill', 'currentColor');
      expect(stars[2]).toHaveAttribute('data-fill', 'currentColor');
      
      // Last two stars should not be filled
      expect(stars[3]).toHaveAttribute('data-fill', 'none');
      expect(stars[4]).toHaveAttribute('data-fill', 'none');
    });

    it('should render textarea for review comment', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', 'Share your experience on this trail...');
    });

    it('should call setNewReview when textarea changes', async () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Great trail!' } });
      
      expect(defaultProps.setNewReview).toHaveBeenCalled();
    });

    it('should render anonymous checkbox', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should call setIsAnonymous when checkbox is clicked', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(defaultProps.setIsAnonymous).toHaveBeenCalledWith(true);
    });

    it('should show checkbox as checked when isAnonymous is true', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" isAnonymous={true} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  describe('Image Upload Form', () => {
    it('should render image upload form when contributionType is image', () => {
      render(<ContributionModal {...defaultProps} contributionType="image" />);
      
      expect(screen.getByText('Select Images')).toBeInTheDocument();
    });

    it('should render file input for images', () => {
      render(<ContributionModal {...defaultProps} contributionType="image" />);
      
      const fileInput = screen.getByDisplayValue('');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('should call onImageUpload when files are selected', () => {
      render(<ContributionModal {...defaultProps} contributionType="image" />);
      
      const fileInput = screen.getByDisplayValue('');
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(defaultProps.onImageUpload).toHaveBeenCalled();
    });

    it('should show image preview when images are selected', () => {
      render(<ContributionModal {...defaultProps} contributionType="image" newImages={['image1.jpg', 'image2.jpg']} />);
      
      expect(screen.getByText('2 image(s) selected')).toBeInTheDocument();
    });

    it('should not show image preview when no images are selected', () => {
      render(<ContributionModal {...defaultProps} contributionType="image" newImages={[]} />);
      
      expect(screen.queryByText(/image\(s\) selected/)).not.toBeInTheDocument();
    });
  });

  describe('Alert Form', () => {
    it('should render alert form when contributionType is alert', () => {
      render(<ContributionModal {...defaultProps} contributionType="alert" />);
      
      expect(screen.getByText('Alert Type')).toBeInTheDocument();
      expect(screen.getByText('Alert Message')).toBeInTheDocument();
    });

    it('should render alert type select dropdown', () => {
      render(<ContributionModal {...defaultProps} contributionType="alert" />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('general');
    });

    it('should call setAlertType when select changes', () => {
      render(<ContributionModal {...defaultProps} contributionType="alert" />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'safety' } });
      
      expect(defaultProps.setAlertType).toHaveBeenCalledWith('safety');
    });

    it('should render all alert type options', () => {
      render(<ContributionModal {...defaultProps} contributionType="alert" />);
      
      const select = screen.getByRole('combobox');
      const options = Array.from(select.options).map(option => option.value);
      
      expect(options).toContain('general');
      expect(options).toContain('safety');
      expect(options).toContain('weather');
      expect(options).toContain('maintenance');
      expect(options).toContain('wildlife');
    });

    it('should render alert message textarea', () => {
      render(<ContributionModal {...defaultProps} contributionType="alert" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', 'Describe the alert or important information...');
    });

    it('should call setAlertMessage when textarea changes', async () => {
      render(<ContributionModal {...defaultProps} contributionType="alert" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Trail is closed due to maintenance' } });
      
      expect(defaultProps.setAlertMessage).toHaveBeenCalled();
    });
  });

  describe('Modal Footer', () => {
    it('should render cancel and submit buttons', () => {
      render(<ContributionModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should call onCloseContributionModal when cancel button is clicked', () => {
      render(<ContributionModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onCloseContributionModal).toHaveBeenCalledTimes(1);
    });

    it('should call onAddReview when submit button is clicked for review type', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onAddReview).toHaveBeenCalledTimes(1);
    });

    it('should call onAddImages when submit button is clicked for image type', () => {
      render(<ContributionModal {...defaultProps} contributionType="image" />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onAddImages).toHaveBeenCalledTimes(1);
    });

    it('should call onAddAlert when submit button is clicked for alert type', () => {
      render(<ContributionModal {...defaultProps} contributionType="alert" />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      expect(defaultProps.onAddAlert).toHaveBeenCalledTimes(1);
    });

    it('should show uploading state when uploading is true', () => {
      render(<ContributionModal {...defaultProps} uploading={true} />);
      
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
    });

    it('should disable buttons when uploading', () => {
      render(<ContributionModal {...defaultProps} uploading={true} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const submitButton = screen.getByRole('button', { name: 'Submitting...' });
      
      expect(cancelButton).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined contributionType', () => {
      expect(() => {
        render(<ContributionModal {...defaultProps} contributionType={undefined} />);
      }).not.toThrow();
    });

    it('should handle null contributionType', () => {
      expect(() => {
        render(<ContributionModal {...defaultProps} contributionType={null} />);
      }).not.toThrow();
    });

    it('should handle empty contributionType', () => {
      expect(() => {
        render(<ContributionModal {...defaultProps} contributionType="" />);
      }).not.toThrow();
    });

    it('should handle invalid contributionType', () => {
      expect(() => {
        render(<ContributionModal {...defaultProps} contributionType="invalid" />);
      }).not.toThrow();
    });

    it('should handle undefined callback functions gracefully', () => {
      expect(() => {
        render(<ContributionModal {...defaultProps} 
          setNewReview={undefined}
          setNewRating={undefined}
          setIsAnonymous={undefined}
          setAlertMessage={undefined}
          setAlertType={undefined}
          onCloseContributionModal={undefined}
          onAddReview={undefined}
          onAddImages={undefined}
          onAddAlert={undefined}
          onImageUpload={undefined}
        />);
      }).not.toThrow();
    });

    it('should handle null callback functions gracefully', () => {
      expect(() => {
        render(<ContributionModal {...defaultProps} 
          setNewReview={null}
          setNewRating={null}
          setIsAnonymous={null}
          setAlertMessage={null}
          setAlertType={null}
          onCloseContributionModal={null}
          onAddReview={null}
          onAddImages={null}
          onAddAlert={null}
          onImageUpload={null}
        />);
      }).not.toThrow();
    });
  });

  describe('Icon Props', () => {
    it('should pass correct size props to star icons', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const stars = screen.getAllByTestId('star');
      stars.forEach(star => {
        expect(star).toHaveAttribute('data-size', '20');
      });
    });

    it('should pass correct fill and color props to star icons', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" newRating={2} />);
      
      const stars = screen.getAllByTestId('star');
      
      // First two stars should be filled with gold color
      expect(stars[0]).toHaveAttribute('data-fill', 'currentColor');
      expect(stars[0]).toHaveAttribute('data-color', 'gold');
      expect(stars[1]).toHaveAttribute('data-fill', 'currentColor');
      expect(stars[1]).toHaveAttribute('data-color', 'gold');
      
      // Last three stars should not be filled
      expect(stars[2]).toHaveAttribute('data-fill', 'none');
      expect(stars[2]).toHaveAttribute('data-color', '#ccc');
      expect(stars[3]).toHaveAttribute('data-fill', 'none');
      expect(stars[3]).toHaveAttribute('data-color', '#ccc');
      expect(stars[4]).toHaveAttribute('data-fill', 'none');
      expect(stars[4]).toHaveAttribute('data-color', '#ccc');
    });
  });

  describe('Accessibility', () => {
    it('should have proper modal structure', () => {
      const { container } = render(<ContributionModal {...defaultProps} />);
      
      const modalOverlay = container.querySelector('.trail-detail-modal-overlay');
      const modalContent = container.querySelector('.trail-detail-modal-content');
      expect(modalOverlay).toBeInTheDocument();
      expect(modalContent).toBeInTheDocument();
    });

    it('should have accessible form controls', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const textarea = screen.getByRole('textbox');
      const checkbox = screen.getByRole('checkbox');
      
      expect(textarea).toBeInTheDocument();
      expect(checkbox).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<ContributionModal {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      
      // Buttons have implicit button role, don't need explicit role attribute
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should have proper labels for form elements', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Your Review')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with complex data', () => {
      const complexProps = {
        ...defaultProps,
        newReview: 'A'.repeat(1000),
        alertMessage: 'B'.repeat(1000),
        newImages: Array.from({ length: 50 }, (_, i) => `image${i}.jpg`)
      };
      
      const startTime = performance.now();
      render(<ContributionModal {...complexProps} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should not re-render unnecessarily when props are the same', () => {
      const { rerender } = render(<ContributionModal {...defaultProps} />);
      const initialModal = screen.getByText('Add Review');
      
      rerender(<ContributionModal {...defaultProps} />);
      const afterRerender = screen.getByText('Add Review');
      
      expect(initialModal).toBe(afterRerender);
    });
  });

  describe('Form Validation', () => {
    it('should handle empty review text', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" newReview="" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('should handle empty alert message', () => {
      render(<ContributionModal {...defaultProps} contributionType="alert" alertMessage="" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('should handle rating of 0', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" newRating={0} />);
      
      const stars = screen.getAllByTestId('star');
      stars.forEach(star => {
        expect(star).toHaveAttribute('data-fill', 'none');
      });
    });

    it('should handle rating of 5', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" newRating={5} />);
      
      const stars = screen.getAllByTestId('star');
      stars.forEach(star => {
        expect(star).toHaveAttribute('data-fill', 'currentColor');
      });
    });
  });

  describe('Event Handling', () => {
    it('should handle keyboard events on form elements', () => {
      render(<ContributionModal {...defaultProps} contributionType="review" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test review' } });
      
      expect(defaultProps.setNewReview).toHaveBeenCalled();
    });
  });
});
