import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';
import { Product } from '../../../core/products/product.model';

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="group h-full">
      <div
        class="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-500 group-hover:-translate-y-2 group-hover:border-mayfair-teal group-hover:bg-mayfair-navy group-hover:shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        @if (product().isNew) {
          <span
            class="absolute top-6 right-6 rounded-full bg-mayfair-teal/10 px-3 py-1 text-[10px] font-bold tracking-widest text-mayfair-teal uppercase"
            >{{ 'products_new_badge' | translate }}</span
          >
        }
        <div
          class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-mayfair-teal transition-all duration-500 group-hover:rotate-3 group-hover:bg-mayfair-teal group-hover:text-mayfair-navy dark:bg-white/5"
        >
          <i class="fas text-xl" [class]="product().icon"></i>
        </div>
        <h3 class="mb-2 font-serif text-xl font-bold text-mayfair-navy transition-colors group-hover:text-white dark:text-white">
          {{ product().nameKey | translate }}
        </h3>
        <p class="mb-6 text-sm leading-relaxed text-slate-500 transition-colors group-hover:text-slate-300 dark:text-slate-400">
          {{ product().taglineKey | translate }}
        </p>
        <ul class="mb-8 flex-1 space-y-2 text-sm text-slate-600 transition-colors group-hover:text-slate-300 dark:text-slate-300">
          @for (key of product().highlightKeys; track key) {
            <li class="flex items-center gap-2">
              <i class="fas fa-check text-mayfair-teal"></i>
              <span>{{ key | translate }}</span>
            </li>
          }
        </ul>
        <a
          [routerLink]="product().href"
          class="mt-auto inline-block rounded-xl bg-slate-100 py-3 text-center font-bold text-mayfair-navy transition-all group-hover:bg-mayfair-teal group-hover:text-mayfair-navy dark:bg-white/10 dark:text-white"
        >
          {{ ctaLabel() }}
        </a>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  private readonly i18n = inject(TranslationService);
  readonly product = input.required<Product>();

  protected ctaLabel(): string {
    const template = this.i18n.translate('products_cta_template') || 'Explore {product} →';
    return template.replace('{product}', this.i18n.translate(this.product().nameKey));
  }
}
