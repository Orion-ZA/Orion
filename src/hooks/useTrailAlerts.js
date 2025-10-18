import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useTrailAlerts = () => {
  const [trailAlerts, setTrailAlerts] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [dataCache, setDataCache] = useState({});

  // Helper function to check if an alert is expired
  const isAlertExpired = useCallback((alert) => {
    if (!alert.isTimed || !alert.expiresAt) return false;
    
    const now = new Date();
    const expiresAt = alert.expiresAt.toDate ? alert.expiresAt.toDate() : new Date(alert.expiresAt);
    return now >= expiresAt;
  }, []);

  // Helper function to calculate time remaining for timed alerts
  const getTimeRemaining = useCallback((alert) => {
    if (!alert.isTimed || !alert.expiresAt) return null;
    
    const now = new Date();
    const expiresAt = alert.expiresAt.toDate ? alert.expiresAt.toDate() : new Date(alert.expiresAt);
    const timeRemaining = expiresAt.getTime() - now.getTime();
    
    if (timeRemaining <= 0) return null;
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, totalMs: timeRemaining };
  }, []);

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
        timestamp: doc.data().timestamp,
        isTimed: Boolean(doc.data().isTimed),
        expiresAt: doc.data().expiresAt
      })).filter(alert => {
        // Filter out expired alerts on the client side as well
        return !isAlertExpired(alert);
      }).sort((a, b) => {
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

  // Batch fetch alerts for multiple trails at once (more efficient)
  const fetchMultipleTrailAlerts = async (trailIds) => {
    if (!trailIds || trailIds.length === 0) return;
    
    console.log(`Batch fetching alerts for ${trailIds.length} trails`);
    
    // Set loading states for all trails
    setLoadingStates(prev => {
      const newStates = { ...prev };
      trailIds.forEach(trailId => {
        newStates[trailId] = true;
      });
      return newStates;
    });
    
    try {
      // Check cache first for all trails
      const cachedResults = {};
      const uncachedTrailIds = [];
      
      trailIds.forEach(trailId => {
        if (dataCache[trailId]) {
          cachedResults[trailId] = dataCache[trailId];
        } else {
          uncachedTrailIds.push(trailId);
        }
      });
      
      console.log(`Found ${Object.keys(cachedResults).length} cached, fetching ${uncachedTrailIds.length} from database`);
      
      let databaseResults = {};
      
      // Only fetch from database if there are uncached trails
      if (uncachedTrailIds.length > 0) {
        // Use Firestore's whereIn for efficient batch querying
        // Note: whereIn has a limit of 10 items, so we need to batch if more than 10
        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < uncachedTrailIds.length; i += batchSize) {
          batches.push(uncachedTrailIds.slice(i, i + batchSize));
        }
        
        console.log(`Making ${batches.length} database queries for ${uncachedTrailIds.length} trails`);
        
        // Fetch all batches in parallel
        const batchPromises = batches.map(async (batch) => {
          try {
            const alertsRef = collection(db, 'Alerts');
            const q = query(alertsRef, where('trailId', 'in', batch));
            const querySnapshot = await getDocs(q);
            
            const batchResults = {};
            batch.forEach(trailId => {
              batchResults[trailId] = [];
            });
            
            querySnapshot.docs.forEach(doc => {
              const alertData = {
                id: String(doc.id),
                trailId: String(doc.data().trailId),
                type: String(doc.data().type || 'general'),
                message: String(doc.data().message || ''),
                comment: String(doc.data().comment || ''),
                isActive: Boolean(doc.data().isActive),
                timestamp: doc.data().timestamp,
                isTimed: Boolean(doc.data().isTimed),
                expiresAt: doc.data().expiresAt
              };
              
              if (batchResults[alertData.trailId]) {
                batchResults[alertData.trailId].push(alertData);
              }
            });
            
            // Process each trail's alerts
            Object.keys(batchResults).forEach(trailId => {
              batchResults[trailId] = batchResults[trailId]
                .filter(alert => !isAlertExpired(alert))
                .sort((a, b) => {
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
            });
            
            return batchResults;
          } catch (err) {
            console.warn(`Failed to fetch batch alerts:`, err.message);
            return {};
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Merge all batch results
        batchResults.forEach(batchResult => {
          Object.assign(databaseResults, batchResult);
        });
        
        console.log(`✓ Database fetch completed for ${Object.keys(databaseResults).length} trails`);
      }
      
      // Combine cached and database results
      const allResults = { ...cachedResults, ...databaseResults };
      
      // Update state with all results
      setTrailAlerts(prev => {
        const newAlerts = { ...prev };
        Object.keys(allResults).forEach(trailId => {
          newAlerts[trailId] = allResults[trailId];
        });
        return newAlerts;
      });
      
      // Update cache with database results
      setDataCache(prev => {
        const newCache = { ...prev };
        Object.keys(databaseResults).forEach(trailId => {
          newCache[trailId] = databaseResults[trailId];
        });
        return newCache;
      });
      
      console.log(`✓ Batch loaded alerts for ${Object.keys(allResults).length} trails total`);
    } catch (err) {
      console.error('Failed to batch fetch alerts:', err);
    } finally {
      // Clear loading states for all trails
      setLoadingStates(prev => {
        const newStates = { ...prev };
        trailIds.forEach(trailId => {
          newStates[trailId] = false;
        });
        return newStates;
      });
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
    fetchMultipleTrailAlerts,
    deleteAlert,
    isAlertExpired,
    getTimeRemaining
  };
};
