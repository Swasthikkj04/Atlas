import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useTheme } from '../guest/hooks/useTheme';
import { NetworkBg } from '../auth/components/NetworkBg';
import { ArgonionMark } from '../../components/branding/ArgonionMark';
import { useSeoMetadata } from '../../hooks/useSeoMetadata';

interface SectionItem {
  id: string;
  number: string;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'eligibility', number: '1', label: 'Eligibility and Accounts' },
  { id: 'what-nebula-provides', number: '2', label: 'What Nebula Provides' },
  { id: 'guest-experience', number: '3', label: 'Guest Experience' },
  { id: 'use-of-nebula', number: '4', label: 'Use of Nebula' },
  { id: 'intellectual-property', number: '5', label: 'Intellectual Property' },
  { id: 'plans-and-limits', number: '6', label: 'Plans, Usage Limits, and Availability' },
  { id: 'account-lifecycle', number: '7', label: 'Account Deactivation and Termination' },
  { id: 'disclaimers', number: '8', label: 'Disclaimers and Technical Limitations' },
  { id: 'liability', number: '9', label: 'Limitation of Liability' },
  { id: 'indemnification', number: '10', label: 'Indemnification' },
  { id: 'changes', number: '11', label: 'Changes to These Terms' },
  { id: 'governing-law', number: '12', label: 'Governing Law and Dispute Resolution' },
  { id: 'general', number: '13', label: 'General Provisions' },
  { id: 'contact', number: '14', label: 'Contact Us' },
];

