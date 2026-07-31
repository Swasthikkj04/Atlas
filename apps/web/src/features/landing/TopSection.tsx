import React from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';

export const TopSection: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#f8f9fc',
      }}
    >
      <Navbar />
      <Hero />
    </div>
  );
};

TopSection.displayName = 'TopSection';
