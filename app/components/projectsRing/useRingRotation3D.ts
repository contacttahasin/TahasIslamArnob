"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import gsap from "gsap";
import * as THREE from "three";
import type { Group } from "three";
import { angleToFront, getCardAngle, normalizeAngle, shortestAngleDelta } from "./ringGeometry";

/**
 * Same physics as the CSS ring's useRingRotation (auto-rotate, drag,
 * momentum, snap-to-front, keyboard stepping) — ported to write
 * `group.rotation.y` on a Three.js object instead of a CSS transform
 * string. The angle math itself is unchanged (still degrees, still
 * ringGeometry's helpers) so the two hooks stay easy to compare; only the
 * final "apply" step differs, and the whole engine still runs its own rAF
 * loop rather than a Canvas useFrame — it works either way since R3F's
 * default frameloop re-renders every frame regardless of what changed the
 * scene graph, exactly like the browser repainting a mutated DOM style.
 */

type Mode = "auto" | "drag" | "momentum" | "snap" | "settled";

type Sample = { x: number; t: number };

type UseRingRotation3DOptions = {
  cardCount: number;
  /** DOM element that receives drag/wheel input and is measured for drag
   * sensitivity — the div wrapping the <Canvas>, not the Three.js scene. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Three.js group the rotation is written to every frame. */
  groupRef: RefObject<Group | null>;
  autoRotateSpeed?: number;
  resumeDelayMs?: number;
  paused: boolean;
  reducedMotion: boolean;
};

const CLICK_THRESHOLD_PX = 6;
const WHEEL_DEG_PER_UNIT = 0.16;
const MIN_MOMENTUM_VELOCITY = 0.02; // deg/ms
// Lowered from 1.2 — a heavier object can't be flicked to full speed as
// easily, so a hard flick still tops out at a more deliberate max spin.
const MAX_VELOCITY = 0.85; // deg/ms
// Raised from 0.94 — more like something with real mass coasting to a
// stop than something skidding to a halt; the ring keeps drifting
// noticeably longer after a flick before settling.
const FRICTION_PER_FRAME = 0.965; // at ~60fps
const STOP_VELOCITY = 0.003; // deg/ms
const SAMPLE_WINDOW_MS = 120;
const SNAP_DURATION = 0.9;
// A full-width drag used to sweep the ring a full half-turn (180deg); this
// heavier ratio needs more physical drag distance for the same rotation —
// "dragging should feel heavier" — without changing the underlying
// pointer-to-angle wiring itself.
const DRAG_DEG_PER_WIDTH = 132;

