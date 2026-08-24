"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useTilt } from "./hooks/useTilt";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  max?: number;
  scaleOnHover?: number;
};

/**
 * Generic 3D tilt-on-hover wrapper, built on `useTilt`. Replaces the
 * rotateX/rotateY logic that used to be hand-rolled identically in
 * TeamCard, ReviewCard, and SkillCard on the home page.
 */
export default function TiltCard({
  children,
  className,
  max = 12,
  scaleOnHover = 1.02,
}: TiltCardProps) {
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt({ max });

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="perspective-distant"
    >
      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 800 }}
        whileHover={{ scale: scaleOnHover }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={cn("transform-gpu will-change-transform", className)}
      >
        {children}
      </motion.div>
    </div>
  );
}
