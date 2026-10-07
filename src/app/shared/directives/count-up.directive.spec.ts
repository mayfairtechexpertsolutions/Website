import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CountUpDirective } from './count-up.directive';

@Component({ imports: [CountUpDirective], template: `<span [appCountUp]="40">40</span>` })
class HostComponent {}

describe('CountUpDirective', () => {
  let revealTarget: () => void;

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly callback: (entries: { isIntersecting: boolean }[]) => void) {
          revealTarget = () => this.callback([{ isIntersecting: true }]);
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const stubReducedMotion = (matches: boolean) => vi.stubGlobal('matchMedia', () => ({ matches }));
  it('starts at 0 and counts up to the target once visible', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    stubReducedMotion(false);
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.firstElementChild;
    expect(el.textContent).toBe('0');

    revealTarget();
    vi.advanceTimersByTime(1600);

    expect(el.textContent).toBe('40');
  });

  it('keeps the final value for reduced-motion visitors', () => {
    stubReducedMotion(true);
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.firstElementChild.textContent).toBe('40');
  });
});
