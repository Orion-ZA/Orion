import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="left">
          <strong>Orion</strong> — Crowd-sourced hiking intelligence
        </div>
        <div className="right">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}
