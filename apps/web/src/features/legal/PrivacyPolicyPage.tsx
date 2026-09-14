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
  { id: 'scope', number: '1', label: 'Scope and Applicability' },
  { id: 'collection', number: '2', label: 'Information We Collect' },
  { id: 'usage', number: '3', label: 'How We Use Information' },
  { id: 'guest', number: '4', label: 'Guest Experience' },
  { id: 'infrastructure', number: '5', label: 'Infrastructure Intelligence Data' },
  { id: 'security-telemetry', number: '6', label: 'Security, Telemetry & Session Information' },
  { id: 'cookies', number: '7', label: 'Cookies and Local Storage' },
  { id: 'sharing', number: '8', label: 'Data Sharing and Third-Party Services' },
  { id: 'retention', number: '9', DataRetention: true, label: 'Data Retention' } as any,
  { id: 'account-lifecycle', number: '10', label: 'Account Deactivation and Deletion' },
  { id: 'rights', number: '11', label: 'Privacy Rights and Requests' },
  { id: 'international', number: '12', label: 'International Data Processing' },
  { id: 'children', number: '13', label: 'Children' },
  { id: 'changes', number: '14', label: 'Changes to This Policy' },
  { id: 'contact', number: '', label: 'Contact Us' },
];

export const PrivacyPolicyPage: React.FC = () => {
  useSeoMetadata({
    title: 'Privacy Policy | Nebula by Argonion',
    description:
      'Privacy Policy for Nebula by Argonion. Learn about our commitment to data protection, non-intrusive observation, and minimal data retention.',
    canonicalUrl: 'https://argonion.com/privacy',
    robots: 'index, follow',
    ogType: 'website',
  });

  const { theme, setMode } = useTheme();
  const dark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string>('scope');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      // Find the topmost intersecting section
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
            <nav className="space-y-1 relative" aria-label="Privacy policy navigation">
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
                Privacy Policy
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
                This Privacy Policy describes how <strong>Argonion</strong>, in connection with <strong>Nebula by Argonion</strong> (“Nebula”), handles information in connection with the Nebula service, including its public-facing surfaces, Guest Experience, authenticated Workspace, account functionality, and related security and operational services.
              </p>
              <p>
                This Policy is intended to provide a clear and accurate description of Nebula&apos;s information practices and the choices and rights available to individuals in relation to their information.
              </p>
              <div className="p-4 rounded bg-muted/20 border-l-2 border-border-strong text-xs font-mono text-muted-foreground space-y-1 mt-4">
                <div><strong>Registered Address:</strong> [To be provided]</div>
                <div><strong>Privacy Contact:</strong> [To be provided]</div>
              </div>
            </section>

            {/* 1. Scope and Applicability */}
            <section id="scope" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                1. Scope and Applicability
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                This Privacy Policy applies to information processed by <strong>Argonion</strong> in connection with <strong>Nebula by Argonion</strong> (“Nebula”).
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                It applies to individuals who:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.75] text-foreground/85">
                <li>visit or interact with Nebula’s public-facing website and product surfaces;</li>
                <li>use Nebula’s <strong>Guest Experience (GX)</strong> without creating an account;</li>
                <li>create, access, or maintain a Nebula account;</li>
                <li>use the authenticated <strong>Workspace (WX)</strong> and its associated functionality;</li>
                <li>interact with Nebula’s account, authentication, security, and preference features; or</li>
                <li>otherwise communicate or interact with Argonion in connection with Nebula.</li>
              </ul>
              
              <h3 className="text-sm font-semibold text-foreground tracking-tight pt-3">
                What this Policy does not cover
              </h3>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                This Privacy Policy does not apply to the information practices of third-party websites, services, or platforms that are not operated or controlled by Argonion, even where Nebula may provide an integration or authentication option involving such services (such as Google or GitHub).
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Those third parties have their own privacy policies and information practices. Users should review the applicable privacy information provided by those third parties when interacting with their services.
              </p>

              <h3 className="text-sm font-semibold text-foreground tracking-tight pt-3">
                Product-generated infrastructure information
              </h3>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula processes information obtained through its infrastructure intelligence functionality in connection with domains or internet infrastructure submitted to or processed by the service.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                The treatment of such infrastructure information is described in Section 5 of this Policy. The fact that information is technically observable from publicly accessible network infrastructure does not, by itself, determine whether that information constitutes personal information under applicable law.
              </p>

              <h3 className="text-sm font-semibold text-foreground tracking-tight pt-3">
                Relationship to other terms
              </h3>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                This Privacy Policy should be read together with Nebula’s applicable{' '}
                <a
                  href="/terms"
                  className="text-foreground underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
                >
                  Terms &amp; Conditions
                </a>{' '}
                and other legal notices published by Argonion. Where those documents address different subjects, each document applies to the subject matter described within it.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section id="collection" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                2. Information We Collect
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                Nebula collects only the information needed to provide, secure, and operate the service.
              </p>

              <div className="space-y-4 pt-1">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Account information
                </h3>
                <p className="text-[15px] leading-[1.75] text-foreground/85">
                  When you create an account, we may collect your name, email address, password credentials, and basic profile information associated with authentication providers such as Google or GitHub (such as your verified email address and name). Passwords are cryptographically hashed; raw passwords are never stored.
                </p>

                <h3 className="text-sm font-semibold text-foreground tracking-tight pt-2">
                  Workspace and preference information
                </h3>
                <p className="text-[15px] leading-[1.75] text-foreground/85">
                  Your Nebula account may include your saved domains, Workspace data, user preferences (such as theme or motion settings), and related infrastructure intelligence generated through your use of the service.
                </p>

                <h3 className="text-sm font-semibold text-foreground tracking-tight pt-2">
                  Guest Experience information
                </h3>
                <p className="text-[15px] leading-[1.75] text-foreground/85">
                  If you use Nebula without an account, we temporarily process the domain you submit and the information needed to run the requested understanding. Guest session data is automatically removed after <strong>24 hours</strong>. We do not persist your IP address or User-Agent in the database for guest sessions.
                </p>

                <h3 className="text-sm font-semibold text-foreground tracking-tight pt-2">
                  Infrastructure information
                </h3>
                <p className="text-[15px] leading-[1.75] text-foreground/85">
                  When Nebula analyzes a domain, it processes publicly observable infrastructure information such as DNS records, TLS certificate metadata, HTTP headers, redirect information, network timing, and routing information.
                </p>
                <div className="p-3 rounded bg-muted/20 border-l-2 border-border-strong text-xs font-mono text-muted-foreground">
                  <strong>Invariant:</strong> Nebula does <strong>not</strong> persist HTTP response bodies as part of this process.
                </div>

                <h3 className="text-sm font-semibold text-foreground tracking-tight pt-2">
                  Security and operational information
                </h3>
                <p className="text-[15px] leading-[1.75] text-foreground/85">
                  For authenticated accounts, Nebula may process session details, device and browser information, IP addresses associated with authenticated sessions, and security audit events to maintain session integrity, enforce access boundaries, and protect against abuse.
                </p>
                <p className="text-[15px] leading-[1.75] text-foreground/85">
                  Nebula also uses first-party telemetry designed to minimize personal information. IP addresses are masked and secrets or authentication tokens are removed before telemetry is stored.
                </p>
              </div>
            </section>

            {/* 3. How We Use Information */}
            <section id="usage" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                3. How We Use Information
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/90">
                We use information to provide and operate Nebula, including to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.75] text-foreground/85">
                <li>provide the Guest Experience and authenticated Workspace;</li>
                <li>analyze submitted domains and generate infrastructure intelligence, findings, briefs, and historical context;</li>
                <li>authenticate accounts and maintain secure sessions;</li>
                <li>remember account preferences and Workspace settings;</li>
                <li>protect Nebula, our users, and our systems from abuse, unauthorized access, and security threats;</li>
                <li>maintain, troubleshoot, and improve the reliability of the service; and</li>
                <li>communicate with users when necessary regarding their account, security, or the operation of Nebula.</li>
              </ul>
              <p className="text-[15px] leading-[1.75] text-foreground/90 font-medium pt-2">
                We do not use personal information for advertising, and we do not sell or rent personal information to third parties.
              </p>
            </section>

            {/* 4. Guest Experience */}
            <section id="guest" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                4. Guest Experience
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula allows you to use its Guest Experience without creating an account.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                When you use the Guest Experience, we temporarily process the domain you submit and the information required to run and return the requested understanding. A temporary guest session and associated job state are created to support the experience.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Guest session data is automatically and permanently removed after <strong>24 hours</strong>. We do not persist your IP address or User-Agent in the database as part of a guest session.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                If you later create a Nebula account within 24 hours, you may be able to claim eligible guest workspaces. When this occurs, the relevant domain and associated historical findings are transferred into your account.
              </p>
            </section>

            {/* 5. Infrastructure Intelligence Data */}
            <section id="infrastructure" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                5. Infrastructure Intelligence Data
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                When you ask Nebula to understand a domain or its infrastructure, Nebula processes information that is publicly observable from the relevant internet infrastructure.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                This may include:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-[15px] leading-[1.75] text-foreground/85">
                <li>DNS records (A, AAAA, MX, TXT, CAA, DNSSEC);</li>
                <li>TLS and certificate metadata;</li>
                <li>HTTP headers and redirect information;</li>
                <li>network timing information; and</li>
                <li>BGP and ASN routing information.</li>
              </ul>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula uses this information to build infrastructure snapshots, identify meaningful changes, generate findings, and provide historical context.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula does <strong>not</strong> persist HTTP response bodies as part of its infrastructure intelligence processing.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Infrastructure information relates to internet-facing systems and does not necessarily constitute personal information. Where information does constitute personal information under applicable law, Argonion handles it in accordance with this Privacy Policy.
              </p>
            </section>

            {/* 6. Security, Telemetry & Session Information */}
            <section id="security-telemetry" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                6. Security, Telemetry &amp; Session Information
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula processes certain information to keep accounts, sessions, and infrastructure secure and to maintain the reliability of the service.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                For authenticated accounts, this may include IP address, device and browser user-agent information, session identifiers, and securely stored refresh token credentials. This information is used for session protection, access control, and security audit monitoring.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula also uses first-party telemetry to understand product performance and error rates. Telemetry is designed to minimize personal data: IP addresses are masked before ingestion, and authentication secrets or tokens are removed.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula does not use third-party advertising tracking, marketing pixels, or third-party behavioral analytics SDKs.
              </p>
            </section>

            {/* 7. Cookies and Local Storage */}
            <section id="cookies" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                7. Cookies and Local Storage
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula uses cookies and browser storage only where necessary to provide, secure, and maintain your session.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.75] text-foreground/85">
                <li>
                  <strong>Essential Authentication &amp; Security Cookies:</strong> We use cookies to maintain authenticated sessions and protect against cross-site request forgery (CSRF). In production, these cookies are transmitted securely over HTTPS and configured with <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted/40">SameSite=Lax</code> and <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted/40">HttpOnly</code> attributes where appropriate.
                </li>
                <li>
                  <strong>Browser Storage:</strong> Nebula uses browser local storage for functional preferences, such as remembering your selected theme or interface view.
                </li>
              </ul>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula does not use cookies or local storage for cross-site tracking or advertising.
              </p>
            </section>

            {/* 8. Data Sharing and Third-Party Services */}
            <section id="sharing" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                8. Data Sharing and Third-Party Services
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Argonion does not sell or rent personal information.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula may share or make information available to trusted service providers that help us operate the platform:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-[15px] leading-[1.75] text-foreground/85">
                <li>Cloud compute, database, and caching infrastructure providers;</li>
                <li>Transactional email delivery services (for account verification and security notices); and</li>
                <li>Authentication providers (Google and GitHub, only when you choose to use Single Sign-On).</li>
              </ul>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                These providers process information only as needed to provide their services to Nebula and are subject to appropriate contractual and security safeguards.
              </p>
              <div className="p-3 rounded bg-muted/20 border-l-2 border-border-strong text-xs font-mono text-muted-foreground space-y-1">
                <strong>Internal Processing Invariant:</strong> Nebula does <strong>not</strong> send customer workspace data or infrastructure intelligence to external third-party AI or Large Language Model (LLM) providers. Nebula&apos;s intelligence, findings, and briefs are generated using its own internal processing systems.
              </div>
            </section>

            {/* 9. Data Retention */}
            <section id="retention" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                9. Data Retention
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                We retain information only for as long as needed to provide Nebula, maintain security, support historical understanding, or meet operational requirements.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[15px] leading-[1.75] text-foreground/85">
                <li><strong>Guest Experience data:</strong> automatically removed after 24 hours.</li>
                <li><strong>Raw infrastructure evidence:</strong> retained according to the applicable account plan, from 7 to 90 days.</li>
                <li><strong>Infrastructure snapshots:</strong> retained according to the applicable account plan, from 14 to 365 days.</li>
                <li><strong>Normalized facts and findings:</strong> retained for the duration of the active account to support historical change tracking.</li>
                <li><strong>Security and audit logs:</strong> retained according to operational needs and plan tiers, from 90 days to 3 years.</li>
                <li><strong>Database backups:</strong> maintained on a rolling basis for up to 30 days.</li>
              </ul>
            </section>

            {/* 10. Account Deactivation and Deletion */}
            <section id="account-lifecycle" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                10. Account Deactivation and Deletion
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                You can deactivate your Nebula account when you wish to pause use of the service. Deactivation disables normal account access while your account data is retained for future reactivation.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                You may also permanently delete your account. Account deletion is irreversible:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-[15px] leading-[1.75] text-foreground/85">
                <li>When an account is deleted, Nebula removes the account and associated records from its active systems, including saved domains, snapshots, findings, evidence, and active sessions.</li>
                <li>Residual data contained in system backups is removed as those backups expire through the standard 30-day rolling rotation.</li>
              </ul>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                If you need assistance with account deletion or have a privacy request, you can contact Argonion using the contact information below.
              </p>
            </section>

            {/* 11. Privacy Rights and Requests */}
            <section id="rights" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                11. Privacy Rights and Requests
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Depending on where you live and the laws that apply to you, you may have rights regarding the personal information we hold about you.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                These may include the right to:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-[15px] leading-[1.75] text-foreground/85">
                <li>request access to your personal information;</li>
                <li>request correction of inaccurate or incomplete information;</li>
                <li>request deletion of your personal information; and</li>
                <li>object to or request limits on certain processing activities.</li>
              </ul>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                To make a privacy request or inquire about your data, contact <strong>Argonion</strong> using the contact details provided below. We may need to verify your identity before completing certain requests.
              </p>
            </section>

            {/* 12. International Data Processing */}
            <section id="international" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                12. International Data Processing
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula uses service providers and infrastructure that may be located in countries other than where you live. Where information is processed across borders, Argonion takes appropriate steps to ensure that information is protected in accordance with this Privacy Policy and applicable law.
              </p>
            </section>

            {/* 13. Children */}
            <section id="children" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                13. Children
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                Nebula is intended for a general audience and is not designed specifically for children. We do not knowingly collect personal information from children where prohibited by applicable law.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                If you believe a child has provided personal information to Nebula in circumstances where it should not have been collected, please contact us so that we can review and delete the information.
              </p>
            </section>

            {/* 14. Changes to This Policy */}
            <section id="changes" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                14. Changes to This Policy
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                We may update this Privacy Policy from time to time as Nebula evolves or our operational and legal practices change.
              </p>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                When changes are made, we will update the <strong>Last Updated</strong> date at the top of this document and, where appropriate, provide additional notice.
              </p>
            </section>

            {/* Contact Us */}
            <section id="contact" className="space-y-4 pt-8 border-t border-border/40 scroll-mt-20">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight">
                Contact Us
              </h2>
              <p className="text-[15px] leading-[1.75] text-foreground/85">
                If you have questions about this Privacy Policy, wish to make a privacy request, or have concerns regarding how your information is handled, please contact:
              </p>
              <div className="p-4 rounded bg-muted/20 border-l-2 border-border-strong space-y-1 font-mono text-xs text-muted-foreground mt-4">
                <div className="text-foreground font-semibold">Argonion</div>
                <div>Privacy Contact: [To be provided]</div>
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

PrivacyPolicyPage.displayName = 'PrivacyPolicyPage';
export default PrivacyPolicyPage;
