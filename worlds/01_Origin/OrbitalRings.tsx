"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";

export function OrbitalRings() {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const pointer = useWorldStore((s) => s.pointer);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Precession influenced by pointer
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pointer.y * 0.4, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, pointer.x * 0.4, 0.05);

    // Multi-axis counter-rotations
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.25;
      ring1Ref.current.rotation.x += delta * 0.12;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.32;
      ring2Ref.current.rotation.z += delta * 0.15;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += delta * 0.28;
      ring3Ref.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Primary Equatorial Ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[3.4, 0.022, 16, 120]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.65} />
      </mesh>

      {/* Secondary Tilted Precession Ring */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <torusGeometry args={[4.1, 0.018, 16, 140]} />
        <meshBasicMaterial color="#e5a93c" transparent opacity={0.5} />
      </mesh>

      {/* Outer Polar Gyroscope Ring */}
      <mesh ref={ring3Ref} rotation={[0, Math.PI / 2.5, Math.PI / 6]}>
        <torusGeometry args={[4.8, 0.015, 16, 160]} />
        <meshBasicMaterial color="#c8f0ee" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
