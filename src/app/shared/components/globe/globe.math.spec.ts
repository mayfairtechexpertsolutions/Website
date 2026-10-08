import { AUTO_SPIN_SPEED, CENTER_X, CENTER_Y, INERTIA_SETTLE_SECONDS, MAX_SPIN_SPEED, SPHERE_RADIUS } from './globe.data';
import { clampSpinSpeed, dragToAngle, easeSpinSpeed, project, smoothstep } from './globe.math';

describe('globe math', () => {
  describe('project', () => {
    it('places the point facing the viewer at the sphere centre column, toward the viewer', () => {
      const point = project(0, 0, 0);

      expect(point.sx).toBeCloseTo(CENTER_X);
      expect(point.sy).toBeCloseTo(CENTER_Y);
      expect(point.z).toBeCloseTo(SPHERE_RADIUS);
    });

    it('moves a point to the back hemisphere after a half turn', () => {
      expect(project(0, 0, Math.PI).z).toBeLessThan(0);
    });

    it('places the north pole above the centre regardless of rotation', () => {
      const point = project(0.7, Math.PI / 2, 1.3);

      expect(point.sx).toBeCloseTo(CENTER_X);
      expect(point.sy).toBeCloseTo(CENTER_Y - SPHERE_RADIUS);
    });
  });

  describe('smoothstep', () => {
    it('clamps outside the edges and eases between them', () => {
      expect(smoothstep(0, 1, -1)).toBe(0);
      expect(smoothstep(0, 1, 2)).toBe(1);
      expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5);
    });
  });

  describe('dragToAngle', () => {
    it('turns the globe one radian when the pointer travels one radius along the equator', () => {
      expect(dragToAngle(SPHERE_RADIUS)).toBeCloseTo(1);
      expect(dragToAngle(-SPHERE_RADIUS)).toBeCloseTo(-1);
    });
  });

  describe('easeSpinSpeed', () => {
    it('keeps the speed when it already equals the target', () => {
      expect(easeSpinSpeed(AUTO_SPIN_SPEED, AUTO_SPIN_SPEED, 0.016)).toBeCloseTo(AUTO_SPIN_SPEED);
    });

    it('settles close to the target after the settle time', () => {
      const flung = 4;
      const settled = easeSpinSpeed(flung, AUTO_SPIN_SPEED, INERTIA_SETTLE_SECONDS);

      expect(Math.abs(settled - AUTO_SPIN_SPEED)).toBeLessThan(0.05 * Math.abs(flung - AUTO_SPIN_SPEED));
    });

    it('gives the same result for one long step as for many short ones', () => {
      let stepped = 3;
      for (let i = 0; i < 10; i++) stepped = easeSpinSpeed(stepped, 0, 0.1);

      expect(easeSpinSpeed(3, 0, 1)).toBeCloseTo(stepped, 6);
    });
  });

  describe('clampSpinSpeed', () => {
    it('limits flings in both directions', () => {
      expect(clampSpinSpeed(100)).toBe(MAX_SPIN_SPEED);
      expect(clampSpinSpeed(-100)).toBe(-MAX_SPIN_SPEED);
      expect(clampSpinSpeed(1)).toBe(1);
    });
  });
});
