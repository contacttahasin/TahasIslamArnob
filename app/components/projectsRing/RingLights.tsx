"use client";

type RingLightsProps = {
  accentHex: string;
  accentLightHex: string;
  radius: number;
  lowPower?: boolean;
};

/**
 * Manual light rig — no drei <Environment>. This codebase has repeatedly
 * found Environment (and Sparkles, MeshTransmissionMaterial, and any
 * @react-three/postprocessing pass) to silently black out the canvas in
 * this rendering environment (see CarLights.tsx, ThreeBackgroundCanvas.tsx,
 * MoonCanvas.tsx) — so "realistic environment lighting" here means the same
 * proven combination of ambient + hemisphere + directional + accent point
 * lights those components already ship successfully, scaled to the ring's
 * radius instead of a car-sized rig.
 */
export default function RingLights({ accentHex, accentLightHex, radius, lowPower = false }: RingLightsProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight args={["#ffffff", "#05060a", 0.35]} />

      {/* Key light — soft shadows via a fairly large shadow-camera frustum
          sized to the ring, and a large shadow map for soft-edged blur. */}
      <directionalLight
        position={[radius * 0.6, radius * 1.4, radius * 1.1]}
        intensity={2.4}
        color="#fff6e8"
        castShadow={!lowPower}
        shadow-mapSize-width={lowPower ? 512 : 1536}
        shadow-mapSize-height={lowPower ? 512 : 1536}
        shadow-camera-left={-radius * 1.6}
        shadow-camera-right={radius * 1.6}
        shadow-camera-top={radius * 1.6}
        shadow-camera-bottom={-radius * 1.6}
        shadow-camera-far={radius * 6}
        shadow-bias={-0.0015}
        shadow-radius={lowPower ? 1 : 6}
      />

      {/* Neutral, desaturated cool fill — enough to keep the shadow side of
          each card from going flat black, without introducing a
          conspicuous blue that would clash with the site's gold theme. */}
      <directionalLight position={[-radius * 0.8, radius * 0.5, -radius]} intensity={0.22} color="#8b8f96" />

      {/* Theme-accent rim lights orbiting the ring — the "volumetric" glow
          the cards catch as they rotate through, re-coloring automatically
          with the site's theme picker. Multipliers are divided down from
          their original tuning to compensate for the ring's larger radius
          (intensity scales with radius here) — otherwise the glow would
          brighten right along with the size increase and start reading as
          harsh instead of staying at the same premium, subtle level. */}
      <pointLight position={[radius * 1.3, radius * 0.3, radius * 0.4]} intensity={radius * 2.3} color={accentHex} distance={radius * 4} decay={2} />
      <pointLight position={[-radius * 1.3, radius * 0.2, -radius * 0.4]} intensity={radius * 1.7} color={accentLightHex} distance={radius * 4} decay={2} />
      <pointLight position={[0, radius * 0.15, radius * 1.4]} intensity={radius * 2.0} color={accentHex} distance={radius * 4} decay={2} />
      <pointLight position={[0, -radius * 0.4, 0]} intensity={radius * 1.1} color={accentHex} distance={radius * 3} decay={2} />
    </>
  );
}
