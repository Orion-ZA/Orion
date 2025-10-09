import React from 'react';

export default function AdminIcon({ className = '', title = 'Admin', size = 18 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? "false" : "true"}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path d="M12 2l3 3 4 1-1 4 1 4-4 1-3 3-3-3-4-1 1-4-1-4 4-1 3-3z" fill="currentColor" />
      <circle cx="12" cy="12" r="3" fill="#fff" opacity="0.9" />
      <path d="M12 10.2c.99 0 1.8.81 1.8 1.8S12.99 13.8 12 13.8 10.2 12.99 10.2 12s.81-1.8 1.8-1.8z" fill="currentColor" />
    </svg>
  );
}