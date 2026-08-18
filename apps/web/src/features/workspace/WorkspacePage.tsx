import React, { useState, useEffect } from 'react';
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  LogOut,
  Moon,
  Sun,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';
import { getGreetingName } from '../auth/utils/name.util';
import { useTheme } from '../guest/hooks/useTheme';
import { NetworkBg } from '../auth/components/NetworkBg';

const SERIF = "'Lora', 'Newsreader', Georgia, serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

export const WorkspacePage: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { theme, setMode } = useTheme();
  const [targetDomain, setTargetDomain] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. Unauthenticated Redirection Effect (Only triggers after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  // 2. Loading State (Prevents premature unauthenticated ejection)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <NetworkBg dark={theme === 'dark'} />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-xl border border-border bg-card/60 flex items-center justify-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p style={{ fontFamily: SERIF }} className="text-xl font-medium text-foreground">
              Opening Nebula Workspace...
            </p>
            <p style={{ fontFamily: MONO }} className="text-xs text-muted-foreground">
              Verifying authenticated session credentials
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const greetingName = getGreetingName(user?.fullName);
  const dark = theme === 'dark';

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDomain.trim()) return;
    setIsAnalyzing(true);
    // Route to guest or workspace understanding engine
    const sanitized = targetDomain.trim().replace(/^https?:\/\//, '').split('/')[0];
    window.location.href = `/guest?domain=${encodeURIComponent(sanitized)}`;
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const toggleTheme = () => {
    setMode(dark ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col selection:bg-primary/20 selection:text-foreground">
      <NetworkBg dark={dark} />

      {/* Workspace Top Navigation */}
      <header className="relative z-20 h-16 border-b border-border bg-background/80 backdrop-blur-md px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/workspace"
            style={{ fontFamily: MONO }}
            className="text-xs tracking-[0.2em] uppercase font-semibold text-foreground hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ARGONION</span>
            <span className="opacity-30">/</span>
            <span>NEBULA</span>
          </a>
          <span
            style={{ fontFamily: MONO }}
            className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-muted/60 border border-border text-muted-foreground uppercase tracking-wider"
          >
            Workspace
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium leading-none text-foreground">
                {user?.fullName || 'User'}
              </p>
              <p style={{ fontFamily: MONO }} className="text-[10px] text-muted-foreground mt-0.5">
                {user?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
              title="Sign out of Nebula"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main FMX Entry Experience Surface */}
      <main className="flex-1 relative z-10 max-w-5xl w-full mx-auto px-6 md:px-10 py-12 md:py-20 flex flex-col justify-between">
        <div className="space-y-10">
          {/* Header Greeting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                style={{ fontFamily: MONO }}
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Infrastructure Intelligence Platform
              </span>
            </div>
            <h1
              style={{ fontFamily: SERIF }}
              className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.1]"
            >
              Hi, {greetingName}.<br />
              <em className="text-foreground/90 font-normal italic">
                What are you trying to understand today?
              </em>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed pt-1">
              Nebula continuously builds and refines causal models of your public infrastructure,
              helping you make technical decisions with certainty.
            </p>
          </div>

          {/* Domain Intelligence Input */}
          <form
            onSubmit={handleStartAnalysis}
            className="w-full max-w-2xl bg-card border border-border rounded-xl p-2 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
          >
            <div className="flex items-center gap-3 px-3">
              <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                placeholder="Enter a domain to understand (e.g. stripe.com, github.com)"
                className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!targetDomain.trim() || isAnalyzing}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-xs font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Understand</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Workspace Activity & Intelligence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            {/* Card 1: Infrastructure Overview */}
            <div className="p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm space-y-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Infrastructure Briefs</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Synthesis of DNS, TLS, CDN edge networks, and security posture across your environments.
              </p>
              <div className="pt-1">
                <span
                  style={{ fontFamily: MONO }}
                  className="text-[10px] text-muted-foreground/80 uppercase tracking-wider"
                >
                  Continuous Monitoring: Active
                </span>
              </div>
            </div>

            {/* Card 2: Timeline & Changes */}
            <div className="p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Causal Timeline</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Track infrastructure drift, configuration shifts, and provider migrations as they occur.
              </p>
              <div className="pt-1">
                <span
                  style={{ fontFamily: MONO }}
                  className="text-[10px] text-muted-foreground/80 uppercase tracking-wider"
                >
                  Zero Unchecked Drift
                </span>
              </div>
            </div>

            {/* Card 3: Security & Session Posture */}
            <div className="p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Session Security</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stateful session protected with HTTP-only cookies and Double-Submit CSRF hardening.
              </p>
              <div className="pt-1">
                <span
                  style={{ fontFamily: MONO }}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider"
                >
                  ● Session Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-12 mt-12 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p style={{ fontFamily: MONO }}>
            Nebula Workspace &bull; Authenticated as {user?.email}
          </p>
          <div className="flex items-center gap-6">
            <a href="/" className="hover:text-foreground transition-colors">
              Platform Manifesto
            </a>
            <a href="/guest" className="hover:text-foreground transition-colors">
              Guest Experience
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

WorkspacePage.displayName = 'WorkspacePage';
export default WorkspacePage;
