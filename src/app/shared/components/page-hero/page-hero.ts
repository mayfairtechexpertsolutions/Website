import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealDirective } from '../../directives/reveal.directive';

/**
 * Navy header for every page except home (which has its own starfield hero). Inputs are already-translated strings,
 * so pages can pass `'key' | translate` or plain text; the title is rendered as HTML. Extra content (CTAs, stats)
 * is projected below the subtitle. `fill` makes it fill the first screen under the navbar on desktop, content
 * centred, for a hero with enough content (CTAs, stats) to stand on its own; section paging then starts on a whole
 * screen.
 */
@Component({
  selector: 'app-page-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective],
  host: { class: 'block' },
  template: `
    <header
      class="relative overflow-hidden bg-mayfair-navy px-6 pt-28 pb-20 md:pt-36 md:pb-28"
      [class]="fill() ? 'lg:flex lg:min-h-[calc(100svh-81px)] lg:flex-col lg:justify-center lg:py-12' : ''"
    >
      <div class="hero-dots absolute inset-0 opacity-10" aria-hidden="true"></div>
      <div class="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-mayfair-teal/10 to-transparent" aria-hidden="true"></div>

      <div class="relative z-10 mx-auto w-full text-center" [class]="size() === 'lg' ? 'max-w-4xl' : 'max-w-3xl'" appReveal>
        <span
          class="mb-8 inline-block lg:mb-6 rounded-full border border-mayfair-teal/30 bg-mayfair-teal/5 px-4 py-1.5 text-xs font-bold tracking-[0.3em] text-mayfair-teal uppercase"
        >
          {{ badge() }}
        </span>
        <h1
          class="mb-6 font-serif text-4xl leading-[1.1] font-bold text-white"
          [class]="size() === 'lg' ? 'md:text-6xl' : 'md:text-5xl'"
          [innerHTML]="title()"
        ></h1>
        @if (subtitle()) {
          <p class="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">{{ subtitle() }}</p>
        }
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeroComponent {
  readonly badge = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  /** lg for product pages, md for legal/text pages. */
  readonly size = input<'lg' | 'md'>('lg');
  readonly fill = input(false);
}
