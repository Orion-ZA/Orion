import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { fetchTrailData } from '../utils/trailApi';

export const useTrailData = () => {
  const { trailId } = useParams();
  const location = useLocation();
  
  const [trail, setTrail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authorName, setAuthorName] = useState('Unknown');

  // Fetch trail data
  useEffect(() => {
    const loadTrailData = async () => {
      try {
        setLoading(true);
        
        // First check if trail data was passed via navigation state
        if (location.state?.trail) {
          setTrail(location.state.trail);
          setLoading(false);
          return;
        }

        // If no trail data in state, fetch from Firestore
        if (trailId) {
          const trailData = await fetchTrailData(trailId);
          setTrail(trailData);
        } else {
          setError('Invalid trail ID');
        }
      } catch (err) {
        console.error('Error fetching trail:', err);
        setError('Failed to load trail');
      } finally {
        setLoading(false);
      }
    };

    loadTrailData();
  }, [trailId, location.state]);

  // Fetch author name
  useEffect(() => {
    const fetchAuthorName = async () => {
      if (!trail?.createdBy) {
        setAuthorName('Unknown');
        return;
      }

      try {
        const createdByRaw = trail.createdBy;
        let uid;
        
        if (typeof createdByRaw === 'string') {
          uid = createdByRaw.includes('/') ? createdByRaw.split('/').pop() : createdByRaw;
        } else if (createdByRaw && typeof createdByRaw === 'object') {
          if (createdByRaw.id) {
            uid = createdByRaw.id;
          } else if (createdByRaw._key && createdByRaw._key.path) {
            const pathParts = createdByRaw._key.path.segments;
            uid = pathParts[pathParts.length - 1];
          } else if (createdByRaw._path && createdByRaw._path.segments) {
            const pathParts = createdByRaw._path.segments;
            uid = pathParts[pathParts.length - 1];
          } else {
            console.warn('Unknown createdBy object format:', createdByRaw);
            setAuthorName('Unknown');
            return;
          }
        } else {
          uid = createdByRaw;
        }

        if (!uid || uid === 'sample' || uid === 'unknown' || typeof uid !== 'string') {
          setAuthorName(uid === 'sample' ? 'Sample User' : 'Unknown');
          return;
        }

        const userDoc = await getDoc(doc(db, 'Users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAuthorName(userData.profileInfo?.displayName || userData.displayName || userData.name || 'Unknown');
        } else {
          setAuthorName('Unknown');
        }
      } catch (error) {
        console.error('Error fetching author name:', error);
        setAuthorName('Unknown');
      }
    };

    fetchAuthorName();
  }, [trail?.createdBy]);

  return {
    trail,
    loading,
    error,
    authorName,
    setTrail
  };
};
