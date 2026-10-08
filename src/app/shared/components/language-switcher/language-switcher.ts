import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, signal } from '@angular/core';
import { Lang } from '../../../core/i18n/translations';
import { TranslationService } from '../../../core/i18n/translation.service';

interface LangOption {
  value: Lang;
  label: string;
  fullLabel: string;
}

const LANG_OPTIONS: LangOption[] = [
  { value: 'en', label: 'EN', fullLabel: 'English' },
  { value: 'zh', label: '繁體', fullLabel: '繁體中文' },
  { value: 'zh_cn', label: '简体', fullLabel: '简体中文' },
  { value: 'fr', label: 'FR', fullLabel: 'Français' },
];

@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'grid') {
      <div class="grid grid-cols-2 gap-4">
        @for (opt of options; track opt.value) {
          <button
            type="button"
            (click)="select(opt.value)"
            class="rounded-xl border p-4 text-sm font-bold transition-all"
            [class.bg-mayfair-teal]="i18n.currentLang() === opt.value"
            [class.text-mayfair-navy]="i18n.currentLang() === opt.value"
            [class.border-mayfair-teal]="i18n.currentLang() === opt.value"
            [class.border-slate-200]="i18n.currentLang() !== opt.value"
            [class.text-mayfair-navy]="i18n.currentLang() !== opt.value"
            [class.dark:border-slate-700]="i18n.currentLang() !== opt.value"
            [class.dark:text-slate-200]="i18n.currentLang() !== opt.value"
          >
            {{ opt.fullLabel }}
          </button>
        }
      </div>
    } @else {
      <div class="relative">
        <button
          type="button"
          (click)="toggle($event)"
          class="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold tracking-widest text-mayfair-navy uppercase transition hover:border-mayfair-teal dark:border-slate-700 dark:text-slate-200"
          aria-haspopup="listbox"
          [attr.aria-expanded]="open()"
        >
          <i class="fas fa-globe text-mayfair-teal"></i>
          {{ current().label }}
          <i class="fas fa-chevron-down text-[9px] transition-transform" [class.rotate-180]="open()"></i>
        </button>

        @if (open()) {
          <div
            role="listbox"
            class="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-mayfair-dark"
          >
            @for (opt of options; track opt.value) {
              <button
                type="button"
                role="option"
                (click)="select(opt.value)"
                class="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-white/5"
                [class.text-mayfair-teal]="i18n.currentLang() === opt.value"
                [class.text-mayfair-navy]="i18n.currentLang() !== opt.value"
                [class.dark:text-slate-200]="i18n.currentLang() !== opt.value"
              >
                {{ opt.fullLabel }}
                @if (i18n.currentLang() === opt.value) {
                  <i class="fas fa-check text-xs"></i>
                }
              </button>
            }
          </div>
        }
      </div>
    }
  `,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(TranslationService);
  protected readonly options = LANG_OPTIONS;
  readonly variant = input<'inline' | 'grid'>('inline');

  protected readonly open = signal(false);
  protected readonly current = computed(
    () => this.options.find((o) => o.value === this.i18n.currentLang()) ?? this.options[0],
  );

  private readonly host = inject(ElementRef<HTMLElement>);

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  protected select(lang: Lang): void {
    this.i18n.setLang(lang);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }
}
