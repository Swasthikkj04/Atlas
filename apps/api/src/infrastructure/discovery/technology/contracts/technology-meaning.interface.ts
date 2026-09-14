export interface TechnologyMeaning {
  /**
   * Question 2: Why do we believe this technology is present?
   * Traceable explanation directly derived from matched observations and signals.
   */
  readonly whyDetected: string;

  /**
   * Question 3: What role does it play in this infrastructure?
   * The architectural/operational function (e.g. Edge / CDN delivery, Web Server, Framework).
   */
  readonly role: string;

  /**
   * Question 4: What does its presence mean for this infrastructure?
   * Nuanced explanation of the technical and operational implications.
   */
  readonly infrastructureMeaning: string;

  /**
   * Boundary Enforcement: What this detection does NOT prove.
   * Explicitly prevents unsupported claims (e.g. CloudFront != EC2 origin; Next.js != Vercel hosting).
   */
  readonly whatThisDoesNotProve?: string;

  /**
   * Key operational and architectural takeaways.
   */
  readonly implications?: string[];
}
