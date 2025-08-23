import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import GoogleIcon from "../components/GoogleIcon";
import AuthLayout from "../components/AuthLayout";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); 

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard"); 
    } catch (error) {
      alert(error.message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard"); 
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <AuthLayout title="Log In">
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
    </AuthLayout>
  );
}

export default Login;
