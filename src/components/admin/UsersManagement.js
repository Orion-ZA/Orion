import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Trash2, Users, Calendar, MapPin, Heart, CheckCircle, Star } from 'lucide-react';
import './UsersManagement.css';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'Users');
      const q = query(usersRef, orderBy('profileInfo.joinedDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
    } catch (err) {
      setError('Failed to fetch users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    try {
      await deleteDoc(doc(db, 'Users', userId));
      setUsers(users.filter(user => user.id !== userId));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete user: ' + err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getUserName = (user) => {
    if (user.profileInfo?.name) return user.profileInfo.name;
    if (user.profileInfo?.email) return user.profileInfo.email;
    return 'Anonymous User';
  };

  const getUserEmail = (user) => {
    return user.profileInfo?.email || 'No email';
  };

  if (loading) {
    return (
      <div className="users-management">
        <div className="users-loading">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-management">
        <div className="users-error">
          <Users className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchUsers} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-management">
      <div className="users-header">
        <h2>Users Management</h2>
        <div className="users-stats">
          <span className="stat-item">
            <Users className="stat-icon" />
            Total Users: {users.length}
          </span>
        </div>
      </div>

      <div className="users-list">
        {users.length === 0 ? (
          <div className="no-users">
            <Users className="no-users-icon" />
            <p>No users found</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-info">
                  <h3 className="user-name">{getUserName(user)}</h3>
                  <p className="user-email">{getUserEmail(user)}</p>
                </div>
                <button
                  onClick={() => setDeleteConfirm(user)}
                  className="delete-button"
                  title="Delete User"
                >
                  <Trash2 className="delete-icon" />
                </button>
              </div>
              
              <div className="user-details">
                <div className="detail-row">
                  <span className="detail-label">Joined:</span>
                  <span className="detail-value">{formatDate(user.profileInfo?.joinedDate)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Submitted Trails:</span>
                  <span className="detail-value">
                    {user.submittedTrails ? user.submittedTrails.length : 0}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Favorites:</span>
                  <span className="detail-value">
                    {user.favourites ? user.favourites.length : 0}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Completed:</span>
                  <span className="detail-value">
                    {user.completed ? user.completed.length : 0}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Wishlist:</span>
                  <span className="detail-value">
                    {user.wishlist ? user.wishlist.length : 0}
                  </span>
                </div>
              </div>

              <div className="user-activity">
                <div className="activity-item">
                  <MapPin className="activity-icon" />
                  <span>Submitted {user.submittedTrails ? user.submittedTrails.length : 0} trails</span>
                </div>
                <div className="activity-item">
                  <Heart className="activity-icon" />
                  <span>{user.favourites ? user.favourites.length : 0} favorites</span>
                </div>
                <div className="activity-item">
                  <CheckCircle className="activity-icon" />
                  <span>{user.completed ? user.completed.length : 0} completed</span>
                </div>
                <div className="activity-item">
                  <Star className="activity-icon" />
                  <span>{user.wishlist ? user.wishlist.length : 0} in wishlist</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete the user "{getUserName(deleteConfirm)}"?</p>
            <p className="warning-text">This action cannot be undone and will remove all user data including submitted trails and reviews.</p>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm.id, getUserName(deleteConfirm))}
                className="confirm-delete-button"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
