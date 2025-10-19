import React from 'react';
import { Heart, Bookmark, Check, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserActions = ({ user, trail, userSaved, onTrailAction }) => {
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className='trail-detail-user-actions'>
      <h3>My Actions</h3>
      <div className='trail-detail-action-buttons'>
        <button
          className={`trail-detail-action-btn favourites ${userSaved.favourites.includes(trail.id) ? 'active' : ''}`}
          onClick={() => onTrailAction('favourites', trail.id)}
          title={
            userSaved.favourites.includes(trail.id) ? 'Remove from favourites' : 'Add to favourites'
          }
        >
          <Heart size={16} />
          {userSaved.favourites.includes(trail.id) ? 'Favourited' : 'Favourite'}
        </button>

        <button
          className={`trail-detail-action-btn wishlist ${userSaved.wishlist.includes(trail.id) ? 'active' : ''}`}
          onClick={() => onTrailAction('wishlist', trail.id)}
          title={userSaved.wishlist.includes(trail.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Bookmark size={16} />
          {userSaved.wishlist.includes(trail.id) ? 'In Wishlist' : 'Add to Wishlist'}
        </button>

        <button
          className={`trail-detail-action-btn completed ${userSaved.completed.includes(trail.id) ? 'active' : ''}`}
          onClick={() => onTrailAction('completed', trail.id)}
          title={
            userSaved.completed.includes(trail.id) ? 'Mark as not completed' : 'Mark as completed'
          }
        >
          <Check size={16} />
          {userSaved.completed.includes(trail.id) ? 'Completed' : 'Mark Complete'}
        </button>

        {user.uid === trail.authorId && (
          <button
            className='trail-detail-action-btn edit'
            onClick={() => navigate(`/trails/${trail.id}/edit`)}
            title='Edit trail'
          >
            <Edit3 size={16} />
            Edit Trail
          </button>
        )}
      </div>
    </div>
  );
};

export default UserActions;
