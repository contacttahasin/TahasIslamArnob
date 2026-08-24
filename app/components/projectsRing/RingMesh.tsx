"use client";

import { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Texture } from "three";
import type { PublicProject } from "@/app/components/projects/types";
import { normalizeAngle, shortestAngleDelta } from "./ringGeometry";

/** Piecewise-linear curve through named checkpoints — `deg` is the card's
 * current *absolute* angular distance from front (0-180). Linear segments
 * (not a single smooth power curve) so the curve passes through exact
 * spec'd values at each checkpoint instead of approximating them, while
 * staying continuous as the ring rotates (no popping between tiers). */
function curveValue(deg: number, points: ReadonlyArray<readonly [number, number]>): number {
  const d = Math.min(Math.abs(deg), points[points.length - 1][0]);
  for (let i = 0; i < points.length - 1; i++) {
    const [a0, v0] = points[i];
    const [a1, v1] = points[i + 1];
    if (d <= a1) {
      const t = a1 === a0 ? 0 : (d - a0) / (a1 - a0);
      return v0 + (v1 - v0) * t;
    }
  }
  return points[points.length - 1][1];
}

// Checkpoints at 0deg (front), 30deg (first neighbor, 12-card ring), 60deg
// (second neighbor), 180deg (rear) — the exact tiers named in the spec.
const SCALE_CURVE = [
  [0, 1.4],
  [30, 0.95],
  [60, 0.8],
  [180, 0.6],
] as const;
const OPACITY_CURVE = [
  [0, 1],
  [30, 0.85],
  [60, 0.55],
  [180, 0.15],
] as const;
// Not literal px — this drives the blurred-overlay crossfade below, which
// is how "blur" gets simulated without a real-time GPU blur pass. Higher =
// more of the pre-blurred texture shows through.
const BLUR_CURVE = [
  [0, 0],
  [30, 0.22],
  [60, 0.55],
  [180, 0.85],
] as const;
// Fractions of this card's own `height` prop (not world units directly) —
// scaling the lift with height keeps it proportionally consistent across
// every breakpoint's own card size without needing separate tuning per
// breakpoint. Front stays at 0 (its position is untouched, per spec);
// side/rear cards lift progressively more. This exists because a level,
// eye-height camera projects every card's *center* (all at world Y=0) to
// the same screen row regardless of depth, but the floor sits well below
// that — as a card recedes toward the rear, both it and the floor's far
// edge converge toward that same screen row, so a rear card's bottom edge
// and the receding floor visually close the gap and can appear to clip
// even though nothing has actually moved in world space. Lifting rear
// cards in world Y restores real clearance, which reads correctly once
// perspective compresses it.
const Y_LIFT_CURVE = [
  [0, 0],
  [30, 0.05],
  [60, 0.14],
  [180, 0.3],
] as const;

/** Draws `source` onto a small canvas, optionally blurred, optionally with
 * a top-to-bottom fade baked in via "destination-in". Shared by both the
 * floor reflection (blurred + faded + mirrored) and the focus-blur overlay
 * (blurred, no fade, not mirrored) — canvas 2D's native `filter: blur()`
 * run once at load time, not a real-time WebGL pass (this codebase has
 * repeatedly found @react-three/postprocessing to black out the canvas —
 * see RingLights.tsx). */
