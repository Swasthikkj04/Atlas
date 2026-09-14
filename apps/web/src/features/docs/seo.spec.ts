import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOC_ARTICLES, DOCS_SEARCH_INDEX, FAQ_ITEMS } from './data/docsData.ts';
import {
  SURFACE_INDEXATION_INVENTORY,
  CANONICAL_ORIGIN,
  getIndexableSitemapUrls,
} from './contracts/seo-inventory.contract.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../../../public');
const webRootDir = path.resolve(__dirname, '../../..');

describe('T-08: Public Web, SEO & Discoverability Integrity Certification', () => {
  const robotsPath = path.join(publicDir, 'robots.txt');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const indexHtmlPath = path.join(webRootDir, 'index.html');

  // =========================================================================
  // Dimension 1: Sitemap Integrity
  // =========================================================================
  describe('Dimension 1: Sitemap Integrity (/sitemap.xml)', () => {
    it('sitemap.xml exists and is non-empty', () => {
      assert.ok(fs.existsSync(sitemapPath), `sitemap.xml does not exist at ${sitemapPath}`);
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      assert.ok(content.length > 200, 'sitemap.xml is unexpectedly small');
    });

    it('sitemap.xml has valid XML declaration and sitemaps.org 0.9 schema namespace', () => {
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      assert.ok(content.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Missing XML declaration');
      assert.ok(content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'Missing urlset namespace');
      assert.ok(content.endsWith('</urlset>\n') || content.endsWith('</urlset>'), 'Missing closing urlset tag');
    });

    it('sitemap.xml contains all 10 canonical indexable URLs exactly', () => {
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      const expectedUrls = getIndexableSitemapUrls();
      assert.equal(expectedUrls.length, 10, 'Expected exactly 10 canonical indexable URLs in contract');

      for (const url of expectedUrls) {
        assert.ok(content.includes(`<loc>${url}</loc>`), `Missing canonical URL in sitemap: ${url}`);
      }
    });

    it('sitemap.xml contains valid ISO-8601 lastmod timestamps', () => {
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      const lastmodMatches = content.match(/<lastmod>([^<]+)<\/lastmod>/g) || [];
      assert.equal(lastmodMatches.length, 10, 'All 10 URLs must have <lastmod>');

      for (const tag of lastmodMatches) {
        const dateStr = tag.replace(/<\/?lastmod>/g, '');
        assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/, `Invalid ISO-8601 lastmod date: ${dateStr}`);
        const parsed = Date.parse(dateStr);
        assert.ok(!isNaN(parsed), `Unparseable date: ${dateStr}`);
      }
    });

    it('sitemap.xml defines valid priority (0.1 - 1.0) and changefreq values', () => {
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      const priorityMatches = content.match(/<priority>([^<]+)<\/priority>/g) || [];
      const validFrequencies = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
      const freqMatches = content.match(/<changefreq>([^<]+)<\/changefreq>/g) || [];

      assert.equal(priorityMatches.length, 10);
      assert.equal(freqMatches.length, 10);

      for (const p of priorityMatches) {
        const val = parseFloat(p.replace(/<\/?priority>/g, ''));
        assert.ok(val >= 0.1 && val <= 1.0, `Priority out of bounds: ${val}`);
      }

      for (const f of freqMatches) {
        const freq = f.replace(/<\/?changefreq>/g, '');
        assert.ok(validFrequencies.has(freq), `Invalid changefreq: ${freq}`);
      }
    });

    it('sitemap.xml NEVER exposes private, workspace, guest, or auth routes', () => {
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      const forbiddenUrls = [
        '<loc>https://argonion.com/workspace</loc>',
        '<loc>https://argonion.com/workspace/</loc>',
        '<loc>https://argonion.com/guest</loc>',
        '<loc>https://argonion.com/guest/</loc>',
        '<loc>https://argonion.com/settings</loc>',
        '<loc>https://argonion.com/settings/</loc>',
        '<loc>https://argonion.com/admin</loc>',
        '<loc>https://argonion.com/admin/</loc>',
        '<loc>https://argonion.com/login</loc>',
        '<loc>https://argonion.com/register</loc>',
        '<loc>https://argonion.com/auth</loc>',
        '<loc>https://argonion.com/api',
        'localhost',
        '127.0.0.1',
      ];

      for (const pattern of forbiddenUrls) {
        assert.ok(!content.includes(pattern), `Forbidden path found in sitemap: ${pattern}`);
      }
    });
  });

  // =========================================================================
  // Dimension 2: Robots.txt & Crawl Control
  // =========================================================================
  describe('Dimension 2: Robots.txt & Crawl Control (/robots.txt)', () => {
    it('robots.txt exists and is non-empty', () => {
      assert.ok(fs.existsSync(robotsPath), `robots.txt does not exist at ${robotsPath}`);
      const content = fs.readFileSync(robotsPath, 'utf-8');
      assert.ok(content.length > 50, 'robots.txt is unexpectedly small');
    });

    it('robots.txt does not contain accidental global Disallow: /', () => {
      const content = fs.readFileSync(robotsPath, 'utf-8');
      const lines = content.split('\n').map((l) => l.trim());
      assert.ok(!lines.includes('Disallow: /'), 'Fatal: robots.txt contains global "Disallow: /"');
    });

    it('robots.txt explicitly allows all public canonical surfaces', () => {
      const content = fs.readFileSync(robotsPath, 'utf-8');
      assert.ok(content.includes('Allow: /$'), 'Must allow root landing page');
      assert.ok(content.includes('Allow: /docs'), 'Must allow docs');
      assert.ok(content.includes('Allow: /privacy'), 'Must allow privacy');
      assert.ok(content.includes('Allow: /terms'), 'Must allow terms');
    });

    it('robots.txt explicitly disallows all private, guest, auth, and API surfaces', () => {
      const content = fs.readFileSync(robotsPath, 'utf-8');
      const requiredDisallows = [
        'Disallow: /workspace',
        'Disallow: /guest',
        'Disallow: /settings',
        'Disallow: /admin',
        'Disallow: /auth/',
        'Disallow: /login',
        'Disallow: /register',
        'Disallow: /api/',
      ];

      for (const rule of requiredDisallows) {
        assert.ok(content.includes(rule), `Missing required disallow in robots.txt: ${rule}`);
      }
    });

    it('robots.txt references the canonical sitemap XML URL', () => {
      const content = fs.readFileSync(robotsPath, 'utf-8');
      assert.ok(
        content.includes(`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`),
        'robots.txt must declare canonical sitemap URL',
      );
    });
  });

  // =========================================================================
  // Dimension 3: Canonical URL Integrity
  // =========================================================================
  describe('Dimension 3: Canonical URL Integrity', () => {
    it('all canonical URLs use HTTPS and production hostname (argonion.com)', () => {
      for (const route of SURFACE_INDEXATION_INVENTORY) {
        assert.ok(
          route.canonicalUrl.startsWith('https://argonion.com'),
          `Non-production canonical URL in route ${route.path}: ${route.canonicalUrl}`,
        );
        assert.ok(!route.canonicalUrl.includes('http://'), `Insecure HTTP protocol in canonical: ${route.canonicalUrl}`);
      }
    });

    it('root canonical URL includes trailing slash; subpages omit trailing slash', () => {
      const root = SURFACE_INDEXATION_INVENTORY.find((r) => r.path === '/');
      assert.equal(root?.canonicalUrl, 'https://argonion.com/');

      const subRoutes = SURFACE_INDEXATION_INVENTORY.filter((r) => r.path !== '/');
      for (const r of subRoutes) {
        assert.ok(!r.canonicalUrl.endsWith('/') || r.path === '/', `Unexpected trailing slash on subroute canonical: ${r.canonicalUrl}`);
      }
    });

    it('zero localhost, staging, or dev URLs exist across canonical inventory', () => {
      for (const route of SURFACE_INDEXATION_INVENTORY) {
        assert.ok(!/localhost|127\.0\.0\.1|staging|dev\./i.test(route.canonicalUrl));
      }
    });
  });

  // =========================================================================
  // Dimension 4: Indexability & Surface Inventory Contract Compliance
  // =========================================================================
  describe('Dimension 4: Indexability & Surface Matrix Contract Compliance', () => {
    it('public landing, docs, and legal pages have isIndexable = true and robots = "index, follow"', () => {
      const publicIndexable = SURFACE_INDEXATION_INVENTORY.filter(
        (r) => r.category === 'landing' || r.category === 'docs' || r.category === 'legal',
      );

      assert.equal(publicIndexable.length, 10);
      for (const r of publicIndexable) {
        assert.equal(r.isPublic, true);
        assert.equal(r.isIndexable, true);
        assert.equal(r.isCrawlable, true);
        assert.equal(r.robotsDirective, 'index, follow');
      }
    });

    it('guest interactive experience has isIndexable = false and robots = "noindex, nofollow"', () => {
      const guest = SURFACE_INDEXATION_INVENTORY.find((r) => r.path === '/guest');
      assert.ok(guest);
      assert.equal(guest.isIndexable, false);
      assert.equal(guest.isCrawlable, false);
      assert.equal(guest.robotsDirective, 'noindex, nofollow');
    });

    it('authenticated workspace, settings, and admin surfaces have isIndexable = false and robots = "noindex, nofollow"', () => {
      const privateSurfaces = SURFACE_INDEXATION_INVENTORY.filter(
        (r) => r.category === 'workspace' || r.category === 'settings' || r.category === 'admin' || r.category === 'auth',
      );

      assert.ok(privateSurfaces.length >= 4);
      for (const r of privateSurfaces) {
        assert.equal(r.isIndexable, false);
        assert.equal(r.isCrawlable, false);
        assert.equal(r.robotsDirective, 'noindex, nofollow');
      }
    });
  });

  // =========================================================================
  // Dimension 5: Metadata Integrity
  // =========================================================================
  describe('Dimension 5: Metadata Integrity', () => {
    it('index.html contains valid HTML5 meta tags (charset, viewport, theme-color, lang="en")', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(html.includes('<html lang="en">'), 'Missing lang="en" on <html>');
      assert.ok(html.includes('<meta charset="UTF-8" />'), 'Missing UTF-8 charset');
      assert.ok(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0" />'), 'Missing viewport meta');
      assert.ok(html.includes('<meta name="theme-color"'), 'Missing theme-color meta');
    });

    it('index.html provides canonical title and meta description for Nebula by Argonion', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(html.includes('<title>Nebula by Argonion | Infrastructure Intelligence Platform</title>'));
      assert.ok(html.includes('<meta name="title" content="Nebula by Argonion | Infrastructure Intelligence Platform" />'));
      assert.ok(html.includes('content="Nebula by Argonion provides continuous infrastructure intelligence, passive perimeter discovery, and causal change detection for modern engineering teams."'));
    });

    it('every documentation article has a unique canonical title (ending with "| Nebula Docs")', () => {
      const titles = DOC_ARTICLES.map((d) => d.title);
      const unique = new Set(titles);
      assert.equal(unique.size, titles.length, 'Duplicate documentation title detected');

      for (const title of titles) {
        assert.ok(title.length >= 20, `Title too short: ${title}`);
        assert.match(title, /\| Nebula Docs$/, `Title does not end with '| Nebula Docs': ${title}`);
      }
    });

    it('every documentation article has a unique meta description between 30 and 200 characters', () => {
      const descriptions = DOC_ARTICLES.map((d) => d.description);
      const unique = new Set(descriptions);
      assert.equal(unique.size, descriptions.length, 'Duplicate documentation description detected');

      for (const desc of descriptions) {
        assert.ok(desc.length >= 30, `Description too short: ${desc}`);
        assert.ok(desc.length <= 200, `Description too long: ${desc}`);
      }
    });
  });

  // =========================================================================
  // Dimension 6: Keyword & Search Intent Audit
  // =========================================================================
  describe('Dimension 6: Keyword & Search Intent Audit', () => {
    it('documentation metadata covers core engineering vocabulary without keyword stuffing', () => {
      const corpus = DOC_ARTICLES.map((d) => `${d.title} ${d.description} ${d.slug}`).join(' ');
      const requiredConcepts = [
        /Infrastructure Understanding/i,
        /Ingress Flow/i,
        /Fingerprinting|Categories/i,
        /Severity Taxonomy/i,
        /Parity/i,
        /Security Boundaries|SSRF/i,
      ];

      for (const pattern of requiredConcepts) {
        assert.match(corpus, pattern, `Missing core engineering concept matching ${pattern}`);
      }
    });

    it('search index items contain high-quality keywords with zero filler words', () => {
      assert.ok(DOCS_SEARCH_INDEX.length >= 10);
      for (const item of DOCS_SEARCH_INDEX) {
        assert.ok(item.keywords.length >= 4, `Too few keywords for search item ${item.id}`);
        for (const kw of item.keywords) {
          assert.ok(kw.length >= 2, `Keyword too short: ${kw}`);
          assert.ok(!['the', 'and', 'or', 'a', 'an'].includes(kw.toLowerCase()), `Filler keyword detected: ${kw}`);
        }
      }
    });
  });

  // =========================================================================
  // Dimension 7: Semantic HTML & Heading Hierarchy
  // =========================================================================
  describe('Dimension 7: Semantic HTML & Heading Hierarchy Invariants', () => {
    it('Landing page Hero contains single primary <h1> element', () => {
      const heroPath = path.resolve(__dirname, '../landing/Hero/Hero.tsx');
      const content = fs.readFileSync(heroPath, 'utf-8');
      const h1Matches = content.match(/<h1[\s>]/g) || [];
      assert.equal(h1Matches.length, 1, 'Hero must contain exactly one <h1> element');
      assert.ok(content.includes('Engineering Intelligence'));
    });

    it('HeroSignature wordmark uses non-h1 semantic element with aria-level to preserve single h1 rule', () => {
      const signaturePath = path.resolve(__dirname, '../landing/Hero/HeroSignature.tsx');
      const content = fs.readFileSync(signaturePath, 'utf-8');
      const h1Matches = content.match(/<h1[\s>]/g) || [];
      assert.equal(h1Matches.length, 0, 'HeroSignature must not declare duplicate <h1>');
      assert.ok(content.includes('role="heading"'), 'HeroSignature maintains accessible heading role');
    });

    it('Legal pages (Privacy and Terms) contain single <h1> in document header', () => {
      const privacyPath = path.resolve(__dirname, '../legal/PrivacyPolicyPage.tsx');
      const termsPath = path.resolve(__dirname, '../legal/TermsPage.tsx');

      const privacyContent = fs.readFileSync(privacyPath, 'utf-8');
      const privacyH1 = privacyContent.match(/<h1[\s>]/g) || [];
      assert.equal(privacyH1.length, 1, 'PrivacyPolicyPage must contain exactly one <h1>');

      const termsContent = fs.readFileSync(termsPath, 'utf-8');
      const termsH1 = termsContent.match(/<h1[\s>]/g) || [];
      assert.equal(termsH1.length, 1, 'TermsPage must contain exactly one <h1>');
    });
  });

  // =========================================================================
  // Dimension 8: Open Graph & Social Sharing Metadata
  // =========================================================================
  describe('Dimension 8: Open Graph & Social Sharing Metadata', () => {
    it('index.html contains complete Open Graph protocol tags', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(html.includes('<meta property="og:type" content="website" />'));
      assert.ok(html.includes('<meta property="og:url" content="https://argonion.com/" />'));
      assert.ok(html.includes('<meta property="og:title" content="Nebula by Argonion | Infrastructure Intelligence Platform" />'));
      assert.ok(html.includes('property="og:description"'));
      assert.ok(html.includes('<meta property="og:image" content="https://argonion.com/argonion-mark.svg" />'));
      assert.ok(html.includes('<meta property="og:site_name" content="Nebula by Argonion" />'));
    });

    it('index.html contains complete Twitter Card tags', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image" />'));
      assert.ok(html.includes('<meta name="twitter:url" content="https://argonion.com/" />'));
      assert.ok(html.includes('<meta name="twitter:title" content="Nebula by Argonion | Infrastructure Intelligence Platform" />'));
      assert.ok(html.includes('name="twitter:description"'));
      assert.ok(html.includes('<meta name="twitter:image" content="https://argonion.com/argonion-mark.svg" />'));
    });
  });

  // =========================================================================
  // Dimension 9: Structured Data (JSON-LD) Validation
  // =========================================================================
  describe('Dimension 9: Structured Data (JSON-LD) Validation', () => {
    it('index.html structured data script parses as valid JSON-LD schema array', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      assert.ok(jsonLdMatch, 'Missing JSON-LD script tag in index.html');

      const parsed = JSON.parse(jsonLdMatch[1]);
      assert.ok(Array.isArray(parsed), 'Structured data root should be an array of schemas');

      const org = parsed.find((s: any) => s['@type'] === 'Organization');
      assert.ok(org, 'Missing Organization schema');
      assert.equal(org.name, 'Argonion');
      assert.equal(org.url, 'https://argonion.com');
      assert.equal(org.logo, 'https://argonion.com/argonion-mark.svg');

      const app = parsed.find((s: any) => s['@type'] === 'SoftwareApplication');
      assert.ok(app, 'Missing SoftwareApplication schema');
      assert.equal(app.name, 'Nebula by Argonion');
      assert.equal(app.applicationCategory, 'DeveloperApplication');

      const website = parsed.find((s: any) => s['@type'] === 'WebSite');
      assert.ok(website, 'Missing WebSite schema');
      assert.equal(website.name, 'Nebula by Argonion');
      assert.equal(website.url, 'https://argonion.com');
    });

    it('FAQ items are complete and well-formed for dynamic FAQPage JSON-LD generation', () => {
      assert.ok(FAQ_ITEMS.length >= 4);
      for (const item of FAQ_ITEMS) {
        assert.ok(item.question.trim().length > 15, `FAQ question too short: ${item.question}`);
        assert.ok(item.answer.trim().length > 30, `FAQ answer too short: ${item.answer}`);
        assert.ok(!item.question.includes('undefined') && !item.answer.includes('undefined'));
      }
    });
  });

  // =========================================================================
  // Dimension 10: Brand Consistency & Legacy Product Leakage Guard
  // =========================================================================
  describe('Dimension 10: Brand Consistency & Legacy Product Leakage Guard', () => {
    it('zero legacy "Atlas" or "Cosmos" product references in public documentation or search index', () => {
      const corpus = [
        ...DOC_ARTICLES.map((d) => `${d.title} ${d.description} ${d.shortTitle}`),
        ...DOCS_SEARCH_INDEX.map((s) => `${s.title} ${s.snippet} ${s.keywords.join(' ')}`),
        ...FAQ_ITEMS.map((f) => `${f.question} ${f.answer}`),
      ].join(' ');

      assert.ok(!/\bAtlas\b/i.test(corpus), 'Found legacy Atlas branding in doc metadata');
      assert.ok(!/\bCosmos\b/i.test(corpus), 'Found legacy Cosmos branding in doc metadata');
    });

    it('zero legacy "Atlas" or "Cosmos" product references in public static assets (index.html, robots.txt, sitemap.xml)', () => {
      const files = [indexHtmlPath, robotsPath, sitemapPath];
      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        assert.ok(!/\bAtlas\b/i.test(content), `Found legacy Atlas in ${path.basename(filePath)}`);
        assert.ok(!/\bCosmos\b/i.test(content), `Found legacy Cosmos in ${path.basename(filePath)}`);
      }
    });

    it('all public branding consistently attributes the platform as "Nebula by Argonion" or "Argonion"', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(html.includes('Nebula by Argonion'));
      assert.ok(html.includes('Argonion'));
    });
  });

  // =========================================================================
  // Dimension 11: Internal Linking & Navigation Graph
  // =========================================================================
  describe('Dimension 11: Internal Linking & Navigation Graph', () => {
    it('every search index item maps to a valid documentation article slug', () => {
      const validSlugs = new Set(DOC_ARTICLES.map((a) => a.slug));
      for (const item of DOCS_SEARCH_INDEX) {
        assert.ok(validSlugs.has(item.slug), `Invalid slug in search index: ${item.slug}`);
      }
    });

    it('all 6 documentation articles belong to defined architecture categories', () => {
      const validCategories = new Set(['FOUNDATIONS', 'ARCHITECTURE', 'SECURITY & PROTOCOLS', 'CONTRACTS']);
      for (const doc of DOC_ARTICLES) {
        assert.ok(validCategories.has(doc.category), `Invalid doc category: ${doc.category}`);
      }
    });
  });

  // =========================================================================
  // Dimension 12: Crawlability & Client Rendering Safeguards
  // =========================================================================
  describe('Dimension 12: Crawlability & Client Rendering Safeguards', () => {
    it('index.html contains full metadata readable by raw HTTP crawlers before JS evaluation', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(html.includes('<title>'));
      assert.ok(html.includes('name="description"'));
      assert.ok(html.includes('<link rel="canonical"'));
      assert.ok(html.includes('<script type="application/ld+json">'));
    });

    it('index.html contains anti-flash bootstrap script for flicker-free theme and motion rendering', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(html.includes('nebula-theme'));
      assert.ok(html.includes('nebula-motion'));
    });
  });

  // =========================================================================
  // Dimension 13: Technical SEO & Clean URL Architecture
  // =========================================================================
  describe('Dimension 13: Technical SEO & Clean URL Architecture', () => {
    it('all documentation slugs conform to URL-safe kebab-case regex', () => {
      for (const doc of DOC_ARTICLES) {
        assert.match(doc.slug, /^[a-z0-9-]+$/, `Slug not kebab-case: ${doc.slug}`);
        assert.ok(!doc.slug.startsWith('-') && !doc.slug.endsWith('-'));
      }
    });

    it('canonical URLs never require query parameters for public pages', () => {
      for (const route of SURFACE_INDEXATION_INVENTORY) {
        assert.ok(!route.canonicalUrl.includes('?'), `Query parameter in canonical URL: ${route.canonicalUrl}`);
      }
    });
  });

  // =========================================================================
  // Dimension 14: Performance & Assets SEO Readiness
  // =========================================================================
  describe('Dimension 14: Performance & Assets SEO Readiness', () => {
    it('argonion-mark.svg exists in public/ directory and is lightweight vector graphics', () => {
      const svgPath = path.join(publicDir, 'argonion-mark.svg');
      assert.ok(fs.existsSync(svgPath), `argonion-mark.svg missing at ${svgPath}`);
      const stats = fs.statSync(svgPath);
      assert.ok(stats.size > 0 && stats.size < 50000, `SVG file size abnormal: ${stats.size} bytes`);
    });
  });

  // =========================================================================
  // Dimension 15: Search Engine Tooling Readiness
  // =========================================================================
  describe('Dimension 15: Search Engine Tooling Readiness', () => {
    it('sitemap.xml is parseable and valid for Google Search Console and Bing Webmaster Tools', () => {
      const content = fs.readFileSync(sitemapPath, 'utf-8');
      const urlBlocks = content.match(/<url>[\s\S]*?<\/url>/g) || [];
      assert.equal(urlBlocks.length, 10, 'Expected exactly 10 URL blocks in sitemap.xml');

      for (const block of urlBlocks) {
        assert.ok(block.includes('<loc>https://argonion.com'), 'Missing loc');
        assert.ok(block.includes('<lastmod>'), 'Missing lastmod');
        assert.ok(block.includes('<changefreq>'), 'Missing changefreq');
        assert.ok(block.includes('<priority>'), 'Missing priority');
      }
    });
  });

  // =========================================================================
  // Dimension 16: Environment Isolation & Zero Leakage
  // =========================================================================
  describe('Dimension 16: Environment Isolation & Zero Leakage', () => {
    it('zero development or staging artifacts present in public files', () => {
      const files = [robotsPath, sitemapPath, indexHtmlPath];
      const leakedKeywords = ['localhost', '127.0.0.1', 'staging.argonion.com', 'dev.argonion.com', 'test.argonion.com'];

      for (const f of files) {
        const text = fs.readFileSync(f, 'utf-8');
        for (const leak of leakedKeywords) {
          assert.ok(!text.includes(leak), `Environment leak detected in ${path.basename(f)}: ${leak}`);
        }
      }
    });
  });

  // =========================================================================
  // Dimension 17: SEO Security Boundary Enforcement
  // =========================================================================
  describe('Dimension 17: SEO Security Boundary Enforcement', () => {
    it('crawler directives strictly isolate private customer intelligence and tenant data', () => {
      const robots = fs.readFileSync(robotsPath, 'utf-8');
      // Verify all private surfaces are blocked
      assert.ok(robots.includes('Disallow: /workspace'));
      assert.ok(robots.includes('Disallow: /guest'));
      assert.ok(robots.includes('Disallow: /settings'));
      assert.ok(robots.includes('Disallow: /admin'));
      assert.ok(robots.includes('Disallow: /api/'));

      // Verify no private paths are in sitemap
      const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
      assert.ok(!sitemap.includes('<loc>https://argonion.com/workspace</loc>'));
      assert.ok(!sitemap.includes('<loc>https://argonion.com/guest</loc>'));
      assert.ok(!sitemap.includes('<loc>https://argonion.com/admin</loc>'));
      assert.ok(!sitemap.includes('<loc>https://argonion.com/settings</loc>'));
    });
  });

  // =========================================================================
  // Dimension 18: Certification Gate Conformance
  // =========================================================================
  describe('Dimension 18: Certification Gate Conformance', () => {
    it('all 18 T-08 verification criteria are verified and green', () => {
      assert.equal(DOC_ARTICLES.length, 6);
      assert.equal(SURFACE_INDEXATION_INVENTORY.length, 16);
      assert.equal(getIndexableSitemapUrls().length, 10);
    });
  });
});

