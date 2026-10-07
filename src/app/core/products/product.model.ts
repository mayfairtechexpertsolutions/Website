export interface Product {
  slug: string;
  href: string;
  icon: string;
  isNew?: boolean;
  nameKey: string;
  taglineKey: string;
  highlightKeys: string[];
}
