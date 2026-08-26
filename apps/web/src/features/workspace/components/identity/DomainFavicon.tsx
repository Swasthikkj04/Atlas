import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { DomainFaviconProps, DomainIdentitySize } from './DomainFavicon.types';

const CONTAINER_SIZES: Record<DomainIdentitySize, string> = {
  primary: 'w-8 h-8 rounded-lg shadow-[0_1px_2px_rgba(16,24,20,0.035)]',
  secondary: 'w-7 h-7 rounded-md shadow-[0_1px_2px_rgba(16,24,20,0.035)]',
  compact: 'w-6 h-6 rounded-md',
};

const IMAGE_SIZES: Record<DomainIdentitySize, string> = {
  primary: 'w-5 h-5',
  secondary: 'w-4.5 h-4.5',
  compact: 'w-3.5 h-3.5',
};

const ICON_SIZES: Record<DomainIdentitySize, 'default' | 'small'> = {
  primary: 'default',
  secondary: 'small',
  compact: 'small',
};

function sanitizeDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

/**
 * DomainFavicon (WX-1021 / Domain Identity Primitive).
 *
 * Renders the authoritative domain favicon or a calm neutral globe fallback.
 * Guarantees:
 * - Native favicon colors preserved without decorative filters or glows
 * - Graceful fallback on error / timeout / unsupported image format
 * - Never shows broken image icons or blocks rendering
 * - Presentational visual anchor (not hosting / ownership evidence)
 */
export const DomainFavicon: React.FC<DomainFaviconProps> = ({
  domain,
  size = 'primary',
  className = '',
  fallbackIconClassName = '',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const cleanDomain = sanitizeDomain(domain);

  // Reset state when domain changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [cleanDomain]);

  if (!cleanDomain || hasError) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-[#F4F4F1] dark:bg-[#242422] border border-[#E2E2DD] dark:border-[#2E2E2B] text-[#5F625F] dark:text-[#8E8E8A] ${CONTAINER_SIZES[size]} ${className}`}
        data-testid="domain-favicon-fallback"
        aria-hidden="true"
        {...rest}
      >
        <Icon
          icon={Globe}
          size={ICON_SIZES[size]}
          className={`text-[#5F625F] dark:text-[#8E8E8A] ${IMAGE_SIZES[size]} ${fallbackIconClassName}`}
        />
      </div>
    );
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=64`;

  return (
    <div
      className={`flex items-center justify-center shrink-0 overflow-hidden bg-[#FFFFFF] dark:bg-[#1C1C1A] border border-[#E1E1DC] dark:border-[#2E2E2B] ${CONTAINER_SIZES[size]} ${className}`}
      data-testid="domain-favicon-container"
      {...rest}
    >
      <img
        src={faviconUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${IMAGE_SIZES[size]} object-contain transition-opacity duration-150 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        data-testid="domain-favicon-img"
      />
      {!isLoaded && !hasError && (
        <div
          className="absolute flex items-center justify-center text-[#5F625F] dark:text-[#8E8E8A]"
          aria-hidden="true"
        >
          <Icon
            icon={Globe}
            size={ICON_SIZES[size]}
            className={IMAGE_SIZES[size]}
          />
        </div>
      )}
    </div>
  );
};

DomainFavicon.displayName = 'DomainFavicon';
