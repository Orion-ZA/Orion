import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider, db } from "../firebaseConfig"; 
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import GoogleIcon from "../components/GoogleIcon";
import AuthLayout from "../components/AuthLayout";

// Reusable PasswordInput component
const PasswordInput = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  const inputRef = useRef(null);

  const toggleShow = () => {
    if (inputRef.current) {
      const cursorPos = inputRef.current.selectionStart;
      setShow(prev => !prev);
      setTimeout(() => {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    }
  };

  const inputStyle = { width: "100%", paddingRight: "2.5rem" };
  const toggleStyle = {
    position: "absolute",
    right: "0.5rem",
    top: "40%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    color: "#555",
    width: "1.5rem",
    height: "1.5rem",
    padding: 0,
    display: "flex"
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={inputStyle}
        required
      />
      <button type="button" onClick={toggleShow} style={toggleStyle} tabIndex={-1}>
        {show ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
      </button>
    </div>
  );
};

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });

      await setDoc(doc(db, "Users", userCredential.user.uid), {

        profileInfo: {
          email,
          joinedDate: serverTimestamp(),
          name: username,
          userId: userCredential.user.uid
        },
        completedHikes: [],
        favourites: [],
        wishlist: [],
        submittedTrails: []
      });
      
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  const signUpWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "Users", user.uid);
      await setDoc(userRef, {
        profileInfo: {
          email: user.email,
          joinedDate: serverTimestamp(),
          name: user.displayName || "User",
          userId: user.uid
        }
      });

      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <AuthLayout title="Sign Up">
      <form onSubmit={handleEmailSignup}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
        />

        <button type="submit">Sign up with Email</button>
      </form>

      <section className="divider">Or</section>

      <button type="button" onClick={signUpWithGoogle} className="google-btn">
        <GoogleIcon /> Sign up with Google
      </button>

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}

export default Signup;
