"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Mesh } from "three";
import { generateMoonTextures } from "./moonTexture";
import { seededRandom } from "@/lib/utils";

const NORMAL_SCALE = new THREE.Vector2(1.8, 1.8);

/**
 * Plain meshStandardMaterial only — no drei Environment/Sparkles/
 * MeshTransmissionMaterial. Those were found elsewhere in this codebase
 * to silently black out the canvas in this environment (see
 * ThreeBackgroundCanvas.tsx), so this scene avoids them entirely.
 */
function useMoonTextures(lowPower: boolean) {
  return useMemo(() => {
    const size = lowPower ? { width: 512, height: 256 } : { width: 1024, height: 512 };
    const { surface, roughness, normal } = generateMoonTextures(size);

    const surfaceTexture = new THREE.CanvasTexture(surface);
    surfaceTexture.colorSpace = THREE.SRGBColorSpace;
    surfaceTexture.wrapS = THREE.RepeatWrapping;
    surfaceTexture.needsUpdate = true;

    // Roughness/normal maps carry geometric/physical data, not color, so
    // they must stay in linear space — tagging them sRGB would wash out
    // the per-pixel shine/relief they're meant to encode.
    const roughnessTexture = new THREE.CanvasTexture(roughness);
    roughnessTexture.wrapS = THREE.RepeatWrapping;
    roughnessTexture.needsUpdate = true;

    const normalTexture = new THREE.CanvasTexture(normal);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.needsUpdate = true;

    return { surfaceTexture, roughnessTexture, normalTexture };
  }, [lowPower]);
}

function Starfield() {
  const positions = useMemo(() => {
    const count = 700;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 22 + seededRandom(i * 3 + 1) * 30;
      const theta = seededRandom(i * 3 + 2) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(i * 3 + 3) - 1);
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d9b26f" size={0.045} sizeAttenuation transparent opacity={0.55} />
    </points>
  );
}

/** A thin, faint silver rim — not an atmosphere (the Moon has none), just
 * enough grazing-angle light to keep the limb from vanishing into the
 * black background behind it. */
function RimLight() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color("#cbd0d8") },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.52 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
            gl_FragColor = vec4(glowColor, clamp(intensity, 0.0, 1.0) * 0.35);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  return (
    <mesh scale={1.03} material={material}>
      <sphereGeometry args={[1, 48, 48]} />
    </mesh>
  );
}

function Globe({ lowPower }: { lowPower: boolean }) {
  const moonRef = useRef<Mesh>(null);
  const { surfaceTexture, roughnessTexture, normalTexture } = useMoonTextures(lowPower);
  const segments = lowPower ? 48 : 96;

  useFrame((_, delta) => {
    if (moonRef.current) moonRef.current.rotation.y += delta * 0.05;
  });

  return (
    <group rotation={[0.28, 0, 0]}>
      <mesh ref={moonRef}>
        <sphereGeometry args={[1, segments, segments]} />
        <meshPhysicalMaterial
          map={surfaceTexture}
          roughnessMap={roughnessTexture}
          normalMap={normalTexture}
          normalScale={NORMAL_SCALE}
          roughness={1}
          metalness={0.02}
          clearcoat={0.45}
          clearcoatRoughness={0.28}
        />
      </mesh>

      <RimLight />
    </group>
  );
}

export default function MoonCanvas({ lowPower = false }: { lowPower?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, lowPower ? 1 : 1.75]}
    >
      <ambientLight intensity={0.1} />
      <directionalLight position={[4, 1.5, 4]} intensity={2.8} color="#fff8ec" />
      <directionalLight position={[-3, -1, -4]} intensity={0.18} color="#8fa4c9" />

      <Starfield />
      <Globe lowPower={lowPower} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.4}
        minPolarAngle={Math.PI / 2 - 0.7}
        maxPolarAngle={Math.PI / 2 + 0.7}
      />
    </Canvas>
  );
}
