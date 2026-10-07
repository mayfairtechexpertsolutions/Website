import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-section-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'aria-hidden': 'true' },
  template: `
    <div class="mx-auto flex max-w-7xl items-center gap-4 px-6">
      <span class="divider-line h-px flex-1 bg-gradient-to-r from-transparent to-mayfair-teal/60"></span>
      <span class="divider-diamond size-2.5 rotate-45 border border-mayfair-teal"></span>
      <span class="divider-line h-px flex-1 bg-gradient-to-l from-transparent to-mayfair-teal/60"></span>
    </div>
  `,
})
export class SectionDividerComponent {}
