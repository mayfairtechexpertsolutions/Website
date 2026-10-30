import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { WHATSAPP_URL } from '../../../core/contact/contact.data';

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

  /** A field shows its error once the visitor has left it or tried to submit. */
  protected showError(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.invalid && c.touched;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, model, message } = this.form.getRawValue();
    const text = [
      'New Website Inquiry',
      '',
      `Full Name: ${name}`,
      `Work Email: ${email}`,
      `Engagement Model: ${ENGAGEMENT_MODEL_LABELS[model] ?? model}`,
      `Project Brief: ${message}`,
    ].join('\n');
    const url = `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
    try {
      window.open(url, '_blank', 'noopener');
      this.submitState.set('success');
    } catch {
      this.submitState.set('error');
    }
  }
}
