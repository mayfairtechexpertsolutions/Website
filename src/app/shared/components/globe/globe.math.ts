import { MAX_SPIN_SPEED, CENTER_X, CENTER_Y, SPHERE_RADIUS, INERTIA_SETTLE_SECONDS } from './globe.data';

/** exp(-4) ≈ 2%: the speed is within 2% of its target after the settle time. */
const SETTLE_DECAY_EXPONENT = 4;

export interface ProjectedPoint {
  readonly sx: number;
  readonly sy: number;
  /** Depth toward the viewer: positive on the visible hemisphere. */
  readonly z: number;
}

/** Maps a (longitude, latitude) on the sphere, turned by `angle`, to screen coordinates. */
export function project(lon: number, lat: number, angle: number): ProjectedPoint {
  const cosLat = Math.cos(lat);
  return {
    sx: CENTER_X + SPHERE_RADIUS * cosLat * Math.sin(lon + angle),
    sy: CENTER_Y - SPHERE_RADIUS * Math.sin(lat),
    z: SPHERE_RADIUS * cosLat * Math.cos(lon + angle),
  };
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Rotation (radians) produced by dragging `deltaViewboxX` along the equator. */
export function dragToAngle(deltaViewboxX: number): number {
  return deltaViewboxX / SPHERE_RADIUS;
}

export function clampSpinSpeed(speed: number): number {
  return Math.max(-MAX_SPIN_SPEED, Math.min(MAX_SPIN_SPEED, speed));
}

/** Eases the current spin speed toward `target`, frame-rate independently. */
export function easeSpinSpeed(current: number, target: number, deltaSeconds: number): number {
  const keep = Math.exp(-(deltaSeconds * SETTLE_DECAY_EXPONENT) / INERTIA_SETTLE_SECONDS);
  return target + (current - target) * keep;
}
