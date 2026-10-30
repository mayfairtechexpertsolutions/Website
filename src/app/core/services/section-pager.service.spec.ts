import { TestBed } from '@angular/core/testing';
import { NAVBAR_OFFSET, SectionPagerService } from './section-pager.service';

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

  /** Builds `<router-outlet>` + a routed page whose sections start at the given document offsets. */
  const buildPage = (sectionTops: number[]) => {
    page = document.createElement('div');
    page.innerHTML = `<router-outlet></router-outlet><div>${sectionTops.map(() => '<section></section>').join('')}</div>`;
    document.body.append(page);
    page.querySelectorAll('section').forEach((section, i) => {
      const height = (sectionTops[i + 1] ?? sectionTops[i] + 700) - sectionTops[i];
      Object.defineProperties(section, { offsetTop: { value: sectionTops[i] }, offsetHeight: { value: height } });
    });
  };

  const wheel = (deltaY: number, target: EventTarget = window) => {
    const event = new WheelEvent('wheel', { deltaY, cancelable: true, bubbles: true });
    target.dispatchEvent(event);
    return event;
  };
  const nextGesture = () => new Promise((resolve) => setTimeout(resolve, 250));

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
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 700 - NAVBAR_OFFSET, behavior: 'instant' });
    wheel(100); // inertia from the same gesture
    expect(scrollTo).toHaveBeenCalledTimes(1);

    setScrollY(700 - NAVBAR_OFFSET);
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
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1500 - NAVBAR_OFFSET, behavior: 'instant' });

    setScrollY(1500 - NAVBAR_OFFSET);
    await nextGesture();
    wheel(-100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 600, behavior: 'instant' });
  });

  it('glides one screen at a time through a section more than two screens tall', async () => {
    buildPage([0, 3000]);
    TestBed.inject(SectionPagerService);

    expect(wheel(100).defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: (900 - NAVBAR_OFFSET) * 0.85, behavior: 'instant' });

    setScrollY(1900);
    await nextGesture();
    wheel(100);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 3000 - 900, behavior: 'instant' });
  });

  it('leaves the wheel alone past the last stop', () => {
    buildPage([0, 700]);
    setScrollY(700 - NAVBAR_OFFSET);
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
