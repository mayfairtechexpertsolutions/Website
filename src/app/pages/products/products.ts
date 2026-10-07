import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { ProductsGridComponent } from '../../shared/components/products-grid/products-grid';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, ProductsGridComponent, TranslatePipe],
  templateUrl: './products.html',
})
export class ProductsComponent {
  constructor() {
    inject(SeoService).set({
      title: 'Products | MayfairTech Expert Solutions',
      description:
        "Explore the full MayfairTech product suite — standalone SaaS software built by the same engineers who architect our clients' technology backbones.",
      url: 'https://mayfairtechexpertsolutions.com/products.html',
    });
  }
}
