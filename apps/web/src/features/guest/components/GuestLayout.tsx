import type { ReactNode } from "react";

interface GuestLayoutProps {
  children: ReactNode;
}

export function GuestLayout({ children }: GuestLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-app font-sans antialiased">
      {children}
    </div>
  );
}

interface ContentWidthProps {
  children: ReactNode;
  className?: string;
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

export default GuestLayout;
