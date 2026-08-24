"use client";

import { useRef, type MouseEvent } from "react";
import { useMotionValue, useSpring } from "framer-motion";

type UseTiltOptions = {
  max?: number;
  stiffness?: number;
  damping?: number;
};

/**
 * Mouse-driven 3D tilt (rotateX/rotateY), extracted from the pattern that
 * used to be hand-rolled separately in Team/Skill/Review cards. Pair with
 * `transformPerspective` + `perspective-distant` on the parent for the 3D
 * effect to read correctly.
 */
export function useTilt({ max = 12, stiffness = 260, damping = 20 }: UseTiltOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness, damping });
  const springRotateY = useSpring(rotateY, { stiffness, damping });

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(relX * max);
    rotateX.set(relY * -max);
  };

  const onMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return { ref, rotateX: springRotateX, rotateY: springRotateY, onMouseMove, onMouseLeave };
}
