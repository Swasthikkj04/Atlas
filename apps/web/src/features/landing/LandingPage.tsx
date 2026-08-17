import React from 'react';
import { TopSection } from './TopSection';
import { ReasoningSection } from './ReasoningSection';
import { PrinciplesManifesto } from './PrinciplesManifesto';
import { Footer } from './Footer';
import styles from './LandingPage.module.css';

export const LandingPage: React.FC = () => {
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
export default LandingPage;
