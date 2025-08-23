import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return <Navigate to="/login" replace />;
  }

  // Inject user prop into children
  return children && user
    ? { ...children, props: { ...children.props, user } }
    : null;
}

export default ProtectedRoute;
