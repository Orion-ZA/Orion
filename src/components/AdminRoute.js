import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig"; 
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "./ToastContext";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { show } = useToast();
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const checkAdminRole = async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "Users", user.uid);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          // Check multiple possible role fields for flexibility
          const userRole = userData.profileInfo?.role || userData.role;
          setIsAdmin(userRole === "admin");
        } else {
          console.warn("User document not found for:", user.uid);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error checking admin role:", err);
        setError("Failed to verify admin privileges");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth state changes
    unsubscribe = onAuthStateChanged(auth, (user) => {
      setError(null);
      checkAdminRole(user);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show error state (optional - you might want to handle this differently)
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p>Access verification failed</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Redirect non-admin users
  if (!isAdmin) {
    setTimeout(() => show('Please go away. You are not admin !!! ', { type: 'warn' }), 0);
    return <Navigate to="/" replace />;
  }

  // Render protected content for admin users
  return <>{children}</>;
}