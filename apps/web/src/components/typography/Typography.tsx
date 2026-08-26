import React from 'react';
import type { TypographyProps, TypographyRole, TypographyVariant } from './Typography.types';

const ROLE_ELEMENT_MAP: Record<TypographyRole, React.ElementType> = {
  Display: 'h1',
  DisplayXl: 'h1',
  PageTitle: 'h1',
  SectionTitle: 'h2',
  CardTitle: 'h3',
  Subheader: 'h4',
  BodyLarge: 'p',
  Body: 'p',
  BodySmall: 'p',
  Caption: 'span',
  Eyebrow: 'span',
  Technical: 'code',
  TechnicalSmall: 'code',
};

const ROLE_CLASS_MAP: Record<TypographyRole, string> = {
  Display: 'font-display text-display-2xl font-normal',
  DisplayXl: 'font-display text-display-xl font-normal',
  PageTitle: 'font-sans text-heading-1 font-medium tracking-tight',
  SectionTitle: 'font-sans text-heading-2 font-medium tracking-tight',
  CardTitle: 'font-sans text-heading-3 font-semibold',
  Subheader: 'font-sans text-heading-4 font-semibold',
  BodyLarge: 'font-sans text-body-lg font-normal leading-relaxed',
  Body: 'font-sans text-body font-normal leading-relaxed',
  BodySmall: 'font-sans text-body-sm font-normal',
  Caption: 'font-sans text-caption font-normal',
  Eyebrow: 'font-sans text-eyebrow font-semibold tracking-widest uppercase',
  Technical: 'font-mono text-mono-code tabular-nums',
  TechnicalSmall: 'font-mono text-mono-sm tabular-nums',
};

const VARIANT_CLASS_MAP: Record<TypographyVariant, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  subtle: 'text-muted-foreground/80',
  accent: 'text-primary',
  critical: 'text-severity-critical',
  high: 'text-severity-high',
  medium: 'text-severity-medium',
  low: 'text-severity-low',
  info: 'text-severity-info',
  success: 'text-severity-success',
};

/**
 * Authoritative Typography Component.
 *
 * Enforces semantic typography roles and prevents arbitrary font styles.
 */
export const Typography: React.FC<TypographyProps> = ({
  role = 'Body',
  as,
  variant = 'default',
  serif = false,
  mono = false,
  tabular = false,
  className = '',
  children,
  ...rest
}) => {
  const Component = as || ROLE_ELEMENT_MAP[role] || 'p';
  const roleClass = ROLE_CLASS_MAP[role] || ROLE_CLASS_MAP.Body;
  const variantClass = VARIANT_CLASS_MAP[variant] || VARIANT_CLASS_MAP.default;

  const fontOverride = serif ? 'font-serif' : mono ? 'font-mono' : '';
  const tabularClass = tabular ? 'tabular-nums' : '';

  const classes = [roleClass, variantClass, fontOverride, tabularClass, className]
    .filter(Boolean)
    .join(' ');

  return React.createElement(Component, { className: classes, ...rest }, children);
};

Typography.displayName = 'Typography';

/* ── Role Shorthand Components ───────────────────────────────────────────── */

export const Display: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="Display" {...props} />
);

export const DisplayXl: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="DisplayXl" {...props} />
);

export const PageTitle: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="PageTitle" {...props} />
);

export const SectionTitle: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="SectionTitle" {...props} />
);

export const CardTitle: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="CardTitle" {...props} />
);

export const Subheader: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="Subheader" {...props} />
);

export const BodyLarge: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="BodyLarge" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="Body" {...props} />
);

export const BodySmall: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="BodySmall" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="Caption" {...props} />
);

export const Eyebrow: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="Eyebrow" {...props} />
);

export const Technical: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="Technical" mono tabular {...props} />
);

export const TechnicalSmall: React.FC<Omit<TypographyProps, 'role'>> = (props) => (
  <Typography role="TechnicalSmall" mono tabular {...props} />
);