export const TermsPage: React.FC = () => {
  useSeoMetadata({
    title: 'Terms & Conditions | Nebula by Argonion',
    description:
      'Terms and Conditions governing access to and use of Nebula by Argonion infrastructure intelligence platform.',
    canonicalUrl: 'https://argonion.com/terms',
    robots: 'index, follow',
    ogType: 'website',
  });

  const { theme, setMode } = useTheme();
  const dark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string>('eligibility');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        setActiveSection(visible[0].target.id);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-80px 0px -60% 0px',
      threshold: [0, 0.2, 0.5],
    });

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el && observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleToggleTheme = () => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col selection:bg-primary/20 selection:text-foreground">
      <NetworkBg dark={dark} />

      {/* Top Legal Navigation Header */}
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 md:px-12 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <a
          href="/"
          className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-ring rounded py-1"
          aria-label="Argonion Nebula Home"
        >
          <div className="size-6 rounded bg-foreground/[0.06] dark:bg-foreground/[0.08] border border-border/80 flex items-center justify-center text-foreground shrink-0">
            <ArgonionMark size={14} className="text-foreground" />
          </div>
          <span>ARGONION</span>
          <span className="opacity-40">/</span>
          <span className="text-foreground font-semibold">NEBULA</span>
        </a>

        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="/"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-ring rounded py-1 px-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Nebula</span>
          </a>
          <button
            type="button"
            onClick={handleToggleTheme}
            className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded border border-border/70 bg-muted/30 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-12 py-10 md:py-16 relative z-10">
        
        {/* Mobile / Tablet Contents Disclosure */}
        <div className="lg:hidden mb-8 border border-border/60 rounded-lg bg-card/60 backdrop-blur-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-foreground cursor-pointer"
            aria-expanded={mobileMenuOpen}
          >
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">Contents:</span>
              <span className="font-medium truncate max-w-[200px] sm:max-w-xs">
                {SECTIONS.find((s) => s.id === activeSection)?.label || 'Overview'}
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                mobileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {mobileMenuOpen && (
            <nav
              aria-label="Table of contents mobile"
              className="px-4 pb-4 pt-1 border-t border-border/40 space-y-1 text-xs"
            >
              {SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={(e) => handleNavClick(e, sec.id)}
                  className={`block py-1.5 px-2 rounded transition-colors ${
                    activeSection === sec.id
                      ? 'bg-muted/60 text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sec.number ? `${sec.number}. ` : ''}{sec.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 xl:gap-16 items-start">
          
          {/* Desktop Sticky Table of Contents */}
          <aside
            className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 border-r border-border/50 text-xs"
            aria-label="Table of contents"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4 font-semibold">
              Contents
            </p>
            <nav className="space-y-1 relative" aria-label="Terms of service navigation">
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => handleNavClick(e, sec.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`group block py-1.5 pl-2.5 -ml-px border-l-2 text-xs transition-colors leading-snug ${
                      isActive
                        ? 'border-foreground text-foreground font-medium'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'
                    }`}
                  >
                    <span className="font-mono text-[11px] opacity-60 mr-1.5">
                      {sec.number ? `${sec.number}.` : ''}
                    </span>
                    <span>{sec.label}</span>
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Legal Document Body */}
          <article className="max-w-[740px] w-full space-y-12 pb-16">
            
            {/* Title & Metadata Header */}
            <header className="border-b border-border/60 pb-8">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-medium tracking-tight text-foreground leading-[1.15] mb-3">
                Terms &amp; Conditions
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                Nebula by Argonion &bull; Operated by Argonion
              </p>

              {/* Document Metadata Grid */}
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 mt-6 border-t border-border/40 font-mono text-xs">
                <div>
                  <dt className="text-muted-foreground/70 uppercase tracking-wider text-[10px]">
                    Version
                  </dt>
                  <dd className="text-foreground mt-1 font-medium">1.0</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/70 uppercase tracking-wider text-[10px]">
                    Effective Date
                  </dt>
                  <dd className="text-foreground mt-1 font-medium">[To be determined]</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/70 uppercase tracking-wider text-[10px]">
                    Last Updated
                  </dt>
                  <dd className="text-foreground mt-1 font-medium">[To be determined]</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/70 uppercase tracking-wider text-[10px]">
                    Operator
                  </dt>
                  <dd className="text-foreground mt-1 font-medium">Argonion</dd>
                </div>
              </dl>
            </header>

            {/* Preamble */}
            <section className="space-y-4 text-[15px] leading-[1.75] text-foreground/90">
              <p>
                These Terms &amp; Conditions (“Terms”) govern your access to and use of <strong>Nebula by Argonion</strong> (“Nebula”).
              </p>
              <p>
                By accessing or using Nebula, you agree to these Terms and our{' '}
                <a
                  href="/privacy"
                  className="text-foreground underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
                >
                  Privacy Policy
                </a>. If you do not agree with these Terms, you should not use Nebula.
              </p>
              <p>
                If you use Nebula on behalf of a company or other organization, you confirm that you have authority to accept these Terms on its behalf.
              </p>
              <div className="p-4 rounded bg-muted/20 border-l-2 border-border-strong text-xs font-mono text-muted-foreground space-y-1 mt-4">
                <div><strong>Registered Address:</strong> [To be provided]</div>
                <div><strong>Legal &amp; Inquiries Contact:</strong> [To be provided]</div>
              </div>
            </section>

            {/* 1. Eligibility and Accounts */}
            <section id="eligibility" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                1. Eligibility and Accounts
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You must be legally able to enter into a binding agreement in your jurisdiction to use Nebula.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Some Nebula features require an account. When creating an account, you agree to provide accurate information and keep your account information up to date.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You are responsible for keeping your account credentials secure and for activity carried out through your account. If you believe your account has been accessed without your permission, you should contact us promptly.
              </p>
            </section>

            {/* 2. What Nebula Provides */}
            <section id="what-nebula-provides" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                2. What Nebula Provides
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula is an <strong>infrastructure intelligence platform</strong> that helps users understand internet-facing infrastructure, identify meaningful changes, and preserve historical context.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Depending on the features available to you, Nebula may provide:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.75] text-foreground/85">
                <li>Guest Experience analysis without an account;</li>
                <li>authenticated Workspaces;</li>
                <li>infrastructure observations and snapshots;</li>
                <li>findings and infrastructure briefs;</li>
                <li>historical change and drift information; and</li>
                <li>related APIs and supporting functionality.</li>
              </ul>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula&apos;s results are based on information observable from internet-facing infrastructure at the time of analysis. Results may change as the underlying infrastructure changes.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90 font-medium">
                Nebula is not a substitute for professional cybersecurity, legal, regulatory, or compliance advice.
              </p>
            </section>

            {/* 3. Guest Experience */}
            <section id="guest-experience" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                3. Guest Experience
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula may allow you to use certain functionality without creating an account through its <strong>Guest Experience (GX)</strong>.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Guest sessions are temporary. Information associated with a guest session is automatically removed according to the retention period described in our{' '}
                <a
                  href="/privacy"
                  className="text-foreground underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
                >
                  Privacy Policy
                </a>.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You may be able to continue eligible guest work in an authenticated Workspace by creating or signing into a Nebula account within the applicable period.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Guest access may be limited to protect the availability and security of Nebula.
              </p>
            </section>

            {/* 4. Use of Nebula */}
            <section id="use-of-nebula" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                4. Use of Nebula
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You may use Nebula only for lawful purposes and in accordance with these Terms.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                When submitting a domain or infrastructure for analysis, you are responsible for ensuring that you have the right or appropriate authorization to request that analysis, or that your use is otherwise lawful.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You agree not to use Nebula in a way that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.75] text-foreground/85">
                <li>violates applicable law or the rights of others;</li>
                <li>disrupts, damages, or attempts to gain unauthorized access to systems or networks;</li>
                <li>uses Nebula to conduct intrusive attacks, exploitation, credential attacks, or denial-of-service activity; or</li>
                <li>interferes with the security, availability, or normal operation of Nebula.</li>
              </ul>
              <div className="p-3 rounded bg-muted/20 border-l-2 border-border-strong text-xs font-mono text-muted-foreground mt-2">
                <strong>Platform Purpose:</strong> Nebula is designed for <strong>non-intrusive infrastructure observation and intelligence</strong>. It is not intended to provide a means for exploiting or compromising systems.
              </div>
            </section>

            {/* 5. Intellectual Property */}
            <section id="intellectual-property" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                5. Intellectual Property
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula, including its software, user interface, visual design, brand, documentation, underlying technology, and other original materials, is owned by or licensed to Argonion.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Subject to these Terms, Argonion grants you a limited, non-exclusive, non-transferable right to access and use Nebula for its intended purpose.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You retain your rights in information and content that you submit to Nebula. You grant Argonion the limited rights necessary to process that information to provide, secure, and operate Nebula.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You may not copy, modify, distribute, sell, reverse engineer, or otherwise exploit Nebula or its proprietary components except where permitted by applicable law or with our written permission.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Any feedback you voluntarily provide about Nebula may be used by Argonion to improve the service without creating an obligation to compensate you.
              </p>
            </section>

            {/* 6. Plans, Usage Limits, and Availability */}
            <section id="plans-and-limits" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                6. Plans, Usage Limits, and Availability
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Some Nebula features and limits may depend on your account plan.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Plan-specific limits may include analysis frequency, historical data availability, evidence retention, usage limits, and other service capabilities. The applicable limits will be presented as part of the relevant plan or service description.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula may apply reasonable rate limits, usage limits, or concurrency limits to protect the security, stability, and availability of the service.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                We may modify, add, or remove features as Nebula evolves. Where a change materially affects an existing paid service, we will provide notice where required.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula is provided on an ongoing basis, but we do not guarantee that the service will always be uninterrupted or available.
              </p>
            </section>

            {/* 7. Account Deactivation and Termination */}
            <section id="account-lifecycle" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                7. Account Deactivation and Termination
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You may deactivate your account through the available account settings. Deactivation prevents normal access while allowing the account to be restored where that functionality is available.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You may also permanently delete your account. Account deletion is irreversible and removes your account and associated data from Nebula&apos;s active systems in accordance with our{' '}
                <a
                  href="/privacy"
                  className="text-foreground underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
                >
                  Privacy Policy
                </a>.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Argonion may suspend or terminate access to Nebula if you materially violate these Terms, misuse the service, create a security or operational risk, or if suspension or termination is required by law.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Where reasonably appropriate, we may provide notice and an opportunity to address the issue before taking action. We may act immediately when necessary to protect Nebula, other users, or third-party systems.
              </p>
            </section>

            {/* 8. Disclaimers and Technical Limitations */}
            <section id="disclaimers" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                8. Disclaimers and Technical Limitations
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula is provided on an <strong>“as is” and “as available”</strong> basis to the extent permitted by applicable law.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula&apos;s observations and intelligence are based on information available to the service at the time of analysis. Internet infrastructure can change quickly, and factors such as DNS propagation, routing changes, CDN behavior, network conditions, and configuration changes may affect results.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula does not guarantee that information obtained from third-party or publicly observable infrastructure is current, complete, or controlled by Nebula.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula does not guarantee that its observations or findings are complete, error-free, or suitable for every purpose.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula provides infrastructure intelligence and technical information. It does not constitute legal advice, regulatory advice, professional cybersecurity advice, or a guarantee of security or compliance.
              </p>
            </section>

            {/* 9. Limitation of Liability */}
            <section id="liability" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                9. Limitation of Liability
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                To the maximum extent permitted by applicable law, Argonion will not be responsible for indirect, incidental, special, consequential, or punitive losses arising from or related to your use of, or inability to use, Nebula.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                To the maximum extent permitted by applicable law, Argonion&apos;s total liability arising from or related to Nebula or these Terms will be limited to the amount you paid for Nebula during the twelve months preceding the event giving rise to the claim.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nothing in these Terms limits liability that cannot lawfully be limited or excluded under applicable law.
              </p>
            </section>

            {/* 10. Indemnification */}
            <section id="indemnification" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                10. Indemnification
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                To the extent permitted by applicable law, you agree to indemnify and hold Argonion harmless from claims, losses, liabilities, and reasonable expenses arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.75] text-foreground/85">
                <li>your material violation of these Terms;</li>
                <li>your unlawful or unauthorized use of Nebula;</li>
                <li>your submission of domains or infrastructure that you were not authorized to submit; or</li>
                <li>your violation of applicable law or the rights of another person or organization.</li>
              </ul>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Argonion will provide reasonable notice of any claim for which it seeks indemnification and, where appropriate, allow you to participate in its defense.
              </p>
            </section>

            {/* 11. Changes to These Terms */}
            <section id="changes" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                11. Changes to These Terms
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                We may update these Terms from time to time as Nebula evolves or as legal or operational requirements change.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                When we make material changes, we will update the <strong>Last Updated</strong> date and, where appropriate, provide additional notice.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Your continued use of Nebula after updated Terms take effect means that you accept the revised Terms. If you do not agree with the changes, you should stop using Nebula.
              </p>
            </section>

            {/* 12. Governing Law and Dispute Resolution */}
            <section id="governing-law" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                12. Governing Law and Dispute Resolution
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                These Terms are governed by the laws of <strong>[Jurisdiction to be determined]</strong>, without regard to conflict-of-law principles.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                If a dispute arises, you and Argonion agree to first make a reasonable effort to resolve it informally by contacting us and providing a description of the issue.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nothing in this section prevents either party from seeking urgent or legally available relief where necessary.
              </p>
            </section>

            {/* 13. General Provisions */}
            <section id="general" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                13. General Provisions
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue to apply.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Our failure to enforce a provision of these Terms does not constitute a waiver of our right to enforce it later.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                These Terms, together with the{' '}
                <a
                  href="/privacy"
                  className="text-foreground underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
                >
                  Privacy Policy
                </a>{' '}
                and any applicable service-specific terms, constitute the agreement between you and Argonion regarding your use of Nebula.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                You may not transfer your rights or obligations under these Terms without our prior written consent. Argonion may transfer or assign its rights and obligations in connection with a merger, acquisition, reorganization, or transfer of the relevant business.
              </p>
            </section>

            {/* 14. Contact Us */}
            <section id="contact" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                14. Contact Us
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                If you have questions about these Terms, need to report misuse, or have a legal or service-related inquiry, please contact Argonion using the contact information below.
              </p>
              <div className="p-4 rounded bg-muted/20 border-l-2 border-border-strong space-y-1 font-mono text-xs text-muted-foreground mt-4">
                <div className="text-foreground font-semibold">Argonion</div>
                <div>Legal &amp; Inquiries: [To be provided]</div>
                <div>Registered Address: [To be provided]</div>
              </div>
            </section>

          </article>
        </div>
      </main>

      {/* Minimal Public Legal Footer */}
      <footer className="border-t border-border/50 py-8 px-6 md:px-12 text-center text-xs font-mono text-muted-foreground bg-background/50">
        <p>&copy; {new Date().getFullYear()} Argonion. All rights reserved.</p>
      </footer>
    </div>
  );
};

TermsPage.displayName = 'TermsPage';
export default TermsPage;
