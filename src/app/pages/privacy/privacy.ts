import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero';
import { SeoService } from '../../core/seo/seo.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { PRIVACY_SECTIONS } from './privacy.data';

@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective, PageHeroComponent, TranslatePipe],
  templateUrl: './privacy.html',
})
export class PrivacyComponent {
  private readonly i18n = inject(TranslationService);
  protected readonly sections = PRIVACY_SECTIONS;
  /** "English version prevails" notice; empty (hidden) in English. */
  protected readonly translationNote = computed(() =>
    this.i18n.currentLang() === 'en' ? '' : this.i18n.translate('legal_translation_note'),
  );

  constructor() {
    inject(SeoService).set({
      title: 'Privacy & Confidentiality | MayfairTech Expert Solutions',
      description:
        'How MayfairTech Expert Solutions handles client confidentiality, data protection, and IP ownership across all engagement models.',
      url: 'https://mayfairtechexpertsolutions.com/privacy.html',
    });
  }
}