export function useRingRotation3D({
  cardCount,
  containerRef,
  groupRef,
  autoRotateSpeed = 3,
  resumeDelayMs = 2600,
  paused,
  reducedMotion,
}: UseRingRotation3DOptions) {
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const modeRef = useRef<Mode>("auto");
  const lastInteractionRef = useRef(0);
  const degPerPxRef = useRef(0.3);
  const snapTweenRef = useRef<gsap.core.Tween | null>(null);

  // Reactive front-facing index — pagination dots need to re-render when
  // it changes (including during idle auto-rotate, not just on explicit
  // clicks), unlike angleRef above which intentionally stays a plain ref
  // for the rAF loop's own per-frame reads.
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const pausedRef = useRef(paused);
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    if (reducedMotion) modeRef.current = "settled";
  }, [reducedMotion]);

  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    lastX: 0,
    samples: [] as Sample[],
    maxMoved: 0,
    captured: false,
  });
  const didDragRef = useRef(false);

  const applyTransform = useCallback(() => {
    const group = groupRef.current;
    if (group) group.rotation.y = THREE.MathUtils.degToRad(angleRef.current);
  }, [groupRef]);

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = performance.now();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width || 1;
      degPerPxRef.current = DRAG_DEG_PER_WIDTH / width;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      snapTweenRef.current?.kill();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      angleRef.current += delta * WHEEL_DEG_PER_UNIT;
      velocityRef.current = 0;
      modeRef.current = "settled";
      markInteraction();
      applyTransform();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef, applyTransform, markInteraction]);

  useEffect(() => {
    let rafId: number;
    let lastFrame = performance.now();

    const tick = (now: number) => {
      const dt = now - lastFrame;
      lastFrame = now;

      switch (modeRef.current) {
        case "momentum": {
          angleRef.current += velocityRef.current * dt;
          velocityRef.current *= Math.pow(FRICTION_PER_FRAME, dt / 16.6667);
          if (Math.abs(velocityRef.current) < STOP_VELOCITY) {
            velocityRef.current = 0;
            modeRef.current = "settled";
            angleRef.current = normalizeAngle(angleRef.current);
          }
          applyTransform();
          break;
        }
        case "auto": {
          if (!pausedRef.current && !reducedMotionRef.current) {
            angleRef.current += autoRotateSpeed * (dt / 1000);
            applyTransform();
          }
          break;
        }
        case "settled": {
          if (
            !pausedRef.current &&
            !reducedMotionRef.current &&
            now - lastInteractionRef.current > resumeDelayMs
          ) {
            modeRef.current = "auto";
          }
          break;
        }
        case "drag":
        case "snap":
          break;
      }

      if (cardCount > 0) {
        const step = 360 / cardCount;
        const currentFrontAngle = normalizeAngle(-angleRef.current);
        const nearest = Math.round(currentFrontAngle / step) % cardCount;
        if (nearest !== activeIndexRef.current) {
          activeIndexRef.current = nearest;
          setActiveIndex(nearest);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [applyTransform, autoRotateSpeed, resumeDelayMs, cardCount]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    snapTweenRef.current?.kill();
    const now = performance.now();
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      samples: [{ x: e.clientX, t: now }],
      maxMoved: 0,
      captured: false,
    };
    didDragRef.current = false;
    velocityRef.current = 0;
    modeRef.current = "drag";
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag.active || e.pointerId !== drag.pointerId) return;

      const dx = e.clientX - drag.lastX;
      drag.lastX = e.clientX;
      drag.maxMoved = Math.max(drag.maxMoved, Math.abs(e.clientX - drag.startX));
      if (drag.maxMoved > CLICK_THRESHOLD_PX) {
        didDragRef.current = true;
        if (!drag.captured) {
          drag.captured = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }

      angleRef.current += dx * degPerPxRef.current;
      applyTransform();

      const now = performance.now();
      drag.samples.push({ x: e.clientX, t: now });
      while (drag.samples.length > 1 && now - drag.samples[0].t > SAMPLE_WINDOW_MS) {
        drag.samples.shift();
      }
    },
    [applyTransform]
  );

  const endDrag = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag.active || e.pointerId !== drag.pointerId) return;
      drag.active = false;
      markInteraction();

      const samples = drag.samples;
      let velocity = 0;
      if (samples.length >= 2) {
        const first = samples[0];
        const last = samples[samples.length - 1];
        const dt = last.t - first.t || 1;
        velocity = ((last.x - first.x) / dt) * degPerPxRef.current;
      }

      if (reducedMotionRef.current || Math.abs(velocity) < MIN_MOMENTUM_VELOCITY) {
        modeRef.current = "settled";
      } else {
        velocityRef.current = Math.min(Math.max(velocity, -MAX_VELOCITY), MAX_VELOCITY);
        modeRef.current = "momentum";
      }
    },
    [markInteraction]
  );

  const rotateToIndex = useCallback(
    (index: number, onComplete?: () => void) => {
      snapTweenRef.current?.kill();
      modeRef.current = "snap";
      velocityRef.current = 0;

      const cardAngle = getCardAngle(index, cardCount);
      const targetFront = angleToFront(cardAngle);
      const delta = shortestAngleDelta(normalizeAngle(angleRef.current), normalizeAngle(targetFront));
      const start = angleRef.current;
      const end = start + delta;

      if (reducedMotionRef.current) {
        angleRef.current = normalizeAngle(end);
        applyTransform();
        modeRef.current = "settled";
        markInteraction();
        onComplete?.();
        return;
      }

      const state = { angle: start };
      snapTweenRef.current = gsap.to(state, {
        angle: end,
        duration: SNAP_DURATION,
        ease: "power4.out",
        onUpdate: () => {
          angleRef.current = state.angle;
          applyTransform();
        },
        onComplete: () => {
          angleRef.current = normalizeAngle(angleRef.current);
          modeRef.current = "settled";
          markInteraction();
          onComplete?.();
        },
      });
    },
    [applyTransform, cardCount, markInteraction]
  );

  const stepFocus = useCallback(
    (direction: 1 | -1) => {
      if (cardCount === 0) return;
      const step = 360 / cardCount;
      const currentFrontAngle = normalizeAngle(-angleRef.current);
      const nearestIndex = Math.round(currentFrontAngle / step) % cardCount;
      const nextIndex = (nearestIndex + direction + cardCount) % cardCount;
      rotateToIndex(nextIndex);
    },
    [cardCount, rotateToIndex]
  );

  const consumeDidDrag = useCallback(() => {
    const value = didDragRef.current;
    didDragRef.current = false;
    return value;
  }, []);

  useEffect(() => {
    return () => {
      snapTweenRef.current?.kill();
    };
  }, []);

  return {
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    rotateToIndex,
    stepFocus,
    consumeDidDrag,
    markInteraction,
    angleRef,
    activeIndex,
  };
}
