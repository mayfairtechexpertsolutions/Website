import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-terms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective],
  templateUrl: './terms.html',
})
export class TermsComponent {
  constructor() {
    inject(SeoService).set({
      title: 'Terms of Engagement | MayfairTech Expert Solutions',
      description:
        'Terms governing MayfairTech Expert Solutions engagements — IP ownership, billing, confidentiality, and delivery commitments.',
      url: 'https://mayfairtechexpertsolutions.com/terms.html',
    });
  }
}
