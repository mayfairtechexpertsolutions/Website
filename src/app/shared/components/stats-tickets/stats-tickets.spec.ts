import { TestBed } from '@angular/core/testing';
import { Stat } from '../../../core/stats/stat.model';
import { StatsTicketsComponent } from './stats-tickets';

const SAMPLE_STATS: Stat[] = [
  { value: 100, suffix: '%', labelKey: 'stats_ip_label' },
  { value: 3, suffix: '', labelKey: 'stats_models_label' },
];

describe('StatsTicketsComponent', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders one ticket per stat with its value and suffix', () => {
    const fixture = TestBed.createComponent(StatsTicketsComponent);
    fixture.componentRef.setInput('stats', SAMPLE_STATS);
    fixture.detectChanges();

    const tickets: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.ticket'));
    expect(tickets.length).toBe(2);
    expect(tickets[0].textContent).toContain('100%');
    expect(tickets[1].textContent).toContain('3');
  });
});
