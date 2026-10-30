/** Content registries for the repeated card blocks on the home page. Every value is an i18n key (all 4 languages). */

export interface BillingMode {
  icon: string;
  titleKey: string;
  descKey: string;
  pointKeys: string[];
}

export const BILLING_MODES: BillingMode[] = [
  { icon: 'fa-stopwatch', titleKey: 'bill1_title', descKey: 'bill1_desc', pointKeys: ['bill1_li1', 'bill1_li2'] },
  { icon: 'fa-diagram-project', titleKey: 'bill2_title', descKey: 'bill2_desc', pointKeys: ['bill2_li1', 'bill2_li2'] },
  { icon: 'fa-compass', titleKey: 'bill3_title', descKey: 'bill3_desc', pointKeys: ['bill3_li1', 'bill3_li2'] },
];

export interface Material {
  icon: string;
  titleKey: string;
  descKey: string;
}

/** "What you receive" list in the #about section. */
export const MATERIALS: Material[] = [
  { icon: 'fa-bolt', titleKey: 'mat1_title', descKey: 'mat1_desc' },
  { icon: 'fa-palette', titleKey: 'mat2_title', descKey: 'mat2_desc' },
  { icon: 'fa-mobile-screen', titleKey: 'mat3_title', descKey: 'mat3_desc' },
  { icon: 'fa-vault', titleKey: 'mat4_title', descKey: 'mat4_desc' },
];

export interface RoadmapStep {
  titleKey: string;
  descKey: string;
  outcomeKey: string;
}

export const ROADMAP_STEPS: RoadmapStep[] = [1, 2, 3, 4, 5].map((n) => ({
  titleKey: `step${n}_title`,
  descKey: `step${n}_desc`,
  outcomeKey: `step${n}_outcome`,
}));
