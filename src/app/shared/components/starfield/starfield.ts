import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  LAYER_PARALLAX_PX,
  STAR_COUNT,
  Star,
  createRandom,
  createStars,
  nextShootingStarDelay,
  textSafeAlpha,
  twinkleFactor,
} from './starfield.math';

const STAR_SEED = 20240611;
const MAX_DEVICE_PIXEL_RATIO = 2;
const STAR_COLOR = '255, 255, 255';
const SHOOTING_STAR_COLOR = '186, 245, 240';
const PARALLAX_EASING = 0.06;
const MAX_FRAME_SECONDS = 0.05;
const SHOOTING_STAR_SECONDS = 0.9;
const SHOOTING_STAR_TRAIL_PX = 90;

interface ShootingStar {
  x: number;
  y: number;
  readonly velocityX: number;
  readonly velocityY: number;
  age: number;
}

/** Decorative canvas sky behind the hero: layered twinkling stars with pointer parallax and the odd shooting star. */
@Component({
  selector: 'app-starfield',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pointer-events-none absolute inset-0 block', 'aria-hidden': 'true' },
  template: `<canvas #canvas class="size-full"></canvas>`,
})
export class StarfieldComponent implements AfterViewInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly stars = createStars(STAR_COUNT, STAR_SEED);
  private readonly random = createRandom(STAR_SEED + 1);
  private context?: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;
  private pointerTarget = { x: 0, y: 0 };
  private pointerEased = { x: 0, y: 0 };
  private shootingStar?: ShootingStar;
  private secondsUntilShootingStar = nextShootingStarDelay(this.random);
  private elapsedSeconds = 0;
  private lastFrameTime?: number;
  private frameId?: number;
  private reducedMotion = false;
  private cleanups: (() => void)[] = [];

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.context = this.canvasRef.nativeElement.getContext('2d');
    if (!this.context) return;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.observeSize();
    if (this.reducedMotion) {
      this.draw();
      return;
    }
    this.trackPointer();
    this.pauseWhenOffscreen();
    this.requestFrame();
  }

  ngOnDestroy(): void {
    this.cancelFrame();
    this.cleanups.forEach((cleanup) => cleanup());
  }

  private observeSize(): void {
    const resize = new ResizeObserver(() => {
      this.resizeCanvas();
      if (this.reducedMotion) this.draw();
    });
    resize.observe(this.host.nativeElement);
    this.cleanups.push(() => resize.disconnect());
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const { width, height } = this.host.nativeElement.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    this.width = width;
    this.height = height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    this.context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private trackPointer(): void {
    const section = this.host.nativeElement.parentElement;
    if (!section) return;
    const onMove = (event: PointerEvent) => {
      const bounds = section.getBoundingClientRect();
      this.pointerTarget = {
        x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        y: ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      };
    };
    section.addEventListener('pointermove', onMove, { passive: true });
    this.cleanups.push(() => section.removeEventListener('pointermove', onMove));
  }

  private pauseWhenOffscreen(): void {
    const observer = new IntersectionObserver((entries) => {
      this.lastFrameTime = undefined;
      if (entries[0]?.isIntersecting ?? true) this.requestFrame();
      else this.cancelFrame();
    });
    observer.observe(this.host.nativeElement);
    this.cleanups.push(() => observer.disconnect());
  }

  private requestFrame(): void {
    if (this.frameId === undefined) this.frameId = requestAnimationFrame(this.onFrame);
  }

  private cancelFrame(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.frameId = undefined;
  }

  private readonly onFrame = (time: number): void => {
    this.frameId = undefined;
    const deltaSeconds = this.lastFrameTime === undefined ? 0 : Math.min((time - this.lastFrameTime) / 1000, MAX_FRAME_SECONDS);
    this.lastFrameTime = time;
    this.elapsedSeconds += deltaSeconds;
    this.easePointer();
    this.advanceShootingStar(deltaSeconds);
    this.draw();
    this.requestFrame();
  };

  private easePointer(): void {
    this.pointerEased.x += (this.pointerTarget.x - this.pointerEased.x) * PARALLAX_EASING;
    this.pointerEased.y += (this.pointerTarget.y - this.pointerEased.y) * PARALLAX_EASING;
  }

  private advanceShootingStar(deltaSeconds: number): void {
    if (this.shootingStar) {
      this.shootingStar.age += deltaSeconds;
      this.shootingStar.x += this.shootingStar.velocityX * deltaSeconds;
      this.shootingStar.y += this.shootingStar.velocityY * deltaSeconds;
      if (this.shootingStar.age >= SHOOTING_STAR_SECONDS) this.shootingStar = undefined;
      return;
    }
    this.secondsUntilShootingStar -= deltaSeconds;
    if (this.secondsUntilShootingStar > 0) return;
    this.secondsUntilShootingStar = nextShootingStarDelay(this.random);
    this.shootingStar = this.launchShootingStar();
  }

  private launchShootingStar(): ShootingStar {
    const speed = this.width * 0.5;
    return {
      x: this.width * (0.45 + 0.4 * this.random()),
      y: this.height * 0.05 * this.random(),
      velocityX: -speed,
      velocityY: speed * 0.4,
      age: 0,
    };
  }

  private draw(): void {
    const context = this.context;
    if (!context) return;
    context.clearRect(0, 0, this.width, this.height);
    for (const star of this.stars) this.drawStar(context, star);
    if (this.shootingStar) this.drawShootingStar(context, this.shootingStar);
  }

  private drawStar(context: CanvasRenderingContext2D, star: Star): void {
    const parallax = LAYER_PARALLAX_PX[star.layer];
    const x = star.x * this.width - this.pointerEased.x * parallax;
    const y = star.y * this.height - this.pointerEased.y * parallax;
    const twinkle = this.reducedMotion ? 1 : twinkleFactor(star, this.elapsedSeconds);
    context.fillStyle = `rgba(${STAR_COLOR}, ${star.baseAlpha * twinkle * textSafeAlpha(star.x)})`;
    context.beginPath();
    context.arc(x, y, star.radius, 0, Math.PI * 2);
    context.fill();
  }

  private drawShootingStar(context: CanvasRenderingContext2D, shooting: ShootingStar): void {
    const fade = Math.sin((shooting.age / SHOOTING_STAR_SECONDS) * Math.PI);
    const length = Math.hypot(shooting.velocityX, shooting.velocityY);
    const tailX = shooting.x - (shooting.velocityX / length) * SHOOTING_STAR_TRAIL_PX;
    const tailY = shooting.y - (shooting.velocityY / length) * SHOOTING_STAR_TRAIL_PX;
    const gradient = context.createLinearGradient(shooting.x, shooting.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(${SHOOTING_STAR_COLOR}, ${0.9 * fade})`);
    gradient.addColorStop(1, `rgba(${SHOOTING_STAR_COLOR}, 0)`);
    context.strokeStyle = gradient;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(shooting.x, shooting.y);
    context.lineTo(tailX, tailY);
    context.stroke();
  }
}
