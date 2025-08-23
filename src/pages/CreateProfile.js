import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm/ProfileForm';
import '../components/ProfileForm/ProfileForm.css';

function CreateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleProfileSubmit = async (profileData) => {
    setLoading(true);
    setError('');
    
    try {
      const user = auth.currentUser;
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profileData.name,
        photoURL: profileData.avatar || null
      });

      // Create user document in Firestore
      const userRef = doc(db, "Users", user.uid);
      await setDoc(userRef, {
        profileInfo: {
          name: profileData.name,
          avatar: profileData.avatar || '',
          email: user.email,
          userId: user.uid,
          joinedDate: new Date().toISOString()
        },
        completedHikes: [],
        favourites: [],
        submittedTrails: [],
        wishlist: []
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      console.error("Error creating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-profile-container">
      <h2>Complete Your Profile</h2>
      <p>Add some details to personalize your experience</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <ProfileForm 
        onSubmit={handleProfileSubmit} 
        loading={loading}
      />
    </div>
  );
}

export default CreateProfile;