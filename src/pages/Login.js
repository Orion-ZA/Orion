import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../firebaseConfig";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import GoogleIcon from "../components/GoogleIcon";
import AuthLayout from "../components/AuthLayout";
import { useLoader } from "../components/LoaderContext.js";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); 
  const { triggerLoader } = useLoader();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      triggerLoader();
      navigate("/dashboard"); 
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists in database
      const userRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userRef);

      // If user doesn't exist in database, create their profile
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          profileInfo: {
            email: user.email,
            joinedDate: serverTimestamp(),
            name: user.displayName || "User",
            userId: user.uid
          },
          completedHikes: [],
          favourites: [],
          wishlist: [],
          submittedTrails: []
        });
      }

      triggerLoader();
      navigate("/dashboard"); 
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Log In">
      {/* Only show form, loader is now global and only on transition */}
      <>
        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Log in with Email</button>
        </form>

        <section className="divider">Or</section>

        <button type="button" onClick={loginWithGoogle} className="google-btn">
          <GoogleIcon /> Log in with Google
        </button>

        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </>
    </AuthLayout>
  );
}

export default Login;
