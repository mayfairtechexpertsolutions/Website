import { TestBed } from '@angular/core/testing';
import { TECH_STACK } from '../../../core/stack/tech-stack.data';
import { TechStackComponent, settleProgress } from './tech-stack';

describe('TechStackComponent', () => {
  /** Stubs the two media queries the component reads: desktop width and reduced motion. */
  const stubMedia = ({ desktop = false, reducedMotion = false } = {}) =>
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduced-motion') ? reducedMotion : desktop,
      addEventListener() {},
      removeEventListener() {},
    }));

  beforeEach(() => stubMedia());
  afterEach(() => vi.unstubAllGlobals());

  const createComponent = () => {
    const fixture = TestBed.createComponent(TechStackComponent);
    fixture.componentRef.setInput('layers', TECH_STACK);
    fixture.detectChanges();
    return fixture;
  };
  type Fixture = ReturnType<typeof createComponent>;
  const root = (fixture: Fixture): HTMLElement => fixture.nativeElement;
  const accordionButtons = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('[data-accordion-button]'));
  const expandedStates = (el: HTMLElement) => accordionButtons(el).map((b) => b.getAttribute('aria-expanded'));
  /** Active flags of the plates in the first (desktop) stage. */
  const activePlates = (el: HTMLElement) =>
    Array.from(el.querySelector('.stack-scene')!.querySelectorAll('.stack-plate')).map((p) =>
      p.classList.contains('is-active'),
    );

  /** Fakes the desktop track geometry, scrolls `scrolledPx` into it, fires a scroll event and waits a frame. */
  const scrollTrack = async (fixture: Fixture, scrolledPx: number) => {
    const el = root(fixture);
    const track = el.querySelector<HTMLElement>('.relative.hidden.lg\\:block')!;
    const pinned = track.firstElementChild as HTMLElement;
    Object.defineProperty(track, 'offsetHeight', { configurable: true, value: 2000 });
    Object.defineProperty(pinned, 'offsetHeight', { configurable: true, value: 600 });
    track.getBoundingClientRect = () => ({ top: 96 - scrolledPx }) as DOMRect;
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await fixture.whenStable();
  };

  describe('below lg (accordion)', () => {
    it('opens the first layer and lifts its plate by default', () => {
      const el = root(createComponent());
      expect(expandedStates(el)).toEqual(['true', 'false', 'false', 'false']);
      expect(activePlates(el)).toEqual([true, false, false, false]);
    });

    it('stacks the first layer on top', () => {
      const levels = Array.from(root(createComponent()).querySelectorAll<HTMLElement>('.stack-plate'))
        .slice(0, 4)
        .map((p) => p.style.getPropertyValue('--level'));
      expect(levels).toEqual(['3', '2', '1', '0']);
    });

    it('opens a layer from its button or its plate', () => {
      const fixture = createComponent();
      const el = root(fixture);

      accordionButtons(el)[2].click();
      fixture.detectChanges();
      expect(expandedStates(el)).toEqual(['false', 'false', 'true', 'false']);
      expect(activePlates(el)).toEqual([false, false, true, false]);

      el.querySelectorAll<HTMLElement>('.stack-plate')[3].click();
      fixture.detectChanges();
      expect(expandedStates(el)).toEqual(['false', 'false', 'false', 'true']);
    });

    it('moves between layers with the arrow keys, wrapping at the ends', () => {
      const fixture = createComponent();
      const el = root(fixture);

      accordionButtons(el)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      fixture.detectChanges();
      expect(expandedStates(el)).toEqual(['false', 'false', 'false', 'true']);

      accordionButtons(el)[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      fixture.detectChanges();
      expect(expandedStates(el)).toEqual(['true', 'false', 'false', 'false']);
    });
  });

  const cssVar = (fixture: Fixture, name: string) => Number(root(fixture).style.getPropertyValue(name));

  describe('lg and up (scroll-driven)', () => {
    // Reduced motion skips the glide, so one frame lands exactly on the scroll position.
    beforeEach(() => stubMedia({ desktop: true, reducedMotion: true }));

    it('follows the scroll position through the track', async () => {
      const fixture = createComponent();
      const el = root(fixture);
      // 1400px of travel across 3 steps: 700px scrolled = progress 1.5, which rounds to the third layer.
      await scrollTrack(fixture, 700);
      expect(activePlates(el)).toEqual([false, false, true, false]);
      expect(el.querySelector('[aria-current="step"]')!.getAttribute('aria-label')).toBe('Data');

      await scrollTrack(fixture, 5000);
      expect(activePlates(el)).toEqual([false, false, false, true]);

      await scrollTrack(fixture, -300);
      expect(activePlates(el)).toEqual([true, false, false, false]);
    });

    it('drives the description strip and rail through CSS variables, resting on each layer', async () => {
      const fixture = createComponent();

      await scrollTrack(fixture, 700); // progress 1.5: halfway between the second and third layer
      expect(cssVar(fixture, '--stack-settled')).toBeCloseTo(1.5);
      expect(cssVar(fixture, '--stack-fill')).toBeCloseTo(0.5);

      await scrollTrack(fixture, 490); // progress 1.05: still resting on the second layer
      expect(cssVar(fixture, '--stack-settled')).toBe(1);
    });

    it('glides toward the scroll position over several frames instead of jumping', async () => {
      stubMedia({ desktop: true, reducedMotion: false });
      const fixture = createComponent();

      await scrollTrack(fixture, 1400); // target: the last layer, fill 1
      const afterOneFrame = cssVar(fixture, '--stack-fill');
      expect(afterOneFrame).toBeGreaterThan(0);
      expect(afterOneFrame).toBeLessThan(1);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      expect(cssVar(fixture, '--stack-fill')).toBe(1);
    });

    it('eases progress so it rests near each layer and glides between them', () => {
      expect(settleProgress(0)).toBe(0);
      expect(settleProgress(0.2)).toBe(0);
      expect(settleProgress(0.5)).toBeCloseTo(0.5);
      expect(settleProgress(0.8)).toBe(1);
      expect(settleProgress(3)).toBe(3);
    });

    it('scrolls the page to a layer when its rail step is clicked', async () => {
      const scrollTo = vi.fn();
      vi.stubGlobal('scrollTo', scrollTo);
      const fixture = createComponent();
      await scrollTrack(fixture, 0);

      root(fixture).querySelectorAll<HTMLButtonElement>('[data-rail-button]')[3].click();

      expect(scrollTo).toHaveBeenCalledWith({ top: 1400, behavior: 'instant' });
    });

    describe('wheel paging (through SectionPagerService)', () => {
      // The page sits 1000px down; scrollTrack moves the track instead, so a layer's stop is 1000 - px + 1400 * i / 3.
      beforeEach(() => {
        Object.defineProperty(window, 'scrollY', { value: 1000, configurable: true });
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 10000, configurable: true });
      });
      afterEach(() => {
        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 0, configurable: true });
      });

      const wheel = (deltaY: number) => {
        const event = new WheelEvent('wheel', { deltaY, cancelable: true });
        window.dispatchEvent(event);
        return event;
      };

      it('moves one layer per wheel gesture, swallowing the rest of the gesture', async () => {
        const scrollTo = vi.fn();
        vi.stubGlobal('scrollTo', scrollTo);
        const fixture = createComponent();
        await scrollTrack(fixture, 1400 / 3); // on the second layer

        expect(wheel(100).defaultPrevented).toBe(true);
        expect(scrollTo).toHaveBeenLastCalledWith({ top: expect.closeTo(1000 + 1400 / 3, 5), behavior: 'instant' });

        expect(wheel(100).defaultPrevented).toBe(true); // same gesture: no second step
        expect(scrollTo).toHaveBeenCalledTimes(1);

        await new Promise((resolve) => setTimeout(resolve, 250));
        wheel(-100);
        expect(scrollTo).toHaveBeenLastCalledWith({ top: expect.closeTo(1000 - 1400 / 3, 5), behavior: 'instant' });
      });

      it('lets the page scroll normally past the last layer when nothing follows', async () => {
        const fixture = createComponent();
        await scrollTrack(fixture, 1400);
        expect(wheel(100).defaultPrevented).toBe(false);
      });
    });
  });
});
