import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailImageGallery from '../components/trails/TrailImageGallery';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: ({ size, ...props }) => <div data-testid="chevron-left" data-size={size} {...props} />,
  ChevronRight: ({ size, ...props }) => <div data-testid="chevron-right" data-size={size} {...props} />
}));

describe('TrailImageGallery', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
    'https://example.com/image4.jpg'
  ];

  const defaultProps = {
    images: mockImages,
    currentImageIndex: 0,
    onImageChange: jest.fn(),
    onGoToImage: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render nothing when images array is empty', () => {
      const { container } = render(<TrailImageGallery {...defaultProps} images={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when images is null', () => {
      const { container } = render(<TrailImageGallery {...defaultProps} images={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when images is undefined', () => {
      const { container } = render(<TrailImageGallery {...defaultProps} images={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render main image gallery container', () => {
      render(<TrailImageGallery {...defaultProps} />);
      expect(screen.getByRole('img', { name: 'Trail - Image 1' })).toBeInTheDocument();
    });

    it('should render with correct CSS classes', () => {
      const { container } = render(<TrailImageGallery {...defaultProps} />);
      expect(container.querySelector('.trail-detail-image-gallery')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-main-image')).toBeInTheDocument();
    });
  });

  describe('Single Image Display', () => {
    it('should display single image without navigation controls', () => {
      render(<TrailImageGallery {...defaultProps} images={['https://example.com/single.jpg']} />);
      
      expect(screen.getByRole('img', { name: 'Trail - Image 1' })).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-left')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
      expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
    });

    it('should not render thumbnails for single image', () => {
      const { container } = render(<TrailImageGallery {...defaultProps} images={['https://example.com/single.jpg']} />);
      expect(container.querySelector('.trail-detail-thumbnails')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Images Display', () => {
    it('should display current image based on currentImageIndex', () => {
      render(<TrailImageGallery {...defaultProps} currentImageIndex={2} />);
      
      const mainImage = screen.getByRole('img', { name: 'Trail - Image 3' });
      expect(mainImage).toBeInTheDocument();
      expect(mainImage).toHaveAttribute('src', 'https://example.com/image3.jpg');
    });

    it('should render navigation buttons for multiple images', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('should render image counter for multiple images', () => {
      render(<TrailImageGallery {...defaultProps} currentImageIndex={1} />);
      expect(screen.getByText('2 / 4')).toBeInTheDocument();
    });

    it('should render thumbnails for multiple images', () => {
      const { container } = render(<TrailImageGallery {...defaultProps} />);
      const thumbnailsContainer = container.querySelector('.trail-detail-thumbnails');
      expect(thumbnailsContainer).toBeInTheDocument();
    });
  });

  describe('Navigation Controls', () => {
    it('should call onImageChange with next index when next button is clicked', () => {
      render(<TrailImageGallery {...defaultProps} currentImageIndex={0} />);
      
      const nextButton = screen.getByTestId('chevron-right').closest('button');
      fireEvent.click(nextButton);
      
      expect(defaultProps.onImageChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should call onImageChange with previous index when prev button is clicked', () => {
      render(<TrailImageGallery {...defaultProps} currentImageIndex={1} />);
      
      const prevButton = screen.getByTestId('chevron-left').closest('button');
      fireEvent.click(prevButton);
      
      expect(defaultProps.onImageChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should wrap to last image when clicking prev from first image', () => {
      const onImageChange = jest.fn();
      render(<TrailImageGallery {...defaultProps} currentImageIndex={0} onImageChange={onImageChange} />);
      
      const prevButton = screen.getByTestId('chevron-left').closest('button');
      fireEvent.click(prevButton);
      
      // Get the function passed to onImageChange and call it with 0
      const updateFunction = onImageChange.mock.calls[0][0];
      const result = updateFunction(0);
      expect(result).toBe(3); // Should wrap to last index (4 images, so index 3)
    });

    it('should wrap to first image when clicking next from last image', () => {
      const onImageChange = jest.fn();
      render(<TrailImageGallery {...defaultProps} currentImageIndex={3} onImageChange={onImageChange} />);
      
      const nextButton = screen.getByTestId('chevron-right').closest('button');
      fireEvent.click(nextButton);
      
      // Get the function passed to onImageChange and call it with 3
      const updateFunction = onImageChange.mock.calls[0][0];
      const result = updateFunction(3);
      expect(result).toBe(0); // Should wrap to first index
    });

    it('should have correct aria-labels for navigation buttons', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      const prevButton = screen.getByLabelText('Previous image');
      const nextButton = screen.getByLabelText('Next image');
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Thumbnail Navigation', () => {
    it('should render correct number of thumbnails', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      const thumbnails = screen.getAllByAltText(/Thumbnail \d+/);
      expect(thumbnails).toHaveLength(4);
    });

    it('should call onGoToImage when thumbnail is clicked', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      const secondThumbnail = screen.getByAltText('Thumbnail 2');
      fireEvent.click(secondThumbnail);
      
      expect(defaultProps.onGoToImage).toHaveBeenCalledWith(1);
    });

    it('should highlight active thumbnail', () => {
      const { container } = render(<TrailImageGallery {...defaultProps} currentImageIndex={2} />);
      
      const thumbnails = container.querySelectorAll('.trail-detail-thumbnail');
      expect(thumbnails[2]).toHaveClass('active');
      
      // Other thumbnails should not have active class
      expect(thumbnails[0]).not.toHaveClass('active');
      expect(thumbnails[1]).not.toHaveClass('active');
      expect(thumbnails[3]).not.toHaveClass('active');
    });

    it('should have correct src attributes for thumbnails', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      const thumbnails = screen.getAllByAltText(/Thumbnail \d+/);
      thumbnails.forEach((thumbnail, index) => {
        expect(thumbnail).toHaveAttribute('src', mockImages[index]);
      });
    });
  });

  describe('Image Display', () => {
    it('should display correct image based on currentImageIndex', () => {
      const { rerender } = render(<TrailImageGallery {...defaultProps} currentImageIndex={0} />);
      
      let mainImage = screen.getByRole('img', { name: 'Trail - Image 1' });
      expect(mainImage).toHaveAttribute('src', 'https://example.com/image1.jpg');
      
      rerender(<TrailImageGallery {...defaultProps} currentImageIndex={2} />);
      mainImage = screen.getByRole('img', { name: 'Trail - Image 3' });
      expect(mainImage).toHaveAttribute('src', 'https://example.com/image3.jpg');
    });

    it('should have correct alt text for main image', () => {
      render(<TrailImageGallery {...defaultProps} currentImageIndex={1} />);
      
      const mainImage = screen.getByRole('img', { name: 'Trail - Image 2' });
      expect(mainImage).toHaveAttribute('alt', 'Trail - Image 2');
    });

    it('should have correct alt text for thumbnails', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      const thumbnails = screen.getAllByAltText(/Thumbnail \d+/);
      thumbnails.forEach((thumbnail, index) => {
        expect(thumbnail).toHaveAttribute('alt', `Thumbnail ${index + 1}`);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle currentImageIndex out of bounds gracefully', () => {
      render(<TrailImageGallery {...defaultProps} currentImageIndex={10} />);
      
      // Should still render, but might show undefined image
      const mainImage = screen.getByAltText('Trail - Image 11');
      expect(mainImage).toBeInTheDocument();
    });

    it('should handle negative currentImageIndex', () => {
      render(<TrailImageGallery {...defaultProps} currentImageIndex={-1} />);
      
      const mainImage = screen.getByAltText('Trail - Image 0');
      expect(mainImage).toBeInTheDocument();
    });

    it('should handle images with special characters in URLs', () => {
      const specialImages = [
        'https://example.com/image with spaces.jpg',
        'https://example.com/image-with-dashes.jpg',
        'https://example.com/image_with_underscores.jpg',
        'https://example.com/image%20encoded.jpg'
      ];
      
      render(<TrailImageGallery {...defaultProps} images={specialImages} />);
      
      const mainImage = screen.getByRole('img', { name: 'Trail - Image 1' });
      expect(mainImage).toHaveAttribute('src', specialImages[0]);
    });

    it('should handle very long image URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000) + '.jpg';
      const longImages = [longUrl];
      
      render(<TrailImageGallery {...defaultProps} images={longImages} />);
      
      const mainImage = screen.getByRole('img', { name: 'Trail - Image 1' });
      expect(mainImage).toHaveAttribute('src', longUrl);
    });

    it('should handle images array with undefined/null elements', () => {
      const mixedImages = [
        'https://example.com/image1.jpg',
        null,
        'https://example.com/image3.jpg',
        undefined
      ];
      
      render(<TrailImageGallery {...defaultProps} images={mixedImages} />);
      
      // Should still render the component
      const mainImage = screen.getByAltText('Trail - Image 1');
      expect(mainImage).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles for navigation', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      const prevButton = screen.getByLabelText('Previous image');
      const nextButton = screen.getByLabelText('Next image');
      
      expect(prevButton.tagName).toBe('BUTTON');
      expect(nextButton.tagName).toBe('BUTTON');
    });

    it('should have proper alt text for all images', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      const mainImage = screen.getByRole('img', { name: 'Trail - Image 1' });
      expect(mainImage).toHaveAttribute('alt');
      
      const thumbnails = screen.getAllByAltText(/Thumbnail \d+/);
      thumbnails.forEach(thumbnail => {
        expect(thumbnail).toHaveAttribute('alt');
      });
    });

    it('should be keyboard accessible for thumbnail navigation', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      const thumbnails = screen.getAllByAltText(/Thumbnail \d+/);
      thumbnails.forEach(thumbnail => {
        // Thumbnails should be clickable (have click handlers)
        expect(() => fireEvent.click(thumbnail)).not.toThrow();
      });
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many images', () => {
      const manyImages = Array.from({ length: 100 }, (_, i) => `https://example.com/image${i}.jpg`);
      
      const startTime = performance.now();
      render(<TrailImageGallery {...defaultProps} images={manyImages} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
      expect(screen.getAllByAltText(/Thumbnail \d+/)).toHaveLength(100);
    });

    it('should not re-render unnecessarily when props are the same', () => {
      const { rerender } = render(<TrailImageGallery {...defaultProps} />);
      const initialImage = screen.getByRole('img', { name: 'Trail - Image 1' });
      
      rerender(<TrailImageGallery {...defaultProps} />);
      const afterRerender = screen.getByRole('img', { name: 'Trail - Image 1' });
      
      expect(initialImage).toBe(afterRerender);
    });
  });

  describe('Icon Props', () => {
    it('should pass correct size prop to navigation icons', () => {
      render(<TrailImageGallery {...defaultProps} />);
      
      const prevIcon = screen.getByTestId('chevron-left');
      const nextIcon = screen.getByTestId('chevron-right');
      
      expect(prevIcon).toHaveAttribute('data-size', '20');
      expect(nextIcon).toHaveAttribute('data-size', '20');
    });
  });

  describe('Callback Functions', () => {
    it('should handle undefined onImageChange gracefully', () => {
      expect(() => {
        render(<TrailImageGallery {...defaultProps} onImageChange={undefined} />);
      }).not.toThrow();
    });

    it('should handle undefined onGoToImage gracefully', () => {
      expect(() => {
        render(<TrailImageGallery {...defaultProps} onGoToImage={undefined} />);
      }).not.toThrow();
    });

    it('should call onImageChange with function that updates index correctly', () => {
      const onImageChange = jest.fn();
      render(<TrailImageGallery {...defaultProps} onImageChange={onImageChange} />);
      
      const nextButton = screen.getByTestId('chevron-right').closest('button');
      fireEvent.click(nextButton);
      
      expect(onImageChange).toHaveBeenCalledWith(expect.any(Function));
      
      // Test the function passed to onImageChange
      const updateFunction = onImageChange.mock.calls[0][0];
      expect(updateFunction(0)).toBe(1);
      expect(updateFunction(1)).toBe(2);
      expect(updateFunction(3)).toBe(0); // Wrap around
    });
  });
});
