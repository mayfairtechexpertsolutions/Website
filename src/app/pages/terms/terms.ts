import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero';
import { SeoService } from '../../core/seo/seo.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { TERMS_SECTIONS } from './terms.data';

@Component({
  selector: 'app-terms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective, PageHeroComponent, TranslatePipe],
  templateUrl: './terms.html',
})
export class TermsComponent {
  private readonly i18n = inject(TranslationService);
  protected readonly sections = TERMS_SECTIONS;
  /** "English version prevails" notice; empty (hidden) in English. */
  protected readonly translationNote = computed(() =>
    this.i18n.currentLang() === 'en' ? '' : this.i18n.translate('legal_translation_note'),
  );

  constructor() {
    inject(SeoService).set({
      title: 'Terms of Engagement | MayfairTech Expert Solutions',
      description:
        'Terms governing MayfairTech Expert Solutions engagements — IP ownership, billing, confidentiality, and delivery commitments.',
      url: 'https://mayfairtechexpertsolutions.com/terms.html',
    });
  }
}
