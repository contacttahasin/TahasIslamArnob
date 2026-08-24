"use client";

import { Suspense, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import type { Group, Points } from "three";
import type { PublicProject } from "@/app/components/projects/types";
import RingLights from "./RingLights";
import RingFloor from "./RingFloor";
import RingMesh from "./RingMesh";
import { getCardAngle } from "./ringGeometry";
import { seededRandom } from "@/lib/utils";

/** Tiny floating particles drifting around the ring — plain
 * bufferGeometry + pointsMaterial, the same proven-safe technique as
 * MoonCanvas's Starfield, not drei's Sparkles (which this codebase has
 * found blacks out the canvas — see RingLights.tsx). Deliberately sparse
 * and dim: "very subtle atmospheric" dust, not a visual centerpiece. */
function AmbientParticles({ radius, accentHex }: { radius: number; accentHex: string }) {
  const pointsRef = useRef<Points>(null);

  const positions = useMemo(() => {
    const count = 60;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * (0.6 + seededRandom(i * 3 + 1) * 1.1);
      const theta = seededRandom(i * 3 + 2) * Math.PI * 2;
      arr[i * 3] = Math.cos(theta) * r;
      arr[i * 3 + 1] = (seededRandom(i * 3 + 3) - 0.3) * radius * 1.4;
      arr[i * 3 + 2] = Math.sin(theta) * r;
    }
    return arr;
  }, [radius]);

  useFrame((state) => {
    if (pointsRef.current) pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={accentHex} size={radius * 0.012} sizeAttenuation transparent opacity={0.35} depthWrite={false} />
    </points>
  );
}

// Generous headroom relative to how close the ring's radius is allowed to
// get (see RADIUS_CAMERA_CAP below) — needed so perspective magnification,
// 1 / (1 - radius/CAMERA_Z), stays in a strong-but-stable range instead of
// spiking toward infinity as radius approaches CAMERA_Z.
const CAMERA_FOV = 34;
const CAMERA_Z = 15;
const RADIUS_CAMERA_CAP = 0.6; // radius never exceeds this fraction of CAMERA_Z

type RingContentProps = {
  cards: PublicProject[];
  groupRef: RefObject<Group | null>;
  selectedIndex: number | null;
  onActivate: (index: number) => void;
  consumeDidDrag: () => boolean;
  accentHex: string;
  accentLightHex: string;
};

/** Lives inside <Canvas> — useThree (and therefore responsive viewport
 * sizing) only works within the R3F tree, so all the world-unit geometry
 * math happens here rather than in the plain-React parent. */
function RingContent({
  cards,
  groupRef,
  selectedIndex,
  onActivate,
  consumeDidDrag,
  accentHex,
  accentLightHex,
}: RingContentProps) {
  const { viewport, size } = useThree();
  const count = cards.length;
  const ASPECT = 0.74; // card width / height
  // "below 640px" — same threshold named in the mobile spec, and matches
  // Tailwind's own `sm` breakpoint already used elsewhere in this codebase.
  const isMobile = size.width < 640;
  const isTablet = !isMobile && size.width < 1024;
  const pixelsPerWorldUnit = size.height / viewport.height;
  // RingMesh multiplies each card's rendered size by a live depth-based
  // scale curve that peaks at this value for the front card (see
  // SCALE_CURVE in RingMesh.tsx). The pixel-targeting formulas below solve
  // for the *nominal* geometry size — dividing by this peak here is what
  // keeps the *final, on-screen* front card at the intended pixel target
  // instead of rendering ~40% larger than every size below was tuned for.
  const DEPTH_SCALE_PEAK = 1.4;

  let radius: number;
  let cardWidth: number;
  let cardHeight: number;

  if (isMobile) {
    // Dedicated mobile path — deliberately *not* a scaled-down version of
    // the desktop formula below. Desktop intentionally decouples radius
    // from cardWidth (a wide ring with individually modest cards has real
    // gaps by design); on a 320-480px phone there isn't room for both "the
    // ring reaches its usual width fraction" and "cards stay their usual
    // size" at once, and decoupling them there is exactly what let cards
    // overlap — a shrinking radius with a cardWidth floor that didn't
    // shrink to match. Coupling radius back to cardWidth via a tight-fit
    // formula (radius = the exact circumradius a regular 12-gon needs for
    // this cardWidth, plus a small gap factor) guarantees no overlap by
    // construction, at any width in this range.
    // Bumped up from 1.15 — with the ring now carrying more cards (a
    // 15-slot order instead of 12), the tighter angular spacing per card
    // made the old factor read as cramped on phones. A bigger factor
    // means a visibly larger gap between neighboring cards on mobile.
    const MOBILE_TIGHT_FACTOR = 1.45;
    const mobileTightRadius = (w: number) =>
      count > 1 ? (w / 2 / Math.tan(Math.PI / count)) * MOBILE_TIGHT_FACTOR : 0;
    // Softer than desktop's RADIUS_CAMERA_CAP (0.6) — keeps radius farther
    // from CAMERA_Z, which mutes perspective magnification (1 / (1 -
    // radius/CAMERA_Z)) into a gentler front/back scale difference,
    // exactly the "reduce scale difference between front and side cards"
    // ask, without touching the shared camera's own fov/distance (that
    // would risk the desktop framing this same camera also drives).
    const MOBILE_RADIUS_CAP = 0.38;
    const maxRadius = CAMERA_Z * MOBILE_RADIUS_CAP;
    // Inverse of mobileTightRadius — the largest cardWidth that keeps the
    // tight-fit radius at or under maxRadius. With enough cards on the
    // ring, the pixel-target width below can imply a tight-fit radius
    // bigger than maxRadius; capping radius alone while leaving cardWidth
    // sized for that uncapped radius breaks the "no overlap by
    // construction" guarantee — the cards end up too wide for the
    // smaller, capped circle they're actually placed on. Clamping
    // cardWidth here keeps the two consistent no matter how many cards
    // are in the ring.
    const maxCardWidthForRadius =
      count > 1 ? (2 * Math.tan(Math.PI / count) * maxRadius) / MOBILE_TIGHT_FACTOR : Infinity;
    // 120-150px target width, itself responsive to the exact viewport
    // rather than a fixed pixel value — divided by DEPTH_SCALE_PEAK so the
    // *final* on-screen size (after RingMesh's own front-card scale
    // multiplier) lands on this target, not the pre-scale geometry.
    const targetMobileWidthPx = Math.min(Math.max(size.width * 0.36, 120), 150) / DEPTH_SCALE_PEAK;

    // Same damped fixed-point solve as the desktop pixel-targeting used to
    // use before it was decoupled — needed here because cardWidth again
    // determines radius (tight fit) which determines magnification which
    // determines how many world units hit the pixel target.
    let guess = targetMobileWidthPx / pixelsPerWorldUnit;
    for (let i = 0; i < 8; i++) {
      const radiusGuess = Math.min(mobileTightRadius(guess), maxRadius);
      const mag = CAMERA_Z / (CAMERA_Z - radiusGuess);
      const next = targetMobileWidthPx / (mag * pixelsPerWorldUnit);
      guess = (guess + next) / 2;
    }
    cardWidth = Math.min(guess, maxCardWidthForRadius);
    radius = Math.min(mobileTightRadius(cardWidth), maxRadius);
    cardHeight = cardWidth / ASPECT;

    // Vertical guard, same idea as desktop's below but a slightly lower
    // ceiling — mobile's section is shorter in absolute px, so leaving a
    // touch more headroom keeps the front card fully framed rather than
    // brushing the section edges.
    const magnification = CAMERA_Z / (CAMERA_Z - radius);
    // Divided by DEPTH_SCALE_PEAK for the same reason the pixel targets
    // above are — this caps the *nominal* geometry height, but the front
    // card renders up to DEPTH_SCALE_PEAK larger than that, so the cap
    // has to leave room for that multiplier or the guard doesn't guard.
    const maxCardHeight = (0.85 * viewport.height) / magnification / DEPTH_SCALE_PEAK;
    if (cardHeight > maxCardHeight) {
      const shrink = maxCardHeight / cardHeight;
      cardHeight *= shrink;
      cardWidth *= shrink;
      radius *= shrink; // keep the tight-fit relationship intact
    }
  } else if (isTablet) {
    // Tablet (640-1024px) — same decoupled radius/cardWidth pattern as
    // desktop below, tuned to tablet's own (deliberately smaller) targets:
    // ring ~70% of section width, front card 260-300px, rather than a
    // scaled-down copy of the desktop numbers.
    const RADIUS_WIDTH_FRACTION = 0.34;
    radius = Math.min(viewport.width * RADIUS_WIDTH_FRACTION, CAMERA_Z * RADIUS_CAMERA_CAP);
    const magnification = CAMERA_Z / (CAMERA_Z - radius);

    const targetFrontWidthPx = Math.min(Math.max(size.width * 0.34, 260), 300) / DEPTH_SCALE_PEAK;
    cardWidth = targetFrontWidthPx / (magnification * pixelsPerWorldUnit);
    cardHeight = cardWidth / ASPECT;

    const maxCardHeight = (0.9 * viewport.height) / magnification / DEPTH_SCALE_PEAK;
    if (cardHeight > maxCardHeight) {
      const shrink = maxCardHeight / cardHeight;
      cardHeight *= shrink;
      cardWidth *= shrink;
    }
  } else {
    // Desktop (1024px+) — radius and cardWidth are deliberately independent
    // targets, not derived from one another: tying radius to a tight fit
    // around cardWidth meant "ring spans 80% of the section" and "front
    // card is ~340px" fought each other — with 12 cards, satisfying both
    // through a tight-fit gap would need a ~520px card. A big ring with
    // individually modest cards inherently has real gaps between them,
    // which is what "evenly distributed around a true 360° ring" actually
    // looks like — this isn't a coverflow where cards touch edge to edge.
    const RADIUS_WIDTH_FRACTION = 0.4;
    radius = Math.min(viewport.width * RADIUS_WIDTH_FRACTION, CAMERA_Z * RADIUS_CAMERA_CAP);
    const magnification = CAMERA_Z / (CAMERA_Z - radius);

    // Large-desktop size boost — grows continuously with viewport width
    // (a JS clamp() equivalent, not a fixed breakpoint jump) from +15% at
    // the 1024px lg boundary up to +30% by ~1920px, then holds flat so
    // 27"/32" monitors read as "premium" rather than growing without
    // bound. A pure multiplier on top of the pixel targets below — the
    // tablet/mobile branches above are untouched, as is the shared
    // depth-scale curve in RingMesh (SCALE_CURVE), so the front/center
    // card — already ~1.4x its neighbors there — grows by that same
    // larger multiplier in absolute px automatically, with no change to
    // any animation or interaction code.
    const LG_BOOST_MIN = 1.15;
    const LG_BOOST_MAX = 1.3;
    const LG_BOOST_MAX_WIDTH = 1920;
    const lgBoost =
      LG_BOOST_MIN +
      (LG_BOOST_MAX - LG_BOOST_MIN) *
        Math.min(Math.max((size.width - 1024) / (LG_BOOST_MAX_WIDTH - 1024), 0), 1);

    const targetFrontWidthPx = (Math.min(Math.max(size.width * 0.23, 150), 400) * lgBoost) / DEPTH_SCALE_PEAK;
    cardWidth = targetFrontWidthPx / (magnification * pixelsPerWorldUnit);

    // Overlap safety — the boost above can otherwise push cardWidth past
    // what fits between two adjacent card slots at this radius/count. Cap
    // it to the chord distance between neighboring card centers (with a
    // breathing-room margin), using DEPTH_SCALE_PEAK as each card's
    // worst-case rendered half-width — the real per-card curve in
    // RingMesh never exceeds that peak, so this bound guarantees no
    // overlap or clipping regardless of card count or viewport width.
    if (count > 1) {
      const chordDistance = 2 * radius * Math.sin(Math.PI / count);
      const maxCardWidthForOverlap = (chordDistance * 0.88) / DEPTH_SCALE_PEAK;
      cardWidth = Math.min(cardWidth, maxCardWidthForOverlap);
    }

    cardHeight = cardWidth / ASPECT;

    const maxCardHeight = (0.94 * viewport.height) / magnification / DEPTH_SCALE_PEAK;
    if (cardHeight > maxCardHeight) {
      const shrink = maxCardHeight / cardHeight;
      cardHeight *= shrink;
      cardWidth *= shrink;
    }
  }

  // Based on the *scaled* front card height (nominal * DEPTH_SCALE_PEAK),
  // not the nominal geometry size — the floor needs to clear the front
  // card as it's actually rendered, not its pre-scale-curve geometry.
  const floorY = -(cardHeight * DEPTH_SCALE_PEAK) * 0.9;

  // Fog bounds anchored to CAMERA_Z, not just radius — the front card sits
  // at camera-distance (CAMERA_Z - radius) and the rear card at
  // (CAMERA_Z + radius); a bound scaled purely off radius moves the wrong
  // way as radius shrinks and can fog out the *front* card too (this bit
  // once, when a small radius pushed the front card past a small fog-far
  // value). near starts just before the front card so it stays crisp; far
  // sits just past the rear card's own distance, so the rear "fades almost
  // completely" rather than merely dimming.
  const fogNear = Math.max((CAMERA_Z - radius) * 0.7, 1.5);
  const fogFar = CAMERA_Z + radius * 1.08;

  return (
    <>
      <fog attach="fog" args={["#0c0f14", fogNear, fogFar]} />
      <RingLights accentHex={accentHex} accentLightHex={accentLightHex} radius={radius} />
      <RingFloor accentHex={accentHex} radius={radius} y={floorY} />
      <AmbientParticles radius={radius} accentHex={accentHex} />

      <group ref={groupRef}>
        {cards.map((project, index) => (
          <RingMesh
            key={`ring3d-${index}-${project.id}`}
            project={project}
            index={index}
            angleDeg={getCardAngle(index, count)}
            radius={radius}
            width={cardWidth}
            height={cardHeight}
            isSelected={selectedIndex === index}
            accentHex={accentHex}
            onActivate={onActivate}
            consumeDidDrag={consumeDidDrag}
            ringGroupRef={groupRef}
          />
        ))}
      </group>
    </>
  );
}

type RingCanvasProps = RingContentProps & {
  lowPower: boolean;
};

export default function RingCanvas({ lowPower, ...contentProps }: RingCanvasProps) {
  return (
    <Canvas shadows={!lowPower} gl={{ antialias: true, alpha: true }} dpr={[1, lowPower ? 1.25 : 2]}>
      <PerspectiveCamera makeDefault position={[0, 0, CAMERA_Z]} fov={CAMERA_FOV} />
      <Suspense fallback={null}>
        <RingContent {...contentProps} />
      </Suspense>
    </Canvas>
  );
}
