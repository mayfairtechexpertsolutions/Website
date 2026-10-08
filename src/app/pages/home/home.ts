import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ProductsGridComponent } from '../../shared/components/products-grid/products-grid';
import { GlobeComponent } from '../../shared/components/globe/globe';
import { StarfieldComponent } from '../../shared/components/starfield/starfield';
import { SectionDividerComponent } from '../../shared/components/section-divider/section-divider';
import { PointerParallaxDirective } from '../../shared/directives/pointer-parallax.directive';
import { ENGAGEMENT_MODELS } from '../../core/models/engagement-models.data';
import { ModelsAccordionComponent } from '../../shared/components/models-accordion/models-accordion';
import { STATS } from '../../core/stats/stats.data';
import { StatsTicketsComponent } from '../../shared/components/stats-tickets/stats-tickets';
import { MobileCtaBarComponent } from '../../shared/components/mobile-cta-bar/mobile-cta-bar';
import { SavingsCalculatorComponent } from './savings-calculator/savings-calculator';
import { ContactFormComponent } from './contact-form/contact-form';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RevealDirective,
    TranslatePipe,
    ProductsGridComponent,
    GlobeComponent,
    StarfieldComponent,
    MobileCtaBarComponent,
    SavingsCalculatorComponent,
    SectionDividerComponent,
    StatsTicketsComponent,
    ModelsAccordionComponent,
    PointerParallaxDirective,
    ContactFormComponent,
  ],
  templateUrl: './home.html',
})
export class HomeComponent {
  protected readonly CARD_STAGGER_MS = 150;
  protected readonly stats = STATS;
  protected readonly engagementModels = ENGAGEMENT_MODELS;

  constructor() {
    inject(SeoService).set({
      title: 'MayfairTech Expert Solutions | Stop Renting. Build Your Technology Backbone.',
      description:
        'A strategic technology partner offering elite global engineering talent through a transparent, Mauritius-governed model. We build permanent digital assets.',
      url: 'https://mayfairtechexpertsolutions.com/',
    });
  }
}
