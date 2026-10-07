import { TestBed } from '@angular/core/testing';
import { SCROLLED_THRESHOLD_PX, ScrollStateService } from './scroll-state.service';

describe('ScrollStateService', () => {
  const setScrollY = (value: number) => Object.defineProperty(window, 'scrollY', { value, configurable: true });

  afterEach(() => setScrollY(0));

  it('is not scrolled at the top of the page', () => {
    setScrollY(0);
    expect(TestBed.inject(ScrollStateService).scrolled()).toBe(false);
  });

  it('flips to scrolled once past the threshold and back on return to top', () => {
    setScrollY(0);
    const service = TestBed.inject(ScrollStateService);

    setScrollY(SCROLLED_THRESHOLD_PX + 1);
    window.dispatchEvent(new Event('scroll'));
    expect(service.scrolled()).toBe(true);

    setScrollY(0);
    window.dispatchEvent(new Event('scroll'));
    expect(service.scrolled()).toBe(false);
  });
});
