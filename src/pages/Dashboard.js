import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import BottomNav from '../components/BottomNav';
import Home from './Dashboard/Home';
import Stats from './Dashboard/Stats';
import Challenges from './Dashboard/Challenges';
import Account from './Dashboard/Account';
import './Dashboard.css';

function Dashboard({ user }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [trailDetails, setTrailDetails] = useState({
    completedHikes: [],
    favourites: [],
    wishlist: [],
    submittedTrails: []
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "Users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);

          // Fetch trail details for each reference array
          const fetchTrailDetails = async (references) => {
            const details = [];
            for (const ref of references) {
              if (typeof ref === 'string' && ref.startsWith('/Trails/')) {
                const trailId = ref.split('/')[2];
                const trailDoc = await getDoc(doc(db, "Trails", trailId));
                if (trailDoc.exists()) {
                  details.push(trailDoc.data());
                }
              }
            }
            return details;
          };

          const completedHikes = await fetchTrailDetails(data.completedHikes || []);
          const favourites = await fetchTrailDetails(data.favourites || []);
          const wishlist = await fetchTrailDetails(data.wishlist || []);
          const submittedTrails = await fetchTrailDetails(data.submittedTrails || []);

          setTrailDetails({
            completedHikes,
            favourites,
            wishlist,
            submittedTrails
          });
        } else {
          console.log("No user document found for", user.uid);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <Home userData={userData} trailDetails={trailDetails} />;
      case 'stats':
        return <Stats userData={userData} />;
      case 'challenges':
        return <Challenges userData={userData} />;
      case 'account':
        return <Account user={user} userData={userData} handleLogout={handleLogout} />;
      default:
        return <Home userData={userData} trailDetails={trailDetails} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-main">
      {/* Keep your header sections */}
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div className="welcome-section">
            <span className="fire-emoji">🔥</span>
            <div>
              <h1 className="welcome-title">Welcome back!</h1>
            </div>
          </div>
          <div className="header-actions">
          </div>
        </div>
      </header>


      {/* Desktop Header */}
      <header className="desktop-header">
        <div>
          <h1 className="desktop-title">
            {userData?.profileInfo?.name || "Explorer"}'s Dashboard
          </h1>
          <p className="desktop-subtitle">Track your hiking adventures</p>
        </div>
        <div className="desktop-header-actions">
        </div>
      </header>
      
      {/* Main Content */}
      <main className="dashboard-content">
        {renderActiveTab()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default Dashboard;