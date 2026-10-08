import { createRandom, createStars, nextShootingStarDelay, STAR_COUNT, textSafeAlpha, twinkleFactor } from './starfield.math';

describe('starfield math', () => {
  describe('createStars', () => {
    it('is deterministic for a given seed', () => {
      expect(createStars(STAR_COUNT, 7)).toEqual(createStars(STAR_COUNT, 7));
      expect(createStars(STAR_COUNT, 7)).not.toEqual(createStars(STAR_COUNT, 8));
    });

    it('creates roughly the requested count across all three layers', () => {
      const stars = createStars(STAR_COUNT, 1);

      expect(Math.abs(stars.length - STAR_COUNT)).toBeLessThanOrEqual(2);
      expect(new Set(stars.map((star) => star.layer))).toEqual(new Set([0, 1, 2]));
    });

    it('keeps every star inside the canvas with a visible size', () => {
      for (const star of createStars(STAR_COUNT, 1)) {
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.x).toBeLessThan(1);
        expect(star.y).toBeGreaterThanOrEqual(0);
        expect(star.y).toBeLessThan(1);
        expect(star.radius).toBeGreaterThan(0);
      }
    });
  });

  describe('textSafeAlpha', () => {
    it('dims the text side and reaches full brightness on the globe side', () => {
      expect(textSafeAlpha(0)).toBeLessThan(0.5);
      expect(textSafeAlpha(1)).toBe(1);
      expect(textSafeAlpha(0.3)).toBeLessThan(textSafeAlpha(0.6));
    });
  });

  describe('twinkleFactor', () => {
    it('stays between 0.3 and 1', () => {
      const [star] = createStars(10, 3);
      for (let seconds = 0; seconds < 20; seconds += 0.37) {
        const factor = twinkleFactor(star, seconds);
        expect(factor).toBeGreaterThanOrEqual(0.3);
        expect(factor).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('nextShootingStarDelay', () => {
    it('is between 8 and 10 seconds', () => {
      const random = createRandom(5);
      for (let i = 0; i < 50; i++) {
        const delay = nextShootingStarDelay(random);
        expect(delay).toBeGreaterThanOrEqual(8);
        expect(delay).toBeLessThanOrEqual(10);
      }
    });
  });
});
