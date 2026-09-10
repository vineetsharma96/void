"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { ProceduralParticleEngine } from "@/procedural/particles/ParticleEngine";

export function OceanParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useWorldStore((s) => s.quality);
  const pointer = useWorldStore((s) => s.pointer);
  const seed = useWorldStore((s) => s.seed);

  const particleCount = quality === "ultra" ? 10000 : 5000;

  const geometry = useMemo(() => {
    return ProceduralParticleEngine.createParticleBuffer(particleCount, 22, 6);
  }, [particleCount]);

  const material = useMemo(() => {
    return ProceduralParticleEngine.createMaterial({
      behavior: "curl",
      colorCore: "#00ffcc", // Bio-luminescent plankton turquoise
      colorEdge: "#c8f0ee", // Spray white
      speed: 0.85,
      seed: seed + 331,
    });
  }, [seed]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    if (mat.uniforms) {
      mat.uniforms.uTime.value += delta;
      mat.uniforms.uPointer.value.set(pointer.x * 14, 0.5 + pointer.y * 6, 0);
      mat.uniforms.uPointerDown.value = pointer.isDown ? 1 : 0;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} position={[0, 0.2, 0]} />;
}
