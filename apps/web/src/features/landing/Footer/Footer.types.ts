export interface FooterColumn {
  title: string;
  links: { label: string; href: string; isExternal?: boolean }[];
}

export interface FooterProps {
  logoSrc?: string;
  columns?: FooterColumn[];
  copyright?: string;
  className?: string;
}
