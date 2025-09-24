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
    completedHikes: [],
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

          const [wishlist, favourites, completedHikes, submittedTrails] =
            await Promise.all([
              fetchTrails(data.wishlist || []),
              fetchTrails(data.favourites || []),
              fetchTrails(data.completedHikes || []),
              fetchTrails(data.submittedTrails || [])
            ]);

          setTrailsData({ wishlist, favourites, completedHikes, submittedTrails });
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
      <h1>My Profile</h1>
      <div className="profile-card">
        {user?.photoURL ? (
          <img
            src={user.photoURL || "https://www.flaticon.com/free-icons/profile-picture"}
            alt="User Avatar" className="profile-avatar-large"
          />
        ):(
          <div className="profile-avatar-placeholder">No Image</div>
        )}
      
        <h2>{user?.displayName || "No Name"}</h2>
        <p>Email: {user?.email}</p>
        <button
          className="edit-btn"
          onClick={() => navigate('/settings')}
        >
          <Edit /> Edit Profile
        </button>
      </div>

      <section className="profile-section">
        <h2><WishlistIcon /> Wishlist</h2>
        {trailsData.wishlist.length ? (
          <ul className="trail-list">
            {trailsData.wishlist.map((trail) => {
              const difficultyClass = trail.difficulty?.toLowerCase() || "unknown";
              return (
                <li 
                  key={trail.id}
                  className={`trail-card ${difficultyClass}`}
                >
                  <h4>{trail.name}</h4>
                  <p className="meta">
                    {trail.difficulty ? `Difficulty: ${trail.difficulty}` : "No difficulty info"}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No items in wishlist.</p>
        )}
      </section>

      <section className="profile-section">
        <h2><FavouritesIcon /> Favourites</h2>
        {trailsData.favourites.length ? (
          <ul className="trail-list">
            {trailsData.favourites.map((trail) => {
              const difficultyClass = trail.difficulty?.toLowerCase() || "unknown";
              return (
                <li 
                  key={trail.id}
                  className={`trail-card ${difficultyClass}`}
                >
                  <h4>{trail.name}</h4>
                  <p className="meta">
                    {trail.difficulty ? `Difficulty: ${trail.difficulty}` : "No difficulty info"}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No favourites yet.</p>
        )}
      </section>

      <section className="profile-section">
        <h2><CompletedIcon /> Completed Hikes</h2>
        {trailsData.completedHikes.length ? (
          <ul className="trail-list">
            {trailsData.completedHikes.map((trail) => {
              const difficultyClass = trail.difficulty?.toLowerCase() || "unknown";
              return (
                <li 
                  key={trail.id}
                  className={`trail-card ${difficultyClass}`}
                >
                  <h4>{trail.name}</h4>
                  <p className="meta">
                    {trail.difficulty ? `Difficulty: ${trail.difficulty}` : "No difficulty info"}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No completed hikes yet.</p>
        )}
      </section>

      <section className="profile-section">
        <h2><SubmittedIcon /> Submitted Trails</h2>
        {trailsData.submittedTrails.length ? (
          
          <ul className="trail-list">
            {trailsData.submittedTrails.map((trail) => {
              const difficultyClass = trail.difficulty?.toLowerCase() || "unknown";
              return (
                <li 
                  key={trail.id}
                  className={`trail-card ${difficultyClass}`}
                >
                  <h4>{trail.name}</h4>
                  <p className="meta">
                    {trail.difficulty ? `Difficulty: ${trail.difficulty}` : "No difficulty info"}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No submitted trails yet.</p>
        )}
      </section>
    </div>
  );
}