/**
 * Pure math for the ring layout — kept free of DOM/React/Three.js so the
 * rotation physics in useRingRotation3D.ts can be unit-reasoned-about
 * independently of rendering. Angles stay in degrees throughout (converted
 * to radians only at the point Three.js needs them) so this file is the
 * same tested angle math regardless of whether the caller is CSS or WebGL.
 */

/** Wraps any angle (deg) into [0, 360). */
export function normalizeAngle(angle: number): number {
  const wrapped = angle % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** Shortest signed delta (deg, in (-180, 180]) to rotate `from` to `to` — the
 * "front" snap always takes the nearer way around the ring, never the long
 * way, regardless of how many full turns auto-rotation has accumulated. */
export function shortestAngleDelta(from: number, to: number): number {
  const diff = normalizeAngle(to - from);
  return diff > 180 ? diff - 360 : diff;
}

/** Position of card `index` (of `count`) around the ring, degrees. */
export function getCardAngle(index: number, count: number): number {
  return (360 / count) * index;
}

/** Stage rotation (deg) that brings a card sitting at `cardAngle` to face
 * the camera (0deg). */
export function angleToFront(cardAngle: number): number {
  return -cardAngle;
}
