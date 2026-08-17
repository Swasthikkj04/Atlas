// GuestLayout — GX-004
//
// Structural shell for the /guest route.
// Owns: max-width, responsive spacing contract, vertical rhythm, page structure.
// Does NOT own: state, data, business logic, motion.
//
// Usage:
//   <GuestLayout>
//     <GuestHeader ... />
//     <main> ... </main>
//     <ThemeToggle ... />
//   </GuestLayout>

import type { ReactNode } from "react";

interface GuestLayoutProps {
  children: ReactNode;
}

export function GuestLayout({ children }: GuestLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {children}
    </div>
  );
}

// ── ContentWidth ────────────────────────────────────────────────────────────
// Standard full-bleed-to-centred content wrapper used by all sections.
// max-w-[720px] is the editorial column for body content.

interface ContentWidthProps {
  children: ReactNode;
  className?: string;
  /** Override max width for wider sections (e.g. evidence table) */
  wide?: boolean;
}

export function ContentWidth({ children, className = "", wide = false }: ContentWidthProps) {
  return (
    <div
      className={`
        mx-auto px-5 sm:px-10
        ${wide ? "max-w-[960px]" : "max-w-[720px]"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ── SectionSpacer ───────────────────────────────────────────────────────────
// Consistent vertical rhythm between sections.
// "sm" = between cards within a section.
// "md" = between top-level sections (default).
// "lg" = before conversion / footer.

type SpacerSize = "sm" | "md" | "lg";

const SPACER_CLASS: Record<SpacerSize, string> = {
  sm: "h-8  sm:h-10",
  md: "h-16 sm:h-20",
  lg: "h-24 sm:h-32",
};

interface SectionSpacerProps {
  size?: SpacerSize;
}

export function SectionSpacer({ size = "md" }: SectionSpacerProps) {
  return <div className={SPACER_CLASS[size]} aria-hidden="true" />;
}
