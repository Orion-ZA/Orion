import React from "react";
import { Link } from "react-router-dom";
import GoogleIcon from '../components/GoogleIcon';
import AuthLayout from "../components/AuthLayout";

const Signup = () => {
  return (
    <AuthLayout title="Sign Up">
      <form>
        <input type="text" placeholder="Username" required />
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Sign Up</button>
        <section className="divider">Or</section>
        <button type="button" className="google-btn"><GoogleIcon/>Sign with Google</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;