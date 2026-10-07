import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  url: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
}

const DEFAULT_IMAGE = 'https://mayfairtechexpertsolutions.com/media/social-preview.png';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  set(config: SeoConfig): void {
    const image = config.image ?? DEFAULT_IMAGE;

    this.titleService.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: config.url });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ property: 'twitter:title', content: config.title });
    this.meta.updateTag({ property: 'twitter:description', content: config.description });
    this.meta.updateTag({ property: 'twitter:image', content: image });

    this.removeJsonLd();
    if (config.jsonLd) {
      const script = this.document.createElement('script');
      script.id = 'seo-json-ld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(config.jsonLd);
      this.document.head.appendChild(script);
    }
  }

  private removeJsonLd(): void {
    this.document.getElementById('seo-json-ld')?.remove();
  }
}
