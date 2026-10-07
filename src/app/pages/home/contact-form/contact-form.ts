import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

const WHATSAPP_NUMBER = '23059046191';

const ENGAGEMENT_MODEL_LABELS: Record<string, string> = {
  dedicated: 'Dedicated Team (Full-Time Focus)',
  shared: 'Shared Team (Value Optimized)',
  fixed: 'Fixed-Scope (One-Time Delivery)',
  unsure: "I'm Not Sure Yet",
  career: 'Career Opportunity (Applicant)',
};

@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './contact-form.html',
})
export class ContactFormComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly submitState = signal<'idle' | 'success' | 'error'>('idle');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    model: ['dedicated'],
    message: ['', Validators.required],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;
    const { name, email, model, message } = this.form.getRawValue();
    const text = [
      'New Website Inquiry',
      '',
      `Full Name: ${name}`,
      `Work Email: ${email}`,
      `Engagement Model: ${ENGAGEMENT_MODEL_LABELS[model] ?? model}`,
      `Project Brief: ${message}`,
    ].join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    try {
      window.open(url, '_blank', 'noopener');
      this.submitState.set('success');
    } catch {
      this.submitState.set('error');
    }
  }
}
