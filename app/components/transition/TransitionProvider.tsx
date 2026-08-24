"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import useSound from "use-sound";
import { useUiSoundEnabled } from "@/app/lib/uiSoundContext";
import { EASE_LIQUID_IN, EASE_LIQUID_INOUT, EASE_LIQUID_OUT } from "./liquidEase";
import {
  PATH_COVERED,
  PATH_GROW_1,
  PATH_GROW_2,
  PATH_HIDDEN,
  PATH_REVEAL_END,
  PATH_REVEAL_MID,
  PATH_REVEAL_START,
} from "./liquidPaths";

const PARTICLE_COUNT = 22;

/** Fallback so a transition can never strand the user on a fully-covered
 * screen if navigation hangs (slow data fetch, network hiccup, etc). */
const NAVIGATION_TIMEOUT_MS = 4000;

type TransitionContextValue = {
  /** Plays the full cover → route change → reveal sequence, then navigates. */
  navigate: (href: string) => void;
  /** Attach to the element wrapping the routed page content — this is
   * both the "old page fades away" surface and the stagger-reveal target. */
  pageRef: RefObject<HTMLDivElement | null>;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function useTransitionRouter() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error("useTransitionRouter must be used within a TransitionProvider");
  }
  return ctx;
}

/** Direct children of the page wrapper if there's more than one; otherwise
 * the single wrapped root's own children — lets the stagger reveal work
 * whether a page returns several top-level sections or one wrapping div
 * full of sections, without requiring any per-page opt-in markup. */
function getStaggerTargets(container: HTMLElement): Element[] {
  const direct = Array.from(container.children);
  if (direct.length > 1) return direct;
  const nested = direct[0] ? Array.from(direct[0].children) : [];
  return nested.length > 1 ? nested : direct;
}

