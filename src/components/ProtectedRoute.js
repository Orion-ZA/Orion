import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useToast } from "./ToastContext";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const location = useLocation();
  const notifiedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Blank screen while loading
  if (loading) {
    return <div className="min-h-screen bg-white"></div>;
  }

  if (!user) {
    // notify once per redirect
    if (!notifiedRef.current) {
      notifiedRef.current = true;
      // schedule toast after paint to avoid effects during render
      setTimeout(() => show('Please log in first', { type: 'warn' }), 0);
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Inject user prop into child properly
  return React.isValidElement(children)
    ? React.cloneElement(children, { user })
    : null;
}

export default ProtectedRoute;
