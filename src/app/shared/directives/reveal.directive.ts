import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { RevealObserverService } from '../../core/services/reveal-observer.service';

@Directive({
  selector: '[appReveal]',
  host: { class: 'reveal', '[style.transition-delay.ms]': 'revealDelay()' },
})
export class RevealDirective implements OnInit, OnDestroy {
  /** Stagger offset in ms, so sibling cards can enter one after another. */
  readonly revealDelay = input(0);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly revealObserver = inject(RevealObserverService);

  ngOnInit(): void {
    this.revealObserver.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.revealObserver.unobserve(this.el.nativeElement);
  }
}
