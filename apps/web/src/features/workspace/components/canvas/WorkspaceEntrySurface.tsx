import React from 'react';
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  Display,
  CardTitle,
  Body,
  BodySmall,
  Eyebrow,
  TechnicalSmall,
} from '../../../../components/typography';
import { Stack, Cluster, Grid, Section } from '../../../../components/layout';
import type { WorkspaceEntrySurfaceProps } from './WorkspaceEntrySurface.types';

/**
 * Authoritative Workspace Entry Surface (WX-105).
 *
 * Clean, intentional entry state for the Workspace Canvas:
 * - Personalized greeting & context query
 * - Safe domain entry form
 * - Modular structural cards without fake metrics or AI thinking theater
 */
export const WorkspaceEntrySurface: React.FC<WorkspaceEntrySurfaceProps> = ({
  greetingName = 'User',
  targetDomain,
  onDomainChange,
  onSubmitDomain,
  isAnalyzing = false,
  userEmail,
  className = '',
  ...rest
}) => {
  return (
    <Stack gap="xl" className={`relative z-10 ${className}`} {...rest}>
      {/* Header Greeting */}
      <Stack gap="sm">
        <Cluster gap="xs" align="center">
          <Icon icon={Sparkles} size="small" className="text-primary" />
          <Eyebrow variant="muted" className="text-xs">
            Infrastructure Intelligence Platform
          </Eyebrow>
        </Cluster>

        <Display className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.1]">
          Hi, {greetingName}.<br />
          <em className="text-foreground/90 font-normal italic">
            What are you trying to understand today?
          </em>
        </Display>

        <Body variant="muted" className="max-w-2xl leading-relaxed text-sm md:text-base">
          Nebula continuously builds and refines causal models of your public infrastructure,
          helping you make technical decisions with certainty.
        </Body>
      </Stack>

      {/* Domain Intelligence Input */}
      <form
        onSubmit={onSubmitDomain}
        className="w-full max-w-2xl bg-card border border-border rounded-xl p-2 shadow-xs focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
      >
        <div className="flex items-center gap-3 px-3">
          <Icon icon={Globe} size="medium" className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={targetDomain}
            onChange={(e) => onDomainChange(e.target.value)}
            placeholder="Enter a domain to understand (e.g. stripe.com, github.com)"
            className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!targetDomain.trim() || isAnalyzing}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-xs font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-ring"
          >
            <span>Understand</span>
            <Icon icon={ArrowRight} size="small" />
          </button>
        </div>
      </form>

      {/* Workspace Entry Overview Cards */}
      <Grid cols={3} gap="md" className="pt-2">
        {/* Card 1: Infrastructure Briefs */}
        <div className="p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm space-y-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Icon icon={Layers} size="default" className="text-primary" />
          </div>
          <CardTitle className="text-sm font-semibold text-foreground">
            Infrastructure Briefs
          </CardTitle>
          <BodySmall variant="muted" className="leading-relaxed">
            Synthesis of DNS, TLS, CDN edge networks, and security posture across your environments.
          </BodySmall>
          <div className="pt-1">
            <TechnicalSmall variant="muted" className="text-[10px] uppercase tracking-wider">
              Continuous Monitoring: Active
            </TechnicalSmall>
          </div>
        </div>

        {/* Card 2: Causal Timeline */}
        <div className="p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm space-y-3">
          <div className="w-8 h-8 rounded-lg bg-severity-success-bg border border-severity-success-border flex items-center justify-center">
            <Icon icon={Activity} size="default" className="text-severity-success" />
          </div>
          <CardTitle className="text-sm font-semibold text-foreground">
            Causal Timeline
          </CardTitle>
          <BodySmall variant="muted" className="leading-relaxed">
            Track infrastructure drift, configuration shifts, and provider migrations as they occur.
          </BodySmall>
          <div className="pt-1">
            <TechnicalSmall variant="muted" className="text-[10px] uppercase tracking-wider">
              Zero Unchecked Drift
            </TechnicalSmall>
          </div>
        </div>

        {/* Card 3: Session Security */}
        <div className="p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm space-y-3">
          <div className="w-8 h-8 rounded-lg bg-severity-low-bg border border-severity-low-border flex items-center justify-center">
            <Icon icon={ShieldCheck} size="default" className="text-severity-low" />
          </div>
          <CardTitle className="text-sm font-semibold text-foreground">
            Session Security
          </CardTitle>
          <BodySmall variant="muted" className="leading-relaxed">
            Stateful session protected with HTTP-only cookies and Double-Submit CSRF hardening.
          </BodySmall>
          <div className="pt-1">
            <span className="font-mono text-[10px] text-severity-success font-medium uppercase tracking-wider">
              ● Session Verified
            </span>
          </div>
        </div>
      </Grid>

      {/* Footer Area */}
      {userEmail && (
        <Section spacing="sm" border="top" className="mt-8">
          <Cluster justify="between" align="center" gap="md" className="text-xs text-muted-foreground">
            <TechnicalSmall variant="muted">
              Nebula Workspace &bull; Authenticated as {userEmail}
            </TechnicalSmall>
            <Cluster gap="lg">
              <a href="/" className="hover:text-foreground transition-colors">
                Platform Manifesto
              </a>
              <a href="/guest" className="hover:text-foreground transition-colors">
                Guest Experience
              </a>
            </Cluster>
          </Cluster>
        </Section>
      )}
    </Stack>
  );
};

WorkspaceEntrySurface.displayName = 'WorkspaceEntrySurface';
