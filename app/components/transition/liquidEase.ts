import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

/**
 * Custom cubic-bezier eases for the liquid page transition — each string
 * is the standard (x1, y1, x2, y2) cubic-bezier control-point quartet
 * (CustomEase's shorthand form; it also accepts a full "cubic-bezier(...)"
 * CSS string, but that wrapper isn't needed here). Registered once at
 * module load (this file is only ever imported by transition components,
 * all client-only) and reused by id across every timeline so the "liquid"
 * character stays consistent between the cover and reveal phases.
 */
export const EASE_LIQUID_OUT = CustomEase.create("liquidOut", "0.65, 0, 0.35, 1");
export const EASE_LIQUID_IN = CustomEase.create("liquidIn", "0.55, 0, 0.1, 1");
export const EASE_LIQUID_INOUT = CustomEase.create("liquidInOut", "0.85, 0, 0.15, 1");
