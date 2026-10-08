import { TestBed } from '@angular/core/testing';
import { StarfieldComponent } from './starfield';

const createdObservers: string[] = [];

class ObserverStub {
  observe = vi.fn();
  disconnect = vi.fn();
}
class IntersectionObserverStub extends ObserverStub {
  constructor() {
    super();
    createdObservers.push('intersection');
  }
}

describe('StarfieldComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    createdObservers.length = 0;
  });

  it('renders a decorative canvas hidden from assistive tech and pointer input', () => {
    const fixture = TestBed.createComponent(StarfieldComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.classList).toContain('pointer-events-none');
    expect(root.querySelectorAll('canvas').length).toBe(1);
  });

  it('starts animating and cancels its frame and observers when destroyed', () => {
    const context = {
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('ResizeObserver', ObserverStub);
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    const request = vi.fn(() => 42);
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', request);
    vi.stubGlobal('cancelAnimationFrame', cancel);

    const fixture = TestBed.createComponent(StarfieldComponent);
    fixture.detectChanges();
    expect(createdObservers).toEqual(['intersection']);

    fixture.destroy();
    expect(cancel).toHaveBeenCalledWith(42);
  });

  it('draws a static sky and sets up no animation or pause logic when the visitor prefers reduced motion', () => {
    const context = { clearRect: vi.fn(), setTransform: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.stubGlobal('ResizeObserver', ObserverStub);
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);

    TestBed.createComponent(StarfieldComponent).detectChanges();

    expect(createdObservers).toEqual([]);
    expect(context.clearRect).toHaveBeenCalled();
  });
});
