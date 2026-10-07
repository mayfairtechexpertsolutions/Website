import { Stat } from './stat.model';

/** Figures shown in the home "by the numbers" tickets; only claims the site itself already makes. */
export const STATS: Stat[] = [
  { value: 100, suffix: '%', labelKey: 'stats_ip_label' },
  { value: 3, suffix: '', labelKey: 'stats_models_label' },
  { value: 4, suffix: '', labelKey: 'stats_disciplines_label' },
];
