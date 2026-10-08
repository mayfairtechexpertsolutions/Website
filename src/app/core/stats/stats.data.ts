import { Stat } from './stat.model';

/** Figures shown in the home "by the numbers" tickets. Update as the business grows. */
export const STATS: Stat[] = [
  { value: 100, suffix: '%', labelKey: 'stats_ip_label' },
  { value: 3, suffix: '', labelKey: 'stats_projects_label' },
  { value: 2, suffix: '', labelKey: 'stats_countries_label' },
  { value: 1, suffix: '', labelKey: 'stats_product_label' },
];
