export interface NavLink {
  labelKey: string;
  path: string;
  fragment?: string;
}

export const MAIN_NAV_LINKS: NavLink[] = [
  { labelKey: 'nav_about', path: '/', fragment: 'about' },
  { labelKey: 'nav_concept', path: '/', fragment: 'concept' },
  { labelKey: 'nav_models', path: '/', fragment: 'models' },
  { labelKey: 'nav_careers', path: '/', fragment: 'careers' },
];

export const ERP_NAV_LINKS: NavLink[] = [
  { labelKey: 'erpnav_features', path: '/erp.html', fragment: 'features' },
  { labelKey: 'erpnav_personas', path: '/erp.html', fragment: 'personas' },
  { labelKey: 'erpnav_pricing', path: '/erp.html', fragment: 'pricing' },
  { labelKey: 'erpnav_consulting', path: '/' },
];
