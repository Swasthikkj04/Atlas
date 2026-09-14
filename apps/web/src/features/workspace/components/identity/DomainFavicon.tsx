import React, { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  type DomainFaviconProps,
  type DomainIdentitySize,
  sanitizeDomain,
  resolveFaviconUrls,
} from './DomainFavicon.types';

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
  const [urlIndex, setUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const cleanDomain = sanitizeDomain(domain);
  const urls = resolveFaviconUrls(cleanDomain);

  // Reset state when domain changes
  useEffect(() => {
    setUrlIndex(0);
    setHasError(false);
    setIsLoaded(false);
  }, [cleanDomain]);

  // Check if image is immediately available from browser cache
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [cleanDomain, urlIndex]);

  const handleImageError = () => {
    if (urlIndex < urls.length - 1) {
      setUrlIndex((prev) => prev + 1);
      setIsLoaded(false);
    } else {
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  if (!cleanDomain || hasError || urls.length === 0) {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 bg-[#F4F4F1] dark:bg-[#242422] border border-[#E2E2DD] dark:border-[#2E2E2B] text-[#5F625F] dark:text-[#8E8E8A] ${CONTAINER_SIZES[size]} ${className}`}
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

  const currentUrl = urls[urlIndex];

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 overflow-hidden bg-[#FFFFFF] dark:bg-[#1C1C1A] border border-[#E1E1DC] dark:border-[#2E2E2B] ${CONTAINER_SIZES[size]} ${className}`}
      data-testid="domain-favicon-container"
      {...rest}
    >
      <img
        ref={imgRef}
        key={`${cleanDomain}-${urlIndex}`}
        src={currentUrl}
        alt=""
        aria-hidden="true"
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${IMAGE_SIZES[size]} object-contain transition-opacity duration-150 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        data-testid="domain-favicon-img"
      />
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center text-[#5F625F] dark:text-[#8E8E8A] pointer-events-none"
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
