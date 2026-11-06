import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'en' | 'am';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly translate = inject(TranslateService);
  private readonly STORAGE_KEY = 'etrental_lang';

  // Reactive state for the current active language
  readonly currentLang = signal<SupportedLanguage>('en');
  readonly isAmharic = computed(() => this.currentLang() === 'am');
  readonly languageLabel = computed(() => (this.currentLang() === 'am' ? 'አማርኛ' : 'English'));

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    // 1. Configure ngx-translate fallback language
    this.translate.setFallbackLang('en');

    // 2. Read stored preference or detect browser
    const stored = (typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.STORAGE_KEY)
      : null) as SupportedLanguage | null;

    const initialLang: SupportedLanguage = stored === 'am' || stored === 'en' ? stored : 'en';

    this.setLanguage(initialLang);
  }

  setLanguage(lang: SupportedLanguage): void {
    this.currentLang.set(lang);
    this.translate.use(lang);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, lang);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      if (lang === 'am') {
        document.documentElement.classList.add('lang-amharic');
      } else {
        document.documentElement.classList.remove('lang-amharic');
      }
    }
  }

  toggleLanguage(): void {
    const next: SupportedLanguage = this.currentLang() === 'en' ? 'am' : 'en';
    this.setLanguage(next);
  }

  instant(key: string, params?: object): string {
    return this.translate.instant(key, params);
  }
}