function bakeTexture(
  source: HTMLImageElement,
  { blurPx, fade }: { blurPx: number; fade: boolean }
): THREE.CanvasTexture | null {
  if (!source.width || !source.height) return null;
  const width = 220;
  const height = Math.round(width * (source.height / source.width));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none";
  ctx.drawImage(source, 0, 0, width, height);
  ctx.filter = "none";

  if (fade) {
    ctx.globalCompositeOperation = "destination-in";
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.6)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

type RingMeshProps = {
  project: PublicProject;
  index: number;
  angleDeg: number;
  radius: number;
  width: number;
  height: number;
  isSelected: boolean;
  accentHex: string;
  onActivate: (index: number) => void;
  consumeDidDrag: () => boolean;
  /** The outer ring group's own rotation — read (never written) each frame
   * to work out this card's live angular distance from front, for the
   * scale/opacity/blur curves. A plain ref read, not a subscription, so it
   * can't drift out of sync with the actual rotation and costs nothing
   * when the ring is settled. */
  ringGroupRef: React.RefObject<Group | null>;
};

/**
 * A single ring card in real 3D space — a textured plane (the project
 * photo) mounted just in front of a RoundedBox "frame" (drei's RoundedBox
 * is a plain geometry helper, not a material/lighting risk, so it's safe
 * to use freely unlike Environment/MeshReflectorMaterial/Sparkles). Real
 * perspective provides the baseline front/back size difference; the scale
 * curve here layers deliberate, spec'd emphasis on top of that rather than
 * replacing it.
 */
export default function RingMesh({
  project,
  index,
  angleDeg,
  radius,
  width,
  height,
  isSelected,
  accentHex,
  onActivate,
  consumeDidDrag,
  ringGroupRef,
}: RingMeshProps) {
  const groupRef = useRef<Group>(null);
  const frameRef = useRef<Mesh>(null);
  const imageRef = useRef<Mesh>(null);
  const blurOverlayRef = useRef<Mesh>(null);
  const reflectionRef = useRef<Mesh>(null);
  const hoveredRef = useRef(false);
  const scaleRef = useRef(1);
  const hoverPushRef = useRef(0);
  const yLiftRef = useRef(0);
  const [reflectionTexture, setReflectionTexture] = useState<THREE.CanvasTexture | null>(null);
  const [blurTexture, setBlurTexture] = useState<THREE.CanvasTexture | null>(null);

  // Configured inside useTexture's own onLoad, not a separate effect
  // mutating its return value — the texture it returns is otherwise
  // treated as a hook output React expects to own.
  const handleTextureLoad = useCallback((loaded: Texture) => {
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.anisotropy = 8;
    loaded.needsUpdate = true;

    const source = loaded.image as HTMLImageElement | undefined;
    if (source instanceof HTMLImageElement) {
      setReflectionTexture(bakeTexture(source, { blurPx: 5, fade: true }));
      setBlurTexture(bakeTexture(source, { blurPx: 6, fade: false }));
    }
  }, []);
  const texture = useTexture(project.image, handleTextureLoad);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Live angular distance from front (0-180deg) — the outer ring's
    // current rotation plus this card's fixed placement angle.
    const stageAngleDeg = THREE.MathUtils.radToDeg(ringGroupRef.current?.rotation.y ?? 0);
    const frontDelta = Math.abs(shortestAngleDelta(0, normalizeAngle(angleDeg + stageAngleDeg)));

    const depthScale = curveValue(frontDelta, SCALE_CURVE);
    const depthOpacity = curveValue(frontDelta, OPACITY_CURVE);
    const blurAmount = curveValue(frontDelta, BLUR_CURVE);

    // Hover/select is a relative bump on top of the depth curve, not a
    // replacement for it — a receding side card that gets hovered still
    // reads as smaller than the front card, just larger than it was.
    const interactionMultiplier = isSelected ? 1.1 : hoveredRef.current ? 1.05 : 1;
    scaleRef.current = THREE.MathUtils.damp(scaleRef.current, depthScale * interactionMultiplier, 8, delta);
    group.scale.setScalar(scaleRef.current);

    // Hover "moves it forward" — a small additional push along the card's
    // own outward (translateZ) axis, damped for a heavier, premium feel
    // rather than an instant snap.
    const targetPush = hoveredRef.current && !isSelected ? width * 0.12 : 0;
    hoverPushRef.current = THREE.MathUtils.damp(hoverPushRef.current, targetPush, 7, delta);

    // Per-angle vertical float — see Y_LIFT_CURVE above. Damped like the
    // scale/hover values above it so the lift eases in/out smoothly as a
    // card's angular position changes, instead of snapping frame to frame.
    const targetYLift = curveValue(frontDelta, Y_LIFT_CURVE) * height;
    yLiftRef.current = THREE.MathUtils.damp(yLiftRef.current, targetYLift, 8, delta);
    group.position.set(0, yLiftRef.current, radius + hoverPushRef.current);

    const frame = frameRef.current;
    if (frame) {
      const material = frame.material as MeshPhysicalMaterial;
      const targetEmissive = isSelected ? 0.55 : hoveredRef.current ? 0.32 : 0.05;
      material.emissiveIntensity = THREE.MathUtils.damp(material.emissiveIntensity, targetEmissive, 8, delta);
      material.opacity = THREE.MathUtils.damp(material.opacity, depthOpacity, 8, delta);
    }

    const image = imageRef.current;
    if (image) {
      const material = image.material as MeshStandardMaterial;
      // Hover "increases brightness" — meshStandardMaterial has no direct
      // brightness knob, so this lifts emissive white on top of the lit
      // texture, the same effect a brightness boost reads as visually.
      const targetBrightness = hoveredRef.current && !isSelected ? 0.22 : 0;
      material.emissiveIntensity = THREE.MathUtils.damp(material.emissiveIntensity, targetBrightness, 8, delta);
      material.opacity = THREE.MathUtils.damp(material.opacity, depthOpacity, 8, delta);
    }

    const blurOverlay = blurOverlayRef.current;
    if (blurOverlay) {
      const material = blurOverlay.material as MeshBasicMaterial;
      // Baseline blur curve, faded out entirely once the card has mostly
      // faded anyway (depthOpacity low) so it doesn't read as a separate
      // hazy layer floating over an already-transparent card.
      const target = blurAmount * Math.min(depthOpacity * 1.6, 1);
      material.opacity = THREE.MathUtils.damp(material.opacity, target, 8, delta);
    }

    const reflection = reflectionRef.current;
    if (reflection) {
      const material = reflection.material as MeshBasicMaterial;
      // 0.1-0.2 base opacity per spec, additionally faded with the same
      // depth curve as the card above it — a rear card's reflection
      // shouldn't stay fully visible once the card itself has faded.
      const target = 0.16 * Math.max(depthOpacity, 0.25);
      material.opacity = THREE.MathUtils.damp(material.opacity, target, 8, delta);
    }
  });

  const angleRad = THREE.MathUtils.degToRad(angleDeg);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (consumeDidDrag()) return;
    onActivate(index);
  };

  return (
    <group rotation={[0, angleRad, 0]}>
      <group ref={groupRef} position={[0, 0, radius]}>
        <RoundedBox
          ref={frameRef}
          args={[width * 1.06, height * 1.06, width * 0.08]}
          radius={Math.min(width, height) * 0.09}
          smoothness={4}
          position={[0, 0, -width * 0.045]}
          castShadow
          receiveShadow
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            hoveredRef.current = true;
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            hoveredRef.current = false;
            document.body.style.cursor = "default";
          }}
        >
          <meshPhysicalMaterial
            color="#171b24"
            metalness={0.4}
            roughness={0.3}
            clearcoat={0.75}
            clearcoatRoughness={0.18}
            emissive={accentHex}
            emissiveIntensity={0.05}
            transparent
          />
        </RoundedBox>

        {/* Border light — a thin additively-blended outline just outside
            the frame, catching light like a polished metal edge. Separate
            from the glass highlight below (that's the sheen *across* the
            face; this is the *edge* lighting up). */}
        <mesh position={[0, 0, -width * 0.04]}>
          <planeGeometry args={[width * 1.1, height * 1.1]} />
          <meshBasicMaterial
            color={accentHex}
            transparent
            opacity={0.16}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh ref={imageRef} position={[0, 0, 0.01]} onClick={handleClick} castShadow>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.5}
            metalness={0.05}
            transparent
            emissive="#ffffff"
            emissiveIntensity={0}
          />
        </mesh>

        {/* Baked focus-blur overlay — crossfades in as the card recedes,
            simulating a depth-of-field far/rear blur curve without a
            real-time GPU blur pass. */}
        {blurTexture && (
          <mesh ref={blurOverlayRef} position={[0, 0, 0.012]}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={blurTexture} transparent opacity={0} depthWrite={false} />
          </mesh>
        )}

        {/* Glass highlight — a thin additive-blended plane along the top
            edge, the same "catch light" idea as the CSS version's top-edge
            gradient, standing in for a real specular clearcoat sheen. */}
        <mesh position={[0, height * 0.42, 0.016]}>
          <planeGeometry args={[width * 0.96, height * 0.16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Inner highlight — a soft, subtle diagonal sheen across the
            whole face, the "premium Apple-style glass" cue that reads as
            light grazing a curved glass surface rather than a flat photo. */}
        <mesh position={[0, 0, 0.017]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.05}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Floor reflection — a mirrored (scale.y = -1), pre-blurred,
            top-to-bottom fading copy of this card's own image, directly
            below it. Parented to the same group the card itself lives in,
            so it inherits the exact same rotation every frame — no extra
            per-frame syncing needed, it simply can't drift out of sync
            with the rotating ring. DoubleSide because the negative Y scale
            flips triangle winding, which would otherwise cull it under the
            default front-face-only rendering. */}
        {reflectionTexture && (
          <mesh ref={reflectionRef} position={[0, -height, 0.005]} scale={[1, -1, 1]}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial
              map={reflectionTexture}
              transparent
              opacity={0.16}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
