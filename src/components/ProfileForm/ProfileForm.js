import React, { useState } from 'react';
import './ProfileForm.css';

function ProfileForm({ onSubmit, loading }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, avatar });
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <div className="form-group">
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="avatar">Profile Picture URL (optional)</label>
        <input
          type="url"
          id="avatar"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Complete Profile'}
      </button>
    </form>
  );
}

export default ProfileForm;