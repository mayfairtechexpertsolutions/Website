import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Stat } from '../../../core/stats/stat.model';
import { CountUpDirective } from '../../directives/count-up.directive';
import { RevealDirective } from '../../directives/reveal.directive';

const TICKET_STAGGER_MS = 150;

/** Tilted, alternating-colour ticket cards; each straightens on hover. */
const TICKET_STYLES = [
  'bg-mayfair-teal text-mayfair-navy -rotate-2',
  'bg-mayfair-navy text-white rotate-1',
  'bg-mayfair-dark text-white -rotate-1',
  'border border-slate-200 bg-white text-mayfair-navy rotate-2 dark:border-white/10 dark:bg-slate-800 dark:text-white',
];

@Component({
  selector: 'app-stats-tickets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, CountUpDirective, RevealDirective],
  templateUrl: './stats-tickets.html',
})
export class StatsTicketsComponent {
  readonly stats = input.required<Stat[]>();

  protected readonly staggerMs = TICKET_STAGGER_MS;

  protected ticketStyle(index: number): string {
    return TICKET_STYLES[index % TICKET_STYLES.length];
  }
}
