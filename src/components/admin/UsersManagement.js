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
        ...doc.data(),
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

  const formatDate = timestamp => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getUserName = user => {
    if (user.profileInfo?.name) return user.profileInfo.name;
    if (user.profileInfo?.email) return user.profileInfo.email;
    return 'Anonymous User';
  };

  const getUserEmail = user => {
    return user.profileInfo?.email || 'No email';
  };

  if (loading) {
    return (
      <div className='admin-users-management'>
        <div className='admin-users-loading'>
          <div className='admin-loading-spinner'></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='admin-users-management'>
        <div className='admin-users-error'>
          <Users className='admin-error-icon' />
          <p>{error}</p>
          <button onClick={fetchUsers} className='admin-retry-button'>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='admin-users-management'>
      <div className='admin-users-header'>
        <h2>Users Management</h2>
        <div className='admin-users-stats'>
          <span className='admin-stat-item'>
            <Users className='admin-stat-icon' />
            Total Users: {users.length}
          </span>
        </div>
      </div>

      <div className='admin-users-list'>
        {users.length === 0 ? (
          <div className='admin-no-users'>
            <Users className='admin-no-users-icon' />
            <p>No users found</p>
          </div>
        ) : (
          users.map(user => (
            <div key={user.id} className='admin-user-card'>
              <div className='admin-user-header'>
                <div className='admin-user-info'>
                  <h3 className='admin-user-name'>{getUserName(user)}</h3>
                  <p className='admin-user-email'>{getUserEmail(user)}</p>
                </div>
                <button
                  onClick={() => setDeleteConfirm(user)}
                  className='admin-delete-button'
                  title='Delete User'
                >
                  <Trash2 className='admin-delete-icon' />
                </button>
              </div>

              <div className='admin-user-details'>
                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>Joined:</span>
                  <span className='admin-detail-value'>
                    {formatDate(user.profileInfo?.joinedDate)}
                  </span>
                </div>

                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>Submitted Trails:</span>
                  <span className='admin-detail-value'>
                    {user.submittedTrails ? user.submittedTrails.length : 0}
                  </span>
                </div>

                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>Favorites:</span>
                  <span className='admin-detail-value'>
                    {user.favourites ? user.favourites.length : 0}
                  </span>
                </div>

                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>Completed:</span>
                  <span className='admin-detail-value'>
                    {user.completed ? user.completed.length : 0}
                  </span>
                </div>

                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>Wishlist:</span>
                  <span className='admin-detail-value'>
                    {user.wishlist ? user.wishlist.length : 0}
                  </span>
                </div>
              </div>

              <div className='admin-user-activity'>
                <div className='admin-activity-item'>
                  <MapPin className='admin-activity-icon' />
                  <span>
                    Submitted {user.submittedTrails ? user.submittedTrails.length : 0} trails
                  </span>
                </div>
                <div className='admin-activity-item'>
                  <Heart className='admin-activity-icon' />
                  <span>{user.favourites ? user.favourites.length : 0} favorites</span>
                </div>
                <div className='admin-activity-item'>
                  <CheckCircle className='admin-activity-icon' />
                  <span>{user.completed ? user.completed.length : 0} completed</span>
                </div>
                <div className='admin-activity-item'>
                  <Star className='admin-activity-icon' />
                  <span>{user.wishlist ? user.wishlist.length : 0} in wishlist</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm && (
        <div className='admin-delete-modal-overlay'>
          <div className='admin-delete-modal'>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete the user "{getUserName(deleteConfirm)}"?</p>
            <p className='admin-warning-text'>
              This action cannot be undone and will remove all user data including submitted trails
              and reviews.
            </p>
            <div className='admin-modal-actions'>
              <button onClick={() => setDeleteConfirm(null)} className='admin-cancel-button'>
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm.id, getUserName(deleteConfirm))}
                className='admin-confirm-delete-button'
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
