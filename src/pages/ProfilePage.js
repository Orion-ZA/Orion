import React, { useEffect, useState } from "react";
import styled from "styled-components";
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
                  const [, col, id] = ref.split("/"); // e.g. "/Trails/abc123"
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
    return <div className="profile-page"><PyramidLoader /></div>;
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

const ProfileGlowCard = ({ avatarUrl, email }) => (
  <GlowWrapper>
    <div className="card">
      <div className="bg uwu" />
      <div className="bg" />
      <div className="content">
        <div className="img">
          {avatarUrl ? (
            <img src={avatarUrl} alt="User avatar" referrerPolicy="no-referrer" />
          ) : (
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4Z" />
            </svg>
          )}
        </div>
        <div className="email" title={email || "No email on file"}>
          {email || "No email on file"}
        </div>
      </div>
    </div>
  </GlowWrapper>
);

const GlowWrapper = styled.div`
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  .card {
    position: relative;
    width: clamp(220px, 32vw, 280px);
    height: clamp(240px, 32vw, 260px);
    border-radius: 18px;
    overflow: hidden;
    color: var(--text);
    background: rgba(8, 16, 32, 0.82);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bg {
    position: absolute;
    z-index: -1;
    inset: -4px;
    border-radius: 22px;
    overflow: hidden;
  }

  .uwu {
    filter: blur(12px);
    transition: filter 0.35s ease;
  }

  .bg::before {
    content: '';
    position: absolute;
    aspect-ratio: 1 / 1;
    top: 50%;
    left: 50%;
    min-width: 150%;
    min-height: 150%;
    background-image: conic-gradient(
      hsl(180, 86%, 55%),
      hsl(210, 92%, 62%),
      hsl(270, 85%, 62%),
      hsl(330, 92%, 58%),
      hsl(30, 94%, 58%),
      hsl(120, 80%, 52%),
      hsl(180, 86%, 55%)
    );
    animation: speeen 6s linear infinite;
    transform-origin: 0% 0%;
    transform: rotate(0deg) translate(-50%, -50%);
  }

  @keyframes speeen {
    from {
      transform: rotate(0deg) translate(-50%, -50%);
    }
    to {
      transform: rotate(360deg) translate(-50%, -50%);
    }
  }

  .content {
    position: relative;
    padding: 24px 20px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    background: linear-gradient(180deg, rgba(6, 14, 30, 0.92), rgba(6, 16, 34, 0.88));
  }

  .img {
    height: clamp(80px, 10vw, 96px);
    width: clamp(80px, 10vw, 96px);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 12px 28px -12px rgba(2, 12, 27, 0.45);
  }

  .img svg {
    height: 60%;
    width: 60%;
    fill: #ecf2ff;
  }

  .img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .email {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.18px;
    text-align: center;
    color: inherit;
    word-break: break-word;
  }

  &:hover .uwu {
    filter: blur(18px);
  }

  html[data-theme='light'] & .card {
    background: rgba(255, 255, 255, 0.95);
    color: var(--text);
  }

  html[data-theme='light'] & .content {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(248, 250, 252, 0.92));
  }

  html[data-theme='light'] & .img {
    background: rgba(17, 130, 127, 0.1);
    box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.25);
  }

  html[data-theme='light'] & .img svg {
    fill: var(--primary);
  }
`;