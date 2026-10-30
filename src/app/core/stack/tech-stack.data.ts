import { StackLayer } from './stack-layer.model';

/** Layers of the home #stack section, top (what users touch) to bottom (what it runs on). Every key is in all 4 languages. */
export const TECH_STACK: StackLayer[] = [
  {
    icon: 'fa-desktop',
    nameKey: 'stack_l1_name',
    whyKey: 'stack_l1_why',
    items: [
      { label: 'Angular' },
      { label: 'Next.js' },
      { label: 'TypeScript' },
      { label: 'Tailwind CSS' },
      { label: 'Swift' },
      { label: 'Kotlin' },
    ],
  },
  {
    icon: 'fa-server',
    nameKey: 'stack_l2_name',
    whyKey: 'stack_l2_why',
    items: [{ label: 'Java' }, { label: 'Spring Boot' }, { label: 'stack_item_rest', translate: true }],
  },
  {
    icon: 'fa-database',
    nameKey: 'stack_l3_name',
    whyKey: 'stack_l3_why',
    items: [{ label: 'PostgreSQL' }],
  },
  {
    icon: 'fa-cloud',
    nameKey: 'stack_l4_name',
    whyKey: 'stack_l4_why',
    items: [
      { label: 'Kubernetes' },
      { label: 'Docker' },
      { label: 'stack_item_lb', translate: true },
      { label: 'AWS' },
      { label: 'Azure' },
      { label: 'Google Cloud' },
    ],
  },
];
