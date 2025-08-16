
import React from 'react';

const TrophyIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V15M17.5 15h-11A2.5 2.5 0 014 12.5V11a1 1 0 011-1h14a1 1 0 011 1v1.5a2.5 2.5 0 01-2.5 2.5zM9 4h6" />
  </svg>
);

export default TrophyIcon;
