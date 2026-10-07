import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { RevealObserverService } from '../../core/services/reveal-observer.service';

@Directive({
  selector: '[appReveal]',
  host: { class: 'reveal' },
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly revealObserver = inject(RevealObserverService);

  ngOnInit(): void {
    this.revealObserver.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.revealObserver.unobserve(this.el.nativeElement);
  }
}
