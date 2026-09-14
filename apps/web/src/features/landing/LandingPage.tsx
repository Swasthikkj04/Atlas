import React from 'react';
import { TopSection } from './TopSection';
import { ReasoningSection } from './ReasoningSection';
import { PrinciplesManifesto } from './PrinciplesManifesto';
import { Footer } from './Footer';
import { useSeoMetadata } from '../../hooks/useSeoMetadata';
import styles from './LandingPage.module.css';

export const LandingPage: React.FC = () => {
  useSeoMetadata({
    title: 'Nebula by Argonion | Infrastructure Intelligence Platform',
    description:
      'Nebula by Argonion provides continuous infrastructure intelligence, passive perimeter discovery, and causal change detection for modern engineering teams.',
    canonicalUrl: 'https://argonion.com/',
    robots: 'index, follow',
    ogType: 'website',
    keywords: [
      'Infrastructure Intelligence',
      'Passive Discovery',
      'Causal Timelines',
      'Perimeter Observation',
      'DNSSEC',
      'TLS 1.3',
      'Change Detection',
      'Argonion',
      'Nebula',
    ],
  });

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