export default function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { enabled: soundEnabled } = useUiSoundEnabled();
  const [playWhoosh] = useSound("/audio/ui/whoosh.wav", { volume: 0.45, soundEnabled });

  const overlayRootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const blurRef = useRef<HTMLDivElement>(null);
  const particleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const particleTweens = useRef<Array<gsap.core.Tween | null>>([]);
  const pageRef = useRef<HTMLDivElement>(null);

  const isAnimatingRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);
  const hasMountedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setBlocking = useCallback((blocking: boolean) => {
    if (overlayRootRef.current) {
      overlayRootRef.current.style.pointerEvents = blocking ? "auto" : "none";
    }
  }, []);

  const spawnParticles = useCallback(() => {
    particleRefs.current.forEach((el) => {
      if (!el) return;
      gsap.set(el, {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        opacity: 0,
      });
      gsap.to(el, { opacity: 0.35 + Math.random() * 0.4, duration: 0.5, ease: "sine.out" });
    });
  }, []);

  const driftParticles = useCallback(() => {
    particleRefs.current.forEach((el, i) => {
      if (!el) return;
      particleTweens.current[i]?.kill();
      particleTweens.current[i] = gsap.to(el, {
        x: `+=${(Math.random() - 0.5) * 160}`,
        y: `+=${(Math.random() - 0.5) * 160}`,
        duration: 3 + Math.random() * 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });
  }, []);

  const fadeParticles = useCallback(() => {
    particleRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        opacity: 0,
        duration: 1.2,
        delay: 0.3,
        ease: "sine.in",
        onComplete: () => particleTweens.current[i]?.kill(),
      });
    });
  }, []);

  const clearNavigationTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const playReveal = useCallback(() => {
    clearNavigationTimeout();

    if (pageRef.current) {
      const targets = getStaggerTargets(pageRef.current);
      gsap.set(targets, { y: 44, opacity: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimatingRef.current = false;
          setBlocking(false);
        },
      });

      tl.to(pathRef.current, { attr: { d: PATH_REVEAL_START }, duration: 0.22, ease: EASE_LIQUID_OUT })
        .to(
          targets,
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: EASE_LIQUID_OUT,
            // Release opacity/transform back to CSS once the entrance
            // finishes — otherwise this inline style permanently outranks
            // any target that manages its own visibility via classes (e.g.
            // LiveChat's open/closed state), silently overriding it.
            clearProps: "opacity,transform",
          },
          "-=0.05"
        )
        .to(pathRef.current, { attr: { d: PATH_REVEAL_MID }, duration: 0.42, ease: EASE_LIQUID_INOUT }, "<")
        .to(pathRef.current, { attr: { d: PATH_REVEAL_END }, duration: 0.36, ease: EASE_LIQUID_IN })
        .to(blurRef.current, { opacity: 0, duration: 0.45, ease: "sine.in" }, "<")
        .call(fadeParticles, [], "<");
    } else {
      isAnimatingRef.current = false;
      setBlocking(false);
    }
  }, [clearNavigationTimeout, fadeParticles, setBlocking]);

  const playCover = useCallback(
    (href: string) => {
      setBlocking(true);
      playWhoosh();
      const tl = gsap.timeline({
        onComplete: () => {
          pendingHrefRef.current = href;
          router.push(href);
          timeoutRef.current = setTimeout(() => {
            // Navigation stalled — reveal anyway rather than stranding
            // the user behind an opaque screen.
            if (pendingHrefRef.current === href) {
              pendingHrefRef.current = null;
              playReveal();
            }
          }, NAVIGATION_TIMEOUT_MS);
        },
      });

      tl.set(pathRef.current, { attr: { d: PATH_HIDDEN } })
        .to(pathRef.current, { attr: { d: PATH_GROW_1 }, duration: 0.42, ease: EASE_LIQUID_OUT })
        .to(blurRef.current, { opacity: 1, duration: 0.4, ease: "sine.out" }, "-=0.2")
        .to(pathRef.current, { attr: { d: PATH_GROW_2 }, duration: 0.32, ease: EASE_LIQUID_INOUT })
        .call(spawnParticles)
        .to(pathRef.current, { attr: { d: PATH_COVERED }, duration: 0.24, ease: EASE_LIQUID_IN })
        .call(driftParticles)
        .to({}, { duration: 0.12 }); // a short held beat while fully covered
    },
    [driftParticles, playReveal, playWhoosh, router, setBlocking, spawnParticles]
  );

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      playCover(href);
    },
    [pathname, playCover]
  );

  // Reveal once the target route has actually mounted (link-triggered),
  // or — for browser back/forward, which we cannot intercept before the
  // swap — play a reveal-only beat so the visual language stays consistent
  // even though that swap itself can't be hidden.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    // The curtain is still fully opaque at this point (PATH_COVERED), so
    // this jump is invisible — without it, the new page inherits whatever
    // scroll offset the previous page was at, which on a long page can
    // mean landing on/near the footer instead of the top.
    window.scrollTo(0, 0);
    if (pendingHrefRef.current && pathname === pendingHrefRef.current) {
      pendingHrefRef.current = null;
      clearNavigationTimeout();
      playReveal();
    } else if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      setBlocking(true);
      gsap.set(pathRef.current, { attr: { d: PATH_COVERED } });
      gsap.set(blurRef.current, { opacity: 1 });
      spawnParticles();
      driftParticles();
      playReveal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => clearNavigationTimeout, [clearNavigationTimeout]);

  return (
    <TransitionContext.Provider value={{ navigate, pageRef }}>
      <div ref={overlayRootRef} aria-hidden="true" className="fixed inset-0 z-100001" style={{ pointerEvents: "none" }}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path ref={pathRef} d={PATH_HIDDEN} fill="var(--noir-bg)" />
        </svg>
        <div
          ref={blurRef}
          className="absolute inset-0 opacity-0"
          style={{ backdropFilter: "blur(40px)", background: "rgba(12,15,20,0.28)" }}
        />
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                particleRefs.current[i] = el;
              }}
              className="absolute h-1.5 w-1.5 rounded-full opacity-0"
              style={{
                background: "radial-gradient(circle, rgba(217,178,111,0.9) 0%, rgba(217,178,111,0) 70%)",
              }}
            />
          ))}
        </div>
      </div>
      {children}
    </TransitionContext.Provider>
  );
}

export { getStaggerTargets };
