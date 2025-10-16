import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TrailImageGallery = ({ images, currentImageIndex, onImageChange, onGoToImage }) => {
  if (!images || images.length === 0) return null;

  const nextImage = () => {
    onImageChange((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    onImageChange((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="trail-detail-image-gallery">
      <div className="trail-detail-main-image">
        <img 
          src={images[currentImageIndex]} 
          alt={`Trail - Image ${currentImageIndex + 1}`}
        />
        
        {images.length > 1 && (
          <>
            <button 
              className="trail-detail-image-nav-btn prev" 
              onClick={prevImage}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className="trail-detail-image-nav-btn next" 
              onClick={nextImage}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
            
            <div className="trail-detail-image-counter">
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="trail-detail-thumbnails">
          {images.map((image, index) => (
            <div
              key={index}
              className={`trail-detail-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
              onClick={() => onGoToImage(index)}
            >
              <img src={image} alt={`Thumbnail ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrailImageGallery;
