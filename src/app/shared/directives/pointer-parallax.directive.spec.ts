import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PointerParallaxDirective } from './pointer-parallax.directive';

@Component({ imports: [PointerParallaxDirective], template: `<div appPointerParallax></div>` })
class HostComponent {}

describe('PointerParallaxDirective', () => {
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const stubReducedMotion = (matches: boolean) => vi.stubGlobal('matchMedia', () => ({ matches }));
  const pointerMoveTo = (host: HTMLElement, clientX: number, clientY: number) => {
    host.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;
    host.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY }));
  };

  afterEach(() => vi.unstubAllGlobals());

  it('writes normalised pointer coordinates to --px/--py', async () => {
    stubReducedMotion(false);
    const fixture = TestBed.createComponent(HostComponent);
    const host: HTMLElement = fixture.nativeElement.firstElementChild;
    pointerMoveTo(host, 200, 0);
    await frame();

    expect(host.style.getPropertyValue('--px')).toBe('1.000');
    expect(host.style.getPropertyValue('--py')).toBe('-1.000');
  });

  it('does nothing when the visitor prefers reduced motion', async () => {
    stubReducedMotion(true);
    const fixture = TestBed.createComponent(HostComponent);
    const host: HTMLElement = fixture.nativeElement.firstElementChild;

    pointerMoveTo(host, 200, 0);
    await frame();

    expect(host.style.getPropertyValue('--px')).toBe('');
  });
});
