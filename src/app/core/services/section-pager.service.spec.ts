import { TestBed } from '@angular/core/testing';
import { SCROLLED_NAVBAR_PX as NAV, SectionPagerService } from './section-pager.service';

describe('SectionPagerService', () => {
  /** Stubs the two media queries the service reads: desktop width and reduced motion (jumps, so no rAF). */
  const stubMedia = ({ desktop = true } = {}) =>
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduced-motion') ? true : desktop,
      addEventListener() {},
      removeEventListener() {},
    }));
  const setScrollY = (value: number) => Object.defineProperty(window, 'scrollY', { value, configurable: true });

  let page: HTMLElement;
  let scrollTo: ReturnType<typeof vi.fn>;

  /**
   * Builds `<router-outlet>` + a routed page whose sections start at the given document offsets; each runs to the
   * next one (the last is 700px). `padding` gives a section vertical padding, by index.
   */
  const buildPage = (sectionTops: number[], padding: Record<number, number> = {}) => {
    page = document.createElement('div');
    page.innerHTML = `<router-outlet></router-outlet><div>${sectionTops.map(() => '<section></section>').join('')}</div>`;
    document.body.append(page);
    page.querySelectorAll('section').forEach((section, i) => {
      const height = (sectionTops[i + 1] ?? sectionTops[i] + 700) - sectionTops[i];
      Object.defineProperties(section, { offsetTop: { value: sectionTops[i] }, offsetHeight: { value: height } });
      if (padding[i]) section.style.padding = `${padding[i]}px 0`;
    });
  };

  /** Wheel events carry a fake clock, so gesture timing doesn't depend on how fast the test runs. */
  let clock = 1000;
  const wheel = (deltaY: number, target: EventTarget = window) => {
    const event = new WheelEvent('wheel', { deltaY, cancelable: true, bubbles: true });
    Object.defineProperty(event, 'timeStamp', { value: clock });
    target.dispatchEvent(event);
    return event;
  };
  /** Moves the clock past the wheel-idle gap, so the next wheel event starts a new gesture. */
  const nextGesture = async () => {
    clock += 250;
  };

  beforeEach(() => {
    stubMedia();
    scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('innerHeight', 900);
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 10000, configurable: true });
    setScrollY(0);
  });
  afterEach(() => {
    page?.remove();
    vi.unstubAllGlobals();
    setScrollY(0);
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 0, configurable: true });
  });

  it('moves to the next section on scroll down and the previous on scroll up, one per gesture', async () => {
    buildPage([0, 700, 1400]);
    TestBed.inject(SectionPagerService);

    expect(wheel(100).defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 700 - NAV, behavior: 'instant' });
    wheel(100); // inertia from the same gesture
    expect(scrollTo).toHaveBeenCalledTimes(1);

    setScrollY(700 - NAV);
    await nextGesture();
    wheel(-100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
  });

  it("stops at a tall section's top, then where its end fills the screen, then the next section", async () => {
    buildPage([0, 1500, 2200]); // the first section is 1500px tall: its end fills the screen at 1500 - 900
    TestBed.inject(SectionPagerService);

    wheel(100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 600, behavior: 'instant' });

    setScrollY(600);
    await nextGesture();
    wheel(100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1500 - NAV, behavior: 'instant' });

    setScrollY(1500 - NAV);
    await nextGesture();
    wheel(-100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 600, behavior: 'instant' });
  });

  it('glides one screen at a time through a section more than two screens tall', async () => {
    buildPage([0, 3000]);
    TestBed.inject(SectionPagerService);

    expect(wheel(100).defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: (900 - NAV) * 0.85, behavior: 'instant' });

    setScrollY(1900);
    await nextGesture();
    wheel(100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 3000 - 900, behavior: 'instant' });
  });

  it('gives a section whose content fits one stop, with the content centred and its neighbours out of view', () => {
    // The middle section is 1000px with 150px padding: 700px of content fits the 845px under the navbar.
    buildPage([0, 700, 1700], { 1: 150 });
    setScrollY(700 - NAV);
    TestBed.inject(SectionPagerService);

    wheel(100);
    // Content 850..1550, centred: 1200 - NAV - 845 / 2.
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1200 - NAV - (900 - NAV) / 2, behavior: 'instant' });
  });

  it('always stops at the very top of the page', async () => {
    buildPage([300, 1000]);
    setScrollY(1000 - NAV);
    TestBed.inject(SectionPagerService);

    wheel(-100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 300 - NAV, behavior: 'instant' });

    setScrollY(300 - NAV);
    await nextGesture();
    wheel(-100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
  });

  it('leaves the wheel alone past the last stop', () => {
    buildPage([0, 700]);
    setScrollY(700 - NAV);
    TestBed.inject(SectionPagerService);
    expect(wheel(100).defaultPrevented).toBe(false);
  });

  it('includes stops added by components', () => {
    buildPage([0, 700]);
    const pager = TestBed.inject(SectionPagerService);
    const remove = pager.addStops(() => [300]);

    wheel(100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 300, behavior: 'instant' });
    remove();
  });

  it('lets an inner scrollable element scroll on its own', () => {
    buildPage([0, 700]);
    TestBed.inject(SectionPagerService);
    const box = document.createElement('div');
    box.style.overflowY = 'auto';
    Object.defineProperties(box, { scrollHeight: { value: 500 }, clientHeight: { value: 100 } });
    page.append(box);

    expect(wheel(100, box).defaultPrevented).toBe(false);
  });

  it('does nothing below lg', () => {
    stubMedia({ desktop: false });
    buildPage([0, 700]);
    TestBed.inject(SectionPagerService);
    expect(wheel(100).defaultPrevented).toBe(false);
  });
});
