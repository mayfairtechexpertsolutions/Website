import { TestBed } from '@angular/core/testing';
import { ENGAGEMENT_MODELS } from '../../../core/models/engagement-models.data';
import { ModelsAccordionComponent } from './models-accordion';

describe('ModelsAccordionComponent', () => {
  const createComponent = () => {
    const fixture = TestBed.createComponent(ModelsAccordionComponent);
    fixture.componentRef.setInput('models', ENGAGEMENT_MODELS);
    fixture.detectChanges();
    return fixture;
  };
  const expandedStates = (root: HTMLElement) =>
    Array.from(root.querySelectorAll('button')).map((button) => button.getAttribute('aria-expanded'));

  it('opens the first model by default', () => {
    expect(expandedStates(createComponent().nativeElement)).toEqual(['true', 'false', 'false']);
  });

  it('opens a model on click and closes the previous one', () => {
    const fixture = createComponent();
    const buttons = fixture.nativeElement.querySelectorAll('button');

    buttons[2].click();
    fixture.detectChanges();

    expect(expandedStates(fixture.nativeElement)).toEqual(['false', 'false', 'true']);
    expect(fixture.nativeElement.querySelectorAll('[id^="model-panel-"]').length).toBe(1);
  });

  it('opens a model when it receives keyboard focus or hover', () => {
    const fixture = createComponent();
    const root: HTMLElement = fixture.nativeElement;

    root.querySelectorAll('button')[1].dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(expandedStates(root)).toEqual(['false', 'true', 'false']);

    root.querySelectorAll('article')[0].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(expandedStates(root)).toEqual(['true', 'false', 'false']);
  });
});
