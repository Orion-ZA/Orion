import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useTrailAlerts = () => {
  const [trailAlerts, setTrailAlerts] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [dataCache, setDataCache] = useState({});

  const fetchTrailAlerts = async (trailId) => {
    try {
      // Check cache first
      if (dataCache[trailId]) {
        setTrailAlerts(prev => ({
          ...prev,
          [trailId]: dataCache[trailId]
        }));
        return;
      }

      setLoadingStates(prev => ({
        ...prev,
        [trailId]: true
      }));

      const alertsRef = collection(db, 'Alerts');
      const q = query(alertsRef, where('trailId', '==', trailId));
      const querySnapshot = await getDocs(q);
      
      const alertsData = querySnapshot.docs.map(doc => ({
        id: String(doc.id),
        trailId: String(doc.data().trailId || trailId),
        type: String(doc.data().type || 'general'),
        message: String(doc.data().message || ''),
        comment: String(doc.data().comment || ''),
        isActive: Boolean(doc.data().isActive),
        timestamp: doc.data().timestamp
      })).sort((a, b) => {
        // Handle both Firestore Timestamp and string timestamps
        const getTimestamp = (alert) => {
          if (alert.timestamp && typeof alert.timestamp.toDate === 'function') {
            return alert.timestamp.toDate();
          } else if (alert.timestamp) {
            return new Date(alert.timestamp);
          }
          return new Date(0);
        };
        
        return getTimestamp(b) - getTimestamp(a);
      });
      
      setTrailAlerts(prev => ({
        ...prev,
        [trailId]: alertsData
      }));

      // Cache the alerts data
      setDataCache(prev => ({
        ...prev,
        [trailId]: alertsData
      }));
    } catch (err) {
      console.warn(`Failed to fetch alerts for trail ${trailId}:`, err.message);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [trailId]: false
      }));
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await deleteDoc(doc(db, 'Alerts', alertId));
      
      // Find which trail this alert belongs to
      let trailId = null;
      Object.keys(trailAlerts).forEach(id => {
        if (trailAlerts[id].some(alert => alert.id === alertId)) {
          trailId = id;
        }
      });
      
      // Update all trail alerts
      setTrailAlerts(prev => {
        const updated = {};
        Object.keys(prev).forEach(trailId => {
          updated[trailId] = prev[trailId].filter(alert => alert.id !== alertId);
        });
        return updated;
      });
      
      // Update cache
      if (trailId) {
        setDataCache(prev => ({
          ...prev,
          [trailId]: prev[trailId]?.filter(alert => alert.id !== alertId) || []
        }));
      }
      
      return { success: true, trailId };
    } catch (err) {
      console.error('Failed to delete alert:', err);
      return { success: false, trailId: null };
    }
  };

  return {
    trailAlerts,
    loadingStates,
    fetchTrailAlerts,
    deleteAlert
  };
};
