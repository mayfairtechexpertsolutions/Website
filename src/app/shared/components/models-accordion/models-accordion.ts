import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { EngagementModel } from '../../../core/models/engagement-model.model';

const PANEL_BASE =
  'relative overflow-hidden rounded-[2rem] border p-6 transition-[flex,background-color,border-color] duration-500 lg:h-[22rem]';
const PANEL_ACTIVE = 'border-mayfair-teal bg-mayfair-navy text-white lg:flex-1';
const PANEL_INACTIVE =
  'border-slate-200 bg-white text-mayfair-navy hover:border-mayfair-teal dark:border-slate-700 dark:bg-slate-900 dark:text-white lg:flex-[0_0_7rem]';

/** One panel open at a time: expands horizontally on desktop, vertically on mobile. */
@Component({
  selector: 'app-models-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './models-accordion.html',
})
export class ModelsAccordionComponent {
  readonly models = input.required<EngagementModel[]>();

  protected readonly activeIndex = signal(0);

  protected activate(index: number): void {
    this.activeIndex.set(index);
  }

  protected panelClass(index: number): string {
    return `${PANEL_BASE} ${index === this.activeIndex() ? PANEL_ACTIVE : PANEL_INACTIVE}`;
  }

  protected titleClass(index: number): string {
    const base = 'font-serif font-bold';
    return index === this.activeIndex()
      ? `${base} text-xl`
      : `${base} text-lg lg:[writing-mode:vertical-rl] lg:rotate-180 lg:whitespace-nowrap`;
  }
}
