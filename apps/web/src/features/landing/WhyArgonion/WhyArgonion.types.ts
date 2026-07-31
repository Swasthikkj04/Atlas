export interface PillarItem {
  id: string;
  title: string;
  description: string;
  iconTag?: string;
}

export interface WhyArgonionProps {
  eyebrow?: string;
  title?: string;
  pillars?: PillarItem[];
  className?: string;
}
