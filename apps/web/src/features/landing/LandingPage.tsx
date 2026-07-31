import React, { useState, useEffect } from 'react';
import { TopSection } from './TopSection';
import { ReasoningSection } from './ReasoningSection';
import { PrinciplesManifesto } from './PrinciplesManifesto';
import { Footer } from './Footer';
import { GuestWorkspace } from '../../components/gx/GuestWorkspace';
import styles from './LandingPage.module.css';

export const LandingPage: React.FC = () => {
  const [showWorkspace, setShowWorkspace] = useState<boolean>(() => {
    return window.location.hash === '#nebula';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setShowWorkspace(window.location.hash === '#nebula');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (showWorkspace) {
    return (
      <GuestWorkspace
        onBackToLanding={() => {
          window.location.hash = '';
          setShowWorkspace(false);
        }}
      />
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <TopSection />
      <main className={styles.mainContent}>
        <ReasoningSection />
        <PrinciplesManifesto />
      </main>
      <Footer />
    </div>
  );
};

LandingPage.displayName = 'LandingPage';

