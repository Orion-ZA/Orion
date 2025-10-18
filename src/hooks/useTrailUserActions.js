import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useToast } from '../components/ToastContext';
import { updateUserTrailAction } from '../utils/trailApi';

export const useTrailUserActions = () => {
  const { show: showToast } = useToast();
  const [user, setUser] = useState(null);
  const [userSaved, setUserSaved] = useState({ favourites: [], wishlist: [], completed: [] });

  // Fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (user) {
        setUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'Users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            const extractTrailIds = (array) => {
              if (!Array.isArray(array)) return [];
              return array.map(item => {
                if (typeof item === 'string') return item;
                if (item && item.id) return item.id;
                if (item && item._key && item._key.path) {
                  const pathParts = item._key.path.segments;
                  return pathParts[pathParts.length - 1];
                }
                if (item && typeof item === 'object' && item.path) {
                  const pathParts = item.path.split('/');
                  return pathParts[pathParts.length - 1];
                }
                console.warn('Unknown item format in user saved array:', item);
                return null;
              }).filter(Boolean);
            };
            
            const processedUserSaved = {
              favourites: extractTrailIds(userData.favourites),
              wishlist: extractTrailIds(userData.wishlist),
              completed: extractTrailIds(userData.completed)
            };
            
            setUserSaved(processedUserSaved);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserSaved({ favourites: [], wishlist: [], completed: [] });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleTrailAction = async (action, trailId) => {
    if (!user) {
      showToast('Please log in to save trails', 'error');
      return;
    }

    try {
      const currentArray = userSaved[action] || [];
      const result = await updateUserTrailAction(user.uid, action, trailId, currentArray);
      
      if (result.action === 'remove') {
        setUserSaved(prev => ({
          ...prev,
          [action]: prev[action].filter(id => id !== trailId)
        }));
        showToast(`Removed from ${action}`, 'success');
      } else {
        setUserSaved(prev => ({
          ...prev,
          [action]: [...prev[action], trailId]
        }));
        showToast(`Added to ${action}`, 'success');
      }
    } catch (error) {
      console.error(`Error updating ${action}:`, error);
      showToast(`Failed to update ${action}`, 'error');
    }
  };

  return {
    user,
    userSaved,
    handleTrailAction
  };
};
