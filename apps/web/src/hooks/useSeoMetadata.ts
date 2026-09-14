import { useEffect } from 'react';

export interface SeoMetadataOptions {
  title: string;
  description: string;
  canonicalUrl?: string;
  robots?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  keywords?: string[];
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

/**
 * Authoritative SEO & Crawl Engine Metadata Hook.
 *
 * Dynamically updates document title, standard meta descriptions, canonical URLs,
 * OpenGraph/Twitter social cards, robots indexability directives, and Schema.org JSON-LD.
 */
export function useSeoMetadata({
  title,
  description,
  canonicalUrl = 'https://argonion.com/docs/understanding-methodology',
  robots = 'index, follow',
  ogType = 'article',
  ogImage = 'https://argonion.com/argonion-mark.svg',
  keywords = [],
  structuredData,
}: SeoMetadataOptions): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Page Title
    const originalTitle = document.title;
    document.title = title;

    // Helper to create or update meta tags
    const setMetaTag = (attribute: string, attrValue: string, content: string) => {
      let meta = document.querySelector(`meta[${attribute}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, attrValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'title', title);
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robots);
    if (keywords.length > 0) {
      setMetaTag('name', 'keywords', keywords.join(', '));
    }

    // 3. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 4. OpenGraph Tags
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:site_name', 'Nebula by Argonion');

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:url', canonicalUrl);
    setMetaTag('name', 'twitter:image', ogImage);

    // 6. Schema.org JSON-LD Structured Data
    const scriptId = 'dynamic-seo-structured-data';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (structuredData) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }

    return () => {
      document.title = originalTitle;
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonicalUrl, robots, ogType, ogImage, JSON.stringify(keywords), JSON.stringify(structuredData)]);
}
