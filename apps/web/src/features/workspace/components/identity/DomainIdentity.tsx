import React from 'react';
import { DomainFavicon } from './DomainFavicon';
import type { DomainIdentityProps, DomainIdentitySize } from './DomainIdentity.types';

const SPACING_SIZES: Record<DomainIdentitySize, string> = {
  primary: 'gap-3',
  secondary: 'gap-2.5',
  compact: 'gap-2',
};

const TEXT_SIZES: Record<DomainIdentitySize, string> = {
  primary: 'text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight font-display text-foreground',
  secondary: 'text-base sm:text-lg font-semibold tracking-tight text-foreground font-mono',
  compact: 'text-xs sm:text-[13px] font-mono font-medium text-foreground truncate',
};

/**
 * DomainIdentity (WX-1021 / Domain Identity Primitive).
 *
 * Visually anchors every Workspace surface with the infrastructure domain being observed.
 * Renders:
 * [ favicon ] domain.com
 * with optional subtitle, badges, or actions.
 */
export const DomainIdentity: React.FC<DomainIdentityProps> = ({
  domain,
  size = 'primary',
  title,
  subtitle,
  badge,
  actions,
  domainClassName = '',
  containerClassName = '',
  className = '',
  ...rest
}) => {
  const displayDomain = title ?? domain ?? 'Unknown Domain';

  return (
    <div
      className={`flex items-center justify-between ${containerClassName} ${className}`}
      data-testid="domain-identity"
      {...rest}
    >
      <div className={`flex items-center min-w-0 ${SPACING_SIZES[size]}`}>
        <DomainFavicon domain={domain} size={size} />

        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`${TEXT_SIZES[size]} ${domainClassName}`}
              data-testid="domain-identity-name"
            >
              {displayDomain}
            </span>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <div
              className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground mt-0.5"
              data-testid="domain-identity-subtitle"
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {actions && <div className="shrink-0 flex items-center">{actions}</div>}
    </div>
  );
};

DomainIdentity.displayName = 'DomainIdentity';
