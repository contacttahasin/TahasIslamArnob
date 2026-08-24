"use client";

import { useMemo } from "react";
import * as THREE from "three";

type RingFloorProps = {
  accentHex: string;
  radius: number;
  y: number;
};

/** Soft radial falloff, used as an alpha map for the contact-shadow disc —
 * identical technique to CarFloor.tsx's useRadialAlphaTexture. */
function useRadialAlphaTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(0,0,0,0.6)");
    gradient.addColorStop(0.55, "rgba(0,0,0,0.28)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

/**
 * Glossy dark floor that reads as reflective through specular highlights
 * (high metalness / low roughness) rather than a true planar mirror — the
 * same reasoning as CarFloor.tsx: drei's MeshReflectorMaterial is in the
 * category of material that has been found to black out the canvas in this
 * environment, so this fakes the "premium showroom floor" read with a
 * proven-safe standard material plus a soft contact shadow and an
 * accent-tinted glow ring underneath the cards.
 *
 * A true mirrored reflection of the ring is instead handled outside
 * Three.js entirely — the DOM wrapper around this <Canvas> applies a CSS
 * `-webkit-box-reflect`, which mirrors the actual rendered canvas pixels
 * (ring, lighting and all) with zero WebGL risk.
 */
export default function RingFloor({ accentHex, radius, y }: RingFloorProps) {
  const shadowAlpha = useRadialAlphaTexture();

  return (
    <group position={[0, y, 0]}>
      {/* Deliberately finite, not filling the whole frame — a floor edge
          visible within the frustum reads as a real showroom surface, and
          leaves genuine empty space below the ring for the DOM-level
          WebkitBoxReflect (see ProjectsRing.tsx) to mirror actual card
          pixels into, rather than mirroring floor-onto-floor invisibly. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius * 1.7, 64]} />
        <meshStandardMaterial color="#05060a" metalness={0.9} roughness={0.12} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[radius * 0.55, radius * 0.62, 64]} />
        <meshBasicMaterial color={accentHex} transparent opacity={0.34} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[radius * 1.6, radius * 1.6]} />
        <meshBasicMaterial map={shadowAlpha} transparent opacity={0.65} depthWrite={false} />
      </mesh>
    </group>
  );
}
