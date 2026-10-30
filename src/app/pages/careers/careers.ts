import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { JOBS, JOBS_EMAIL } from './careers.data';

@Component({
  selector: 'app-careers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective, PageHeroComponent, TranslatePipe],
  templateUrl: './careers.html',
})
export class CareersComponent {
  private readonly i18n = inject(TranslationService);
  protected readonly jobs = JOBS;
  protected readonly jobsEmail = JOBS_EMAIL;
  protected readonly CARD_STAGGER_MS = 100;

  constructor() {
    inject(SeoService).set({
      title: 'Careers | MayfairTech Expert Solutions',
      description:
        'Join the MayfairTech global engineering network: remote roles in Java / Spring Boot, Angular, native mobile and UI/UX, governed from Mauritius.',
      url: 'https://mayfairtechexpertsolutions.com/careers.html',
    });
  }

  /** Pre-addressed application email with the role in the subject line. */
  protected applyHref(titleKey: string): string {
    const subject = `${this.i18n.translate('careers_apply_subject')} ${this.i18n.translate(titleKey)}`;
    return `mailto:${this.jobsEmail}?subject=${encodeURIComponent(subject)}`;
  }
}
