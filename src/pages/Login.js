import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
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
      await signInWithPopup(auth, googleProvider);
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
