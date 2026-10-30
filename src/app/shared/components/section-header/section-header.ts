import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

/**
 * Badge + heading + optional subtitle that opens a content section. All inputs are i18n keys; the title is rendered
 * as HTML so keys with highlight <span>s work. Use tone="dark" on navy/gradient surfaces.
 */
@Component({
  selector: 'app-section-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  host: { class: 'block' },
  template: `
    <div [class]="align() === 'center' ? 'mx-auto mb-16 max-w-2xl text-center' : 'mb-6'">
      <span class="rounded-full bg-mayfair-teal/10 px-3 py-1 text-sm font-bold tracking-widest text-mayfair-teal uppercase">
        {{ badgeKey() | translate }}
      </span>
      <h2
        class="mt-6 font-serif text-3xl font-bold md:text-4xl"
        [class]="titleClass()"
        [class.mb-4]="subtitleKey()"
        [innerHTML]="titleKey() | translate"
      ></h2>
      @if (subtitleKey(); as key) {
        <p class="text-lg leading-relaxed" [class]="subtitleClass()">{{ key | translate }}</p>
      }
    </div>
  `,
})
export class SectionHeaderComponent {
  readonly badgeKey = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly subtitleKey = input<string>();
  readonly align = input<'center' | 'left'>('center');
  readonly tone = input<'light' | 'dark'>('light');

  protected readonly titleClass = computed(() => (this.tone() === 'dark' ? 'text-white' : 'text-mayfair-navy dark:text-white'));
  protected readonly subtitleClass = computed(() =>
    this.tone() === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300',
  );
}
