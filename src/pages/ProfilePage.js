import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import "./ProfilePage.css";
import FavouritesIcon from "../components/FavouritesIcon";
import PyramidLoader from "../components/PyramidLoader";
import WishlistIcon from "../components/WishlistIcon";
import SubmittedIcon from "../components/SubmittedIcon";
import CompletedIcon from "../components/CompletedIcon";
import { useNavigate } from 'react-router-dom';
import { Edit } from "lucide-react";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);
  const [trailsData, setTrailsData] = useState({
    wishlist: [],
    favourites: [],
    completed: [], // hikes marked as completed are pushed to this array in firestore instead of "completedHikes"
    submittedTrails: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setUserData(null);
        setLoading(false);
        return;
      }

      setUser(u);
      
      try {
        // Fetch user doc
        const userRef = doc(db, "Users", u.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);

          // Fetch trails for each array
          const fetchTrails = async (refs = []) => {
            return Promise.all(
              refs.map(async (ref) => {
                let trailRef;
                if (typeof ref === "string") {
                  // stored as string path
                  const [_, col, id] = ref.split("/"); // e.g. "/Trails/abc123"
                  trailRef = doc(db, col, id);
                } else {
                  // stored as Firestore DocumentReference
                  trailRef = ref;
                }

                const trailSnap = await getDoc(trailRef);
                return trailSnap.exists() ? { id: trailSnap.id, ...trailSnap.data() } : null;
              })
            ).then((list) => list.filter(Boolean)); // filter out nulls
          };

          const [wishlist, favourites, completed, submittedTrails] =
            await Promise.all([
              fetchTrails(data.wishlist || []),
              fetchTrails(data.favourites || []),
              fetchTrails(data.completed || []),
              fetchTrails(data.submittedTrails || [])
            ]);

          setTrailsData({ wishlist, favourites, completed, submittedTrails });
        }
      } catch (err) {
        console.error("Error fetching user/trails:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading){
    return <div className="profile-page"><p>Loading...</p></div>;
  }
  if (!userData) {
    return <div className="profile-page">
        <h1>Please log in to view your profile</h1>
      </div>;
  }

  return (
    <div className="profile-page">
      <h1>My Dashboard</h1>

      {/* Profile Header */}
      <div className="profile-card">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="User Avatar"
            className="profile-avatar-large"
          />
        ) : (
          <div className="profile-avatar-placeholder">No Image</div>
        )}
        <div className="profile-info">
          <h2>{user?.displayName || "No Name"}</h2>
          <p>{user?.email}</p>
          <button className="edit-btn" onClick={() => navigate('/settings')}>
            <Edit /> Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <SubmittedIcon /><h3>{trailsData.submittedTrails.length}</h3>
          <p>Submitted</p>
        </div>
        <div className="stat-card">
          <CompletedIcon /><h3>{trailsData.completed.length}</h3>
          <p>Completed</p>
        </div>
        <div className="stat-card">
          <FavouritesIcon /><h3>{trailsData.favourites.length}</h3>
          <p>Favourites</p>
        </div>
        <div className="stat-card">
          <WishlistIcon /><h3>{trailsData.wishlist.length}</h3>
          <p>Wishlist</p>
        </div>
      </div>

      {/* Trails Sections */}
      <div className="trail-sections">
        {[
          { title: "Wishlist", icon: <WishlistIcon />, data: trailsData.wishlist },
          { title: "Favourites", icon: <FavouritesIcon />, data: trailsData.favourites },
          { title: "Completed Hikes", icon: <CompletedIcon />, data: trailsData.completed },
          { title: "Submitted Trails", icon: <SubmittedIcon />, data: trailsData.submittedTrails },
        ].map((section, idx) => (
          <section key={idx} className="profile-section">
            <h2>{section.icon} {section.title}</h2>
            {section.data.length ? (
              <ul className="trail-list">
                {section.data.map((trail) => {
                  const difficultyClass = trail.difficulty?.toLowerCase() || "unknown";
                  return (
                    <li key={trail.id} className={`trail-card ${difficultyClass}`}>
                      <h4>{trail.name}</h4>
                      <p className="meta">
                        {trail.difficulty
                          ? `Difficulty: ${trail.difficulty}`
                          : "No difficulty info"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No {section.title.toLowerCase()} yet.</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}