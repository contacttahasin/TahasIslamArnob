/**
 * Liquid SVG path keyframes for the page-transition overlay.
 *
 * All keyframes share the exact same command sequence — M, L, C, L, Z —
 * so GSAP can tween the `d` attribute directly (interpolating the raw
 * numbers) without needing the MorphSVG plugin. The viewBox is a fixed
 * 1000x1000 square rendered with `preserveAspectRatio="none"`, so the
 * path stretches to fill whatever the real viewport's aspect ratio is —
 * this is what makes the shape "stretch" responsively on any screen.
 *
 * Shape: a flat bottom edge (always pinned at y=1000) and a liquid top
 * edge described by a single cubic bezier `L0,{topY} C c1x,c1y c2x,c2y
 * 1000,{topY} L1000,1000 Z`. Moving `topY` from 1000 (off-screen, hidden)
 * to 0 (fully covering) grows the shape from the bottom; varying the two
 * control points' y-offsets independently per keyframe is what gives the
 * wave its organic, asymmetric "liquid" wobble instead of a mechanical
 * linear wipe.
 */
function wave(topY: number, c1y: number, c2y: number): string {
  return `M0,1000 L0,${topY} C 250,${c1y} 750,${c2y} 1000,${topY} L1000,1000 Z`;
}

/** Fully hidden — flat, zero height, tucked below the viewport. */
export const PATH_HIDDEN = wave(1000, 1000, 1000);

/** Growth keyframes: bottom → covers the screen. */
export const PATH_GROW_1 = wave(620, 500, 760);
export const PATH_GROW_2 = wave(90, 10, 150);
export const PATH_COVERED = wave(0, 0, 0);

/** Reveal keyframes: a small liquid "give" before retracting, then back
 * down and off-screen — deliberately a different wobble shape than the
 * growth phase so the morph reads as alive, not a rewind. */
export const PATH_REVEAL_START = wave(0, -40, 120);
export const PATH_REVEAL_MID = wave(480, 620, 340);
export const PATH_REVEAL_END = PATH_HIDDEN;
