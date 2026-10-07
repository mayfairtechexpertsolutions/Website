import { Product } from './product.model';

export const PRODUCTS: Product[] = [
  {
    slug: 'erp',
    href: '/erp.html',
    icon: 'fa-boxes-stacked',
    isNew: true,
    nameKey: 'product_erp_name',
    taglineKey: 'product_erp_tagline',
    highlightKeys: ['product_erp_highlight1', 'product_erp_highlight2', 'product_erp_highlight3'],
  },
];
