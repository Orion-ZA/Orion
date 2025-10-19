import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useTrailsData = () => {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrails = async () => {
    try {
      setLoading(true);
      const trailsRef = collection(db, 'Trails');
      const q = query(trailsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const trailsData = querySnapshot.docs.map(doc => ({
        id: String(doc.id),
        name: String(doc.data().name || 'Unnamed Trail'),
        description: String(doc.data().description || ''),
        difficulty: String(doc.data().difficulty || 'easy'),
        distance: typeof doc.data().distance === 'number' ? doc.data().distance : 0,
        elevationGain: typeof doc.data().elevationGain === 'number' ? doc.data().elevationGain : 0,
        tags: Array.isArray(doc.data().tags) ? doc.data().tags.map(tag => String(tag)) : [],
        status: String(doc.data().status || 'open'),
        photos: Array.isArray(doc.data().photos)
          ? doc.data().photos.map(photo => String(photo))
          : [],
        createdBy: doc.data().createdBy?.id
          ? String(doc.data().createdBy.id)
          : String(doc.data().createdBy || 'Unknown'),
        location: doc.data().location,
        gpsRoute: doc.data().gpsRoute,
        createdAt: doc.data().createdAt,
        lastUpdated: doc.data().lastUpdated,
      }));

      setTrails(trailsData);
    } catch (err) {
      setError('Failed to fetch trails: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrail = async trailId => {
    try {
      await deleteDoc(doc(db, 'Trails', trailId));
      setTrails(prev => prev.filter(trail => trail.id !== trailId));
      return true;
    } catch (err) {
      setError('Failed to delete trail: ' + err.message);
      return false;
    }
  };

  const updateTrail = async (trailId, updates) => {
    try {
      await updateDoc(doc(db, 'Trails', trailId), updates);
      setTrails(prev =>
        prev.map(trail => (trail.id === trailId ? { ...trail, ...updates } : trail))
      );
      return true;
    } catch (err) {
      setError('Failed to update trail: ' + err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchTrails();
  }, []);

  return {
    trails,
    loading,
    error,
    fetchTrails,
    deleteTrail,
    updateTrail,
    setError,
  };
};
