// src/components/AuthLayout.js
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/orion_logo.png';

const AuthLayout = ({ children, title }) => {
  return (
    <section className="auth-page">
      <header className="auth-header">
        <Link to="/">
          <img src={logo} alt="Company Logo" className="auth-logo" />
        </Link>
      </header>
      
      <main className="auth-container">
        <h2>{title}</h2>
        {children}
      </main>
    </section>
  );
};

export default AuthLayout;