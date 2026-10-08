export const STAR_COUNT = 250;
export const STAR_LAYER_SHARES = [0.6, 0.3, 0.1] as const;
/** Pointer-parallax travel in px for the far, middle and near layers. */
export const LAYER_PARALLAX_PX = [4, 10, 20] as const;
const LAYER_RADIUS_PX = [0.6, 1, 1.6] as const;
const TEXT_SIDE_MIN_ALPHA = 0.3;
const TEXT_SIDE_FULL_ALPHA_FROM = 0.7;

export interface Star {
  /** Normalised position, 0..1 across the canvas. */
  readonly x: number;
  readonly y: number;
  readonly layer: number;
  readonly radius: number;
  readonly baseAlpha: number;
  readonly twinkleSpeed: number;
  readonly twinklePhase: number;
}

/** Small seeded PRNG so a given seed always yields the same sky. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createStars(count: number, seed: number): Star[] {
  const random = createRandom(seed);
  const stars: Star[] = [];
  STAR_LAYER_SHARES.forEach((share, layer) => {
    const layerCount = Math.round(count * share);
    for (let i = 0; i < layerCount; i++) {
      stars.push({
        x: random(),
        y: random(),
        layer,
        radius: LAYER_RADIUS_PX[layer] * (0.8 + 0.4 * random()),
        baseAlpha: 0.35 + 0.65 * random(),
        twinkleSpeed: 0.6 + 1.4 * random(),
        twinklePhase: random() * Math.PI * 2,
      });
    }
  });
  return stars;
}

/** Dims stars on the text side (left) of the hero so the headline keeps its contrast. */
export function textSafeAlpha(normalisedX: number): number {
  const t = Math.max(0, Math.min(1, normalisedX / TEXT_SIDE_FULL_ALPHA_FROM));
  return TEXT_SIDE_MIN_ALPHA + (1 - TEXT_SIDE_MIN_ALPHA) * t;
}

export function twinkleFactor(star: Star, seconds: number): number {
  return 0.65 + 0.35 * Math.sin(seconds * star.twinkleSpeed + star.twinklePhase);
}

/** Seconds until the next shooting star: 8–10. */
export function nextShootingStarDelay(random: () => number): number {
  return 8 + 2 * random();
}
