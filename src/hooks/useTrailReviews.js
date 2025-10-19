import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useTrailReviews = () => {
  const [trailReviews, setTrailReviews] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [dataCache, setDataCache] = useState({});

  const fetchTrailReviews = async trailId => {
    try {
      // Check cache first
      if (dataCache[trailId]) {
        setTrailReviews(prev => ({
          ...prev,
          [trailId]: dataCache[trailId],
        }));
        return;
      }

      setLoadingStates(prev => ({
        ...prev,
        [trailId]: true,
      }));

      const reviewsRef = collection(db, 'Trails', trailId, 'reviews');
      const querySnapshot = await getDocs(reviewsRef);

      const reviewsData = querySnapshot.docs
        .map(doc => ({
          id: String(doc.id),
          trailId: String(trailId),
          userId: String(doc.data().userId || 'Unknown'),
          userName: String(doc.data().userName || 'Unknown'),
          rating: typeof doc.data().rating === 'number' ? doc.data().rating : 0,
          comment: String(doc.data().comment || ''),
          message: String(doc.data().message || ''),
          timestamp: doc.data().timestamp,
        }))
        .sort((a, b) => {
          // Handle both Firestore Timestamp and string timestamps
          const getTimestamp = review => {
            if (review.timestamp && typeof review.timestamp.toDate === 'function') {
              return review.timestamp.toDate();
            } else if (review.timestamp) {
              return new Date(review.timestamp);
            }
            return new Date(0);
          };

          return getTimestamp(b) - getTimestamp(a);
        });

      setTrailReviews(prev => ({
        ...prev,
        [trailId]: reviewsData,
      }));

      // Cache the reviews data
      setDataCache(prev => ({
        ...prev,
        [trailId]: reviewsData,
      }));
    } catch (err) {
      console.warn(`Failed to fetch reviews for trail ${trailId}:`, err.message);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [trailId]: false,
      }));
    }
  };

  const deleteReview = async (reviewId, trailId) => {
    try {
      await deleteDoc(doc(db, 'Trails', trailId, 'reviews', reviewId));

      // Update trail reviews
      setTrailReviews(prev => ({
        ...prev,
        [trailId]: prev[trailId]?.filter(review => review.id !== reviewId) || [],
      }));

      // Update cache
      setDataCache(prev => ({
        ...prev,
        [trailId]: prev[trailId]?.filter(review => review.id !== reviewId) || [],
      }));

      return true;
    } catch (err) {
      console.error('Failed to delete review:', err);
      return false;
    }
  };

  return {
    trailReviews,
    loadingStates,
    fetchTrailReviews,
    deleteReview,
  };
};
