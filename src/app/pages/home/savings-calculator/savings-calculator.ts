import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';

const MONTHLY_RATE_PER_USER = 50;
const MONTHS = 36;

@Component({
  selector: 'app-savings-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './savings-calculator.html',
})
export class SavingsCalculatorComponent {
  protected readonly i18n = inject(TranslationService);
  protected readonly staffCount = signal(20);

  protected readonly totalRentCost = computed(() => this.staffCount() * MONTHLY_RATE_PER_USER * MONTHS);

  protected readonly formattedTotal = computed(() => {
    const locale = this.i18n.currentLang() === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      this.totalRentCost(),
    );
  });

  protected onStaffCountChange(value: number): void {
    this.staffCount.set(Math.max(0, value || 0));
  }
}
