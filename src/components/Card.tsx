
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => (
  <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 sm:p-8 ${className}`}>
    {children}
  </div>
);

export default Card;
