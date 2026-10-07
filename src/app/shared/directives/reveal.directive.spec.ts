import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RevealDirective } from './reveal.directive';

@Component({ imports: [RevealDirective], template: `<div appReveal [revealDelay]="150"></div>` })
class HostComponent {}

describe('RevealDirective', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('adds the reveal class and applies the stagger delay', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement.firstElementChild;

    expect(host.classList.contains('reveal')).toBe(true);
    expect(host.style.transitionDelay).toBe('150ms');
  });
});
