import React from 'react';

export type TypographyRole =
  | 'Display'
  | 'DisplayXl'
  | 'PageTitle'
  | 'SectionTitle'
  | 'CardTitle'
  | 'Subheader'
  | 'BodyLarge'
  | 'Body'
  | 'BodySmall'
  | 'Caption'
  | 'Eyebrow'
  | 'Technical'
  | 'TechnicalSmall';

export type TypographyVariant =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'accent'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info'
  | 'success';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  role?: TypographyRole;
  as?: React.ElementType;
  variant?: TypographyVariant;
  serif?: boolean;
  mono?: boolean;
  tabular?: boolean;
  children?: React.ReactNode;
  className?: string;
}
