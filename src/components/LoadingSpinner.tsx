
import React from 'react';

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <div className={`animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent ${className}`} role="status">
    <span className="sr-only">Loading...</span>
  </div>
);

export default LoadingSpinner;
