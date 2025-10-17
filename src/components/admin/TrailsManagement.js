import React, { useState, useEffect } from 'react';
import { MapPin, MessageSquare, AlertTriangle } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import SuccessPopup from '../SuccessPopup';
import TrailCard from './TrailCard';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EditTrailModal from './EditTrailModal';
import TrailsManagementSearch from './TrailsSearchComponent';
import { useTrailsData } from '../../hooks/useTrailsData';
import { useTrailReviews } from '../../hooks/useTrailReviews';
import { useTrailAlerts } from '../../hooks/useTrailAlerts';
import './TrailsManagement.css';
import './AdminUtilities.css';

export default function TrailsManagement() {
  // Custom hooks for data management
  const { trails, loading, error, deleteTrail, updateTrail, setError } = useTrailsData();
  const { trailReviews, loadingStates: reviewsLoading, fetchTrailReviews, deleteReview } = useTrailReviews();
  const { trailAlerts, loadingStates: alertsLoading, fetchTrailAlerts, deleteAlert } = useTrailAlerts();

  // Local state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedTrails, setExpandedTrails] = useState({});
  const [trailCounts, setTrailCounts] = useState({});
  const [editTrail, setEditTrail] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [successPopup, setSuccessPopup] = useState({
    isVisible: false,
    message: ''
  });

  // Success popup helpers
  const showSuccessPopup = (message) => {
    setSuccessPopup({ isVisible: true, message });
  };

  const hideSuccessPopup = () => {
    setSuccessPopup({ isVisible: false, message: '' });
  };

  // Fetch counts for all trails when trails are loaded
  useEffect(() => {
    if (trails.length > 0) {
      fetchAllTrailCounts();
    }
  }, [trails]);

  const fetchAllTrailCounts = async () => {
    const counts = {};
    const batchSize = 10;
    
    for (let i = 0; i < trails.length; i += batchSize) {
      const batch = trails.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (trail) => {
      try {
        // Fetch reviews count
        const reviewsRef = collection(db, 'Trails', String(trail.id), 'reviews');
        const reviewsSnapshot = await getDocs(reviewsRef);
        const reviewsCount = reviewsSnapshot.size;
        
        // Fetch alerts count
        const alertsRef = collection(db, 'Alerts');
        const alertsQuery = query(alertsRef, where('trailId', '==', String(trail.id)));
        const alertsSnapshot = await getDocs(alertsQuery);
        const alertsCount = alertsSnapshot.size;
        
        counts[String(trail.id)] = {
          reviews: reviewsCount,
          alerts: alertsCount
        };
      } catch (err) {
        console.error(`Error fetching counts for trail ${String(trail.id)}:`, err);
            counts[String(trail.id)] = { reviews: 0, alerts: 0 };
      }
        })
      );
    }
    
    setTrailCounts(counts);
  };

  const toggleTrailExpansion = async (trailId) => {
    const isExpanded = expandedTrails[trailId];
    setExpandedTrails(prev => ({
      ...prev,
      [trailId]: !isExpanded
    }));

    if (!isExpanded) {
      await Promise.all([
        fetchTrailReviews(trailId),
        fetchTrailAlerts(trailId)
      ]);
    }
  };

  // Delete handlers
  const handleDeleteTrail = async (trailId, trailName) => {
    const success = await deleteTrail(trailId);
    if (success) {
      // Clean up state
      setExpandedTrails(prev => {
        const updated = { ...prev };
        delete updated[trailId];
        return updated;
      });
      setTrailCounts(prev => {
        const updated = { ...prev };
        delete updated[trailId];
        return updated;
      });
      setDeleteConfirm(null);
      showSuccessPopup(`Trail "${trailName}" has been deleted successfully!`);
    }
  };

  const handleDeleteReview = async (reviewId, trailId, trailName) => {
    const success = await deleteReview(reviewId, trailId);
    if (success) {
      // Update trail counts
      setTrailCounts(prev => ({
        ...prev,
        [trailId]: {
          ...prev[trailId],
          reviews: Math.max(0, (prev[trailId]?.reviews || 0) - 1)
        }
      }));
      setDeleteConfirm(null);
      showSuccessPopup('Review has been deleted successfully!');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    const result = await deleteAlert(alertId);
    if (result.success) {
      // Update trail counts
      setTrailCounts(prev => ({
        ...prev,
        [result.trailId]: {
          ...prev[result.trailId],
          alerts: Math.max(0, (prev[result.trailId]?.alerts || 0) - 1)
        }
      }));
      setDeleteConfirm(null);
      showSuccessPopup('Alert has been deleted successfully!');
    }
  };

  // Edit handlers
  const handleEditTrail = (trail) => {
    console.log('handleEditTrail called with:', trail);
    setEditTrail(trail);
    setEditForm({
      name: trail.name || '',
      description: trail.description || '',
      difficulty: trail.difficulty || 'Easy',
      distance: trail.distance || 0,
      elevationGain: trail.elevationGain || 0,
      tags: Array.isArray(trail.tags) ? trail.tags.join(', ') : '',
      status: trail.status || 'open'
    });
    console.log('Edit trail state set:', trail);
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveTrail = async () => {
    if (!editTrail) return;
    
    // Process the form data
    const processedData = {
      ...editForm,
        tags: editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        lastUpdated: new Date()
      };

    const success = await updateTrail(editTrail.id, processedData);
    if (success) {
      setEditTrail(null);
      setEditForm({});
      showSuccessPopup('Trail updated successfully!');
    }
  };

  // Confirmation handlers
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'trail') {
      await handleDeleteTrail(deleteConfirm.id, deleteConfirm.name);
    } else if (deleteConfirm.type === 'review') {
      await handleDeleteReview(deleteConfirm.id, deleteConfirm.trailId, deleteConfirm.trailName);
    } else if (deleteConfirm.type === 'alert') {
      await handleDeleteAlert(deleteConfirm.id);
    }
  };

  if (loading) {
    return (
      <div className="trails-management">
        <div className="trails-loading">
          <div className="loading-spinner"></div>
          <p>Loading trails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trails-management">
        <div className="trails-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Search filtering logic
  const filteredTrails = trails.filter(trail => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      trail.name?.toLowerCase().includes(searchLower) ||
      trail.description?.toLowerCase().includes(searchLower) ||
      trail.difficulty?.toLowerCase().includes(searchLower) ||
      trail.status?.toLowerCase().includes(searchLower) ||
      trail.createdBy?.toLowerCase().includes(searchLower) ||
      trail.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  // Search handler
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Debug logging
  console.log('TrailsManagement render - deleteConfirm:', deleteConfirm, 'editTrail:', editTrail);

  return (
    <div className="trails-management">
      {/* Header */}
      <div className="trails-header">
        <h2>Trails Management</h2>
        <div className="trails-stats">
          <div className="stat-item">
            <MapPin className="stat-icon" />
            <span>{trails.length} Trails</span>
          </div>
          <div className="stat-item">
            <MessageSquare className="stat-icon" />
            <span>{Object.values(trailCounts).reduce((sum, counts) => sum + (counts.reviews || 0), 0)} Reviews</span>
          </div>
          <div className="stat-item">
            <AlertTriangle className="stat-icon" />
            <span>{Object.values(trailCounts).reduce((sum, counts) => sum + (counts.alerts || 0), 0)} Alerts</span>
          </div>
        </div>
      </div>

      {/* Search Component */}
      <TrailsManagementSearch 
        onSearch={handleSearch}
        placeholder="Search trails by name, description, difficulty, status, creator, or tags..."
      />

      {/* Search Results Info */}
      {searchTerm && (
        <div className="trails-management-search-results-info">
          <span>Found {filteredTrails.length} trail{filteredTrails.length !== 1 ? 's' : ''} matching "{searchTerm}"</span>
        </div>
      )}

      {/* Trails List */}
      <div className="trails-list">
        {filteredTrails.length === 0 ? (
          <div className="empty-state">
            <p>{searchTerm ? `No trails found matching "${searchTerm}"` : 'No trails found'}</p>
          </div>
        ) : (
          filteredTrails.map((trail) => (
            <TrailCard
              key={String(trail.id)}
              trail={{
                id: String(trail.id),
                name: String(trail.name || 'Unnamed Trail'),
                description: String(trail.description || ''),
                difficulty: String(trail.difficulty || 'easy'),
                distance: typeof trail.distance === 'number' ? trail.distance : 0,
                elevationGain: typeof trail.elevationGain === 'number' ? trail.elevationGain : 0,
                tags: Array.isArray(trail.tags) ? trail.tags : [],
                status: String(trail.status || 'open'),
                photos: Array.isArray(trail.photos) ? trail.photos : [],
                createdBy: String(trail.createdBy || 'Unknown'),
                location: trail.location,
                gpsRoute: trail.gpsRoute,
                createdAt: trail.createdAt,
                lastUpdated: trail.lastUpdated
              }}
              isExpanded={expandedTrails[String(trail.id)]}
              onToggleExpansion={toggleTrailExpansion}
              onEdit={handleEditTrail}
              onDelete={(trailId, trailName) => {
                console.log('Delete trail called with:', trailId, trailName);
                setDeleteConfirm({ id: trailId, name: trailName, type: 'trail' });
                console.log('Delete confirm state set');
              }}
              reviews={trailReviews}
              alerts={trailAlerts}
              trailCounts={trailCounts}
              loadingStates={{
                reviews: reviewsLoading,
                alerts: alertsLoading
              }}
              onDeleteReview={(reviewId, trailId, trailName) => setDeleteConfirm({ id: reviewId, trailId, trailName, type: 'review' })}
              onDeleteAlert={(alertId) => setDeleteConfirm({ id: alertId, type: 'alert' })}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isVisible={!!deleteConfirm}
        deleteConfirm={deleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <EditTrailModal
        isVisible={!!editTrail}
        editTrail={editTrail}
        editForm={editForm}
        onClose={() => {
                  setEditTrail(null);
                  setEditForm({});
                }}
        onSave={handleSaveTrail}
        onFormChange={handleFormChange}
      />

      <SuccessPopup
        isVisible={successPopup.isVisible}
        message={successPopup.message}
        onClose={hideSuccessPopup}
      />
    </div>
  );
}