import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewsTrailSkeleton from '../components/ReviewsTrailSkeleton';

describe('ReviewsTrailSkeleton Component', () => {
  test('renders skeleton loading state', () => {
    render(<ReviewsTrailSkeleton />);
    
    // Check that the main container is rendered
    const trailCard = document.querySelector('.trail-card');
    expect(trailCard).toBeInTheDocument();
    
    // Check that loading spinner is present
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Check that skeleton elements are present
    expect(document.querySelector('.skeleton-text')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-title')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-rating')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-subtitle')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-button')).toBeInTheDocument();
    expect(document.querySelector('.skeleton-review')).toBeInTheDocument();
  });

  test('renders correct number of skeleton buttons', () => {
    render(<ReviewsTrailSkeleton />);
    
    const skeletonButtons = document.querySelectorAll('.skeleton-button');
    expect(skeletonButtons).toHaveLength(3);
  });

  test('renders correct number of skeleton reviews', () => {
    render(<ReviewsTrailSkeleton />);
    
    const skeletonReviews = document.querySelectorAll('.skeleton-review');
    expect(skeletonReviews).toHaveLength(2);
  });

  test('has proper structure for trail card layout', () => {
    render(<ReviewsTrailSkeleton />);
    
    // Check main sections exist
    expect(document.querySelector('.trail-image')).toBeInTheDocument();
    expect(document.querySelector('.trail-header')).toBeInTheDocument();
    expect(document.querySelector('.trail-actions')).toBeInTheDocument();
    expect(document.querySelector('.recent-reviews')).toBeInTheDocument();
  });

  test('displays loading spinner with correct icon', () => {
    render(<ReviewsTrailSkeleton />);
    
    // Check that the loading spinner is present
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Check loading text
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
