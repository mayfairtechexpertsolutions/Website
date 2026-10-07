import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Lang, translations } from './translations';

const STORAGE_KEY = 'mayfair_lang';
const DEFAULT_LANG: Lang = 'en';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly currentLang = signal<Lang>(this.readInitialLang());
  readonly dict = computed(() => translations[this.currentLang()] ?? translations[DEFAULT_LANG]);

  private readInitialLang(): Lang {
    if (!this.isBrowser) return DEFAULT_LANG;
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved && saved in translations ? saved : DEFAULT_LANG;
  }

  setLang(lang: Lang): void {
    this.currentLang.set(lang);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }

  translate(key: string): string {
    return this.dict()[key] ?? key;
  }
}
