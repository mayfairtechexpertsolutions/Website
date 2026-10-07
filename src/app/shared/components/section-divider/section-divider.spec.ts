import { TestBed } from '@angular/core/testing';
import { SectionDividerComponent } from './section-divider';

describe('SectionDividerComponent', () => {
  it('renders two lines and a diamond, hidden from assistive tech', () => {
    const fixture = TestBed.createComponent(SectionDividerComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('.divider-line').length).toBe(2);
    expect(root.querySelectorAll('.divider-diamond').length).toBe(1);
  });
});
