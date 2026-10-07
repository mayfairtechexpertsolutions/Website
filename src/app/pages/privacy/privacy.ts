import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective],
  templateUrl: './privacy.html',
})
export class PrivacyComponent {
  constructor() {
    inject(SeoService).set({
      title: 'Privacy & Confidentiality | MayfairTech Expert Solutions',
      description:
        'How MayfairTech Expert Solutions handles client confidentiality, data protection, and IP ownership across all engagement models.',
      url: 'https://mayfairtechexpertsolutions.com/privacy.html',
    });
  }
}
