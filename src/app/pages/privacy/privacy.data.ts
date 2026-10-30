export interface PrivacySection {
  icon: string;
  titleKey: string;
  bodyKey: string;
  pointKeys?: string[];
  /** Shown as a tinted panel to set it apart from the plain sections. */
  highlighted?: boolean;
}

/** Sections of privacy.html, in order. Every value is an i18n key (privacy_*, all 4 languages). */
export const PRIVACY_SECTIONS: PrivacySection[] = [
  { icon: 'fa-shield-alt', titleKey: 'privacy_s1_title', bodyKey: 'privacy_s1_body' },
  { icon: 'fa-lock', titleKey: 'privacy_s2_title', bodyKey: 'privacy_s2_body' },
  {
    icon: 'fa-globe',
    titleKey: 'privacy_s3_title',
    bodyKey: 'privacy_s3_body',
    pointKeys: ['privacy_s3_li1', 'privacy_s3_li2', 'privacy_s3_li3'],
    highlighted: true,
  },
  { icon: 'fa-file-invoice-dollar', titleKey: 'privacy_s4_title', bodyKey: 'privacy_s4_body' },
];
