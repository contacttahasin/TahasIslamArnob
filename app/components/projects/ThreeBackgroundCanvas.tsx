"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

/**
 * Deliberately simple: a slow-spinning wireframe icosahedron with basic
 * materials only. This is a decorative background behind the Projects
 * hero, not the interactive focal piece (that's About's ThreeScene), so
 * it avoids MeshTransmissionMaterial/Environment/Sparkles entirely —
 * those were tested and found to silently black out the canvas in this
 * environment (see ThreeSceneCanvas.tsx). Plain wireframe geometry has no
 * such dependency and renders reliably.
 */
function WireframeKnot() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.x += delta * 0.08;
    mesh.rotation.y += delta * 0.12;
  });

  return (
    <mesh ref={meshRef} scale={2.4}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color="#978F66" wireframe transparent opacity={0.35} />
    </mesh>
  );
}

export default function ThreeBackgroundCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <WireframeKnot />
    </Canvas>
  );
}
