"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { ProceduralParticleEngine } from "@/procedural/particles/ParticleEngine";

export function MachineParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useWorldStore((s) => s.quality);
  const pointer = useWorldStore((s) => s.pointer);
  const seed = useWorldStore((s) => s.seed);

  const particleCount = quality === "ultra" ? 8000 : 4000;

  const geometry = useMemo(() => {
    return ProceduralParticleEngine.createParticleBuffer(particleCount, 8, 8);
  }, [particleCount]);

  const material = useMemo(() => {
    return ProceduralParticleEngine.createMaterial({
      behavior: "vortex",
      colorCore: "#e5a93c", // Amber plasma
      colorEdge: "#ff5500", // Hot exhaust spark
      speed: 1.4,
      seed: seed + 773,
    });
  }, [seed]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    if (mat.uniforms) {
      mat.uniforms.uTime.value += delta;
      mat.uniforms.uPointer.value.set(pointer.x * 6, pointer.y * 5, 0);
      mat.uniforms.uPointerDown.value = pointer.isDown ? 1 : 0;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
