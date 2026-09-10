"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { oceanVertexShader, oceanFragmentShader } from "@/shaders/ocean/ocean.glsl";

export function GerstnerWater() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const quality = useWorldStore((s) => s.quality);
  const pointer = useWorldStore((s) => s.pointer);
  const seed = useWorldStore((s) => s.seed);

  const { width, depth, segments } = useMemo(() => {
    switch (quality) {
      case "ultra": return { width: 55, depth: 55, segments: 160 };
      case "high": return { width: 48, depth: 48, segments: 120 };
      case "medium": return { width: 42, depth: 42, segments: 80 };
      default: return { width: 36, depth: 36, segments: 50 };
    }
  }, [quality]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector3() },
      uPointerDown: { value: 0 },
      uSeed: { value: seed },
      uColorDeep: { value: new THREE.Color("#020712") },
      uColorShallow: { value: new THREE.Color("#08384d") },
      uColorCrest: { value: new THREE.Color("#00ffcc") },
      uColorFoam: { value: new THREE.Color("#e8faf8") },
    }),
    [seed]
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
    materialRef.current.uniforms.uSeed.value = seed;
    materialRef.current.uniforms.uPointer.value.set(pointer.x * 12, 0, -pointer.y * 12);
    materialRef.current.uniforms.uPointerDown.value = pointer.isDown ? 1 : 0;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[width, depth, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        transparent={true}
        wireframe={false}
      />
    </mesh>
  );
}
