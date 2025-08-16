import React from "react";
import { Link } from "react-router-dom";
import GoogleIcon from '../components/GoogleIcon';
import AuthLayout from '../components/AuthLayout';

function Login(){
  return (
    <AuthLayout title="Log in">
      <form>
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
        <br />
        <button type="submit">Log in</button>
        <section className="divider">Or</section>
        <button type="button" className="google-btn"><GoogleIcon/>Continue with Google</button>
      </form>
      <p>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;