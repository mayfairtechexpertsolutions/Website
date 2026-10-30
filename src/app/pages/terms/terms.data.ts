/** Paragraph count of each clause in terms.html; keys are terms_s<N>_title and terms_s<N>_p1..pK (all 4 languages). */
const PARAGRAPHS_PER_SECTION = [4, 2, 3, 2, 2, 3, 2, 1, 4, 2, 3, 3, 1, 4, 1];

export interface TermsSection {
  titleKey: string;
  paragraphKeys: string[];
}

export const TERMS_SECTIONS: TermsSection[] = PARAGRAPHS_PER_SECTION.map((count, i) => ({
  titleKey: `terms_s${i + 1}_title`,
  paragraphKeys: Array.from({ length: count }, (_, p) => `terms_s${i + 1}_p${p + 1}`),
}));
