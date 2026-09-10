"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { ProceduralParticleEngine } from "@/procedural/particles/ParticleEngine";

export function VoidParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useWorldStore((s) => s.quality);
  const pointer = useWorldStore((s) => s.pointer);
  const seed = useWorldStore((s) => s.seed);

  const particleCount = useMemo(() => {
    switch (quality) {
      case "ultra": return 55000;
      case "high": return 32000;
      case "medium": return 16000;
      default: return 8000;
    }
  }, [quality]);

  const geometry = useMemo(() => {
    return ProceduralParticleEngine.createParticleBuffer(particleCount, 26, 16);
  }, [particleCount]);

  const material = useMemo(() => {
    return ProceduralParticleEngine.createMaterial({
      behavior: "convergence",
      colorCore: "#e5a93c", // Gravitational amber
      colorEdge: "#c8f0ee", // Event horizon quantum ion
      speed: 0.6,
      seed: seed + 991,
    });
  }, [seed]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    if (mat.uniforms) {
      mat.uniforms.uTime.value += delta;
      mat.uniforms.uPointer.value.set(pointer.x * 6, pointer.y * 4, 0);
      mat.uniforms.uPointerDown.value = pointer.isDown ? 1 : 0;
    }

    // Slow relativistic rotation of the entire particle universe
    pointsRef.current.rotation.y += delta * 0.04;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
