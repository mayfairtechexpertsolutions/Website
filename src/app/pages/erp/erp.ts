import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';

const WHATSAPP_NUMBER = '23059046191';

type FeatureKey = { title: string; desc: string; icon: string };

const PREVIEW_SHOTS: { title: string; img: string }[] = [
  { title: 'erp_preview1_title', img: 'media/erp/erp-screenshot-pos.png' },
  { title: 'erp_preview2_title', img: 'media/erp/erp-screenshot-dashboard.png' },
  { title: 'erp_preview3_title', img: 'media/erp/erp-screenshot-inventory.png' },
];

const PAIN_POINTS: FeatureKey[] = [
  { icon: 'fa-boxes-packing', title: 'erp_pain1_title', desc: 'erp_pain1_desc' },
  { icon: 'fa-file-invoice', title: 'erp_pain2_title', desc: 'erp_pain2_desc' },
  { icon: 'fa-calculator', title: 'erp_pain3_title', desc: 'erp_pain3_desc' },
  { icon: 'fa-truck', title: 'erp_pain4_title', desc: 'erp_pain4_desc' },
  { icon: 'fa-user-lock', title: 'erp_pain5_title', desc: 'erp_pain5_desc' },
  { icon: 'fa-receipt', title: 'erp_pain6_title', desc: 'erp_pain6_desc' },
];

const FEATURES: FeatureKey[] = [
  { icon: 'fa-cash-register', title: 'erp_feat1_title', desc: 'erp_feat1_desc' },
  { icon: 'fa-barcode', title: 'erp_feat2_title', desc: 'erp_feat2_desc' },
  { icon: 'fa-file-signature', title: 'erp_feat3_title', desc: 'erp_feat3_desc' },
  { icon: 'fa-chart-line', title: 'erp_feat4_title', desc: 'erp_feat4_desc' },
  { icon: 'fa-users', title: 'erp_feat5_title', desc: 'erp_feat5_desc' },
  { icon: 'fa-store', title: 'erp_feat6_title', desc: 'erp_feat6_desc' },
  { icon: 'fa-motorcycle', title: 'erp_feat7_title', desc: 'erp_feat7_desc' },
  { icon: 'fa-chart-pie', title: 'erp_feat8_title', desc: 'erp_feat8_desc' },
  { icon: 'fa-puzzle-piece', title: 'erp_feat9_title', desc: 'erp_feat9_desc' },
];

const PERSONAS: FeatureKey[] = [
  { icon: 'fa-user-tie', title: 'erp_persona1_title', desc: 'erp_persona1_desc' },
  { icon: 'fa-cash-register', title: 'erp_persona2_title', desc: 'erp_persona2_desc' },
  { icon: 'fa-user-gear', title: 'erp_persona3_title', desc: 'erp_persona3_desc' },
  { icon: 'fa-clipboard-list', title: 'erp_persona4_title', desc: 'erp_persona4_desc' },
  { icon: 'fa-truck-field', title: 'erp_persona5_title', desc: 'erp_persona5_desc' },
  { icon: 'fa-motorcycle', title: 'erp_persona6_title', desc: 'erp_persona6_desc' },
];

const TRUST: FeatureKey[] = [
  { icon: 'fa-database', title: 'erp_trust1_title', desc: 'erp_trust1_desc' },
  { icon: 'fa-user-shield', title: 'erp_trust2_title', desc: 'erp_trust2_desc' },
  { icon: 'fa-clock-rotate-left', title: 'erp_trust3_title', desc: 'erp_trust3_desc' },
  { icon: 'fa-lock', title: 'erp_trust4_title', desc: 'erp_trust4_desc' },
];

type FaqEntry = { q: string; a: string };

const FAQ: FaqEntry[] = [
  { q: 'erp_faq1_q', a: 'erp_faq1_a' },
  { q: 'erp_faq2_q', a: 'erp_faq2_a' },
  { q: 'erp_faq3_q', a: 'erp_faq3_a' },
  { q: 'erp_faq4_q', a: 'erp_faq4_a' },
  { q: 'erp_faq5_q', a: 'erp_faq5_a' },
  { q: 'erp_faq6_q', a: 'erp_faq6_a' },
];

@Component({
  selector: 'app-erp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, RevealDirective, TranslatePipe],
  templateUrl: './erp.html',
})
export class ErpComponent {
  protected readonly i18n = inject(TranslationService);
  private readonly fb = inject(FormBuilder);

  protected readonly previewShots = PREVIEW_SHOTS;
  protected readonly painPoints = PAIN_POINTS;
  protected readonly features = FEATURES;
  protected readonly personas = PERSONAS;
  protected readonly trust = TRUST;
  protected readonly faq = FAQ;

  protected readonly openFaqIndex = signal<number | null>(null);

  protected toggleFaq(index: number): void {
    this.openFaqIndex.set(this.openFaqIndex() === index ? null : index);
  }

  protected readonly submitState = signal<'idle' | 'success' | 'error'>('idle');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: ['', Validators.required],
    staff_count: [''],
    message: ['', Validators.required],
  });

  constructor() {
    inject(SeoService).set({
      title: 'MayfairTech ERP | One Platform For Your Whole Business',
      description:
        "MayfairTech ERP unifies point of sale, inventory, finance, HR, and e-commerce into one system for small and medium retail businesses. Start a 14-day free trial.",
      url: 'https://mayfairtechexpertsolutions.com/erp.html',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'MayfairTech ERP',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://mayfairtechexpertsolutions.com/erp.html',
        offers: { '@type': 'AggregateOffer', lowPrice: '59', highPrice: '349', priceCurrency: 'USD' },
        publisher: { '@type': 'Organization', name: 'MayfairTech Expert Solutions', url: 'https://mayfairtechexpertsolutions.com/' },
      },
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    const { name, email, company, staff_count, message } = this.form.getRawValue();
    const text = [
      'New MayfairTech ERP Trial Request',
      '',
      `Full Name: ${name}`,
      `Work Email: ${email}`,
      `Company Name: ${company}`,
      `Number of Staff: ${staff_count || '—'}`,
      `What they're hoping to solve: ${message}`,
    ].join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    try {
      window.open(url, '_blank', 'noopener');
      this.submitState.set('success');
    } catch {
      this.submitState.set('error');
    }
  }
}
