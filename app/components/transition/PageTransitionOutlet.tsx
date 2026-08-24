"use client";

import type { ReactNode } from "react";
import { useTransitionRouter } from "./TransitionProvider";

/**
 * Wraps the routed page content (the `{children}` slot in the root
 * layout) and attaches the ref TransitionProvider uses as its stagger
 * reveal target. Kept separate from TransitionProvider itself so the
 * persistent chrome (nav bar, slide-out menu) can sit outside it —
 * only the actual page content should slide/stagger on navigation.
 */
export default function PageTransitionOutlet({ children }: { children: ReactNode }) {
  const { pageRef } = useTransitionRouter();
  return <div ref={pageRef}>{children}</div>;
}
