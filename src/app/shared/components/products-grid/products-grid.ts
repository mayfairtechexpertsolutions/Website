import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { PRODUCTS } from '../../../core/products/products.data';
import { Product } from '../../../core/products/product.model';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-products-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent, TranslatePipe],
  template: `
    <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      @for (product of products(); track product.slug) {
        <app-product-card [product]="product" />
      }
      @if (fillPlaceholders()) {
        @for (i of placeholderRange(); track i) {
          <div class="h-full">
            <div
              class="flex h-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700"
            >
              <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-slate-500">
                <i class="fas fa-hourglass-half text-xl"></i>
              </div>
              <h3 class="mb-2 font-serif text-xl font-bold text-slate-400 dark:text-slate-400">
                {{ 'products_comingsoon_title' | translate }}
              </h3>
              <p class="text-sm leading-relaxed text-slate-400 dark:text-slate-500">
                {{ 'products_comingsoon_tagline' | translate }}
              </p>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ProductsGridComponent {
  readonly products = input<Product[]>(PRODUCTS);
  readonly minSlots = input(3);
  readonly fillPlaceholders = input(false);

  protected placeholderRange(): number[] {
    const remaining = this.minSlots() - this.products().length;
    return remaining > 0 ? Array.from({ length: remaining }, (_, i) => i) : [];
  }
}
