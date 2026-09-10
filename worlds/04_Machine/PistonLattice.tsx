"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";

export function PistonLattice() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const pointer = useWorldStore((s) => s.pointer);

  const pistonCount = 16;
  const radius = 5.4;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pistonGeom = useMemo(() => new THREE.CylinderGeometry(0.2, 0.24, 2.5, 8), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.elapsedTime * 2.0;
    const speedBoost = 1.0 + Math.abs(pointer.x) * 2.0;

    for (let i = 0; i < pistonCount; i++) {
      const angle = (i / pistonCount) * Math.PI * 2;
      const phase = (i * Math.PI * 2) / 4; // Quadrature firing pattern

      // Reciprocating stroke
      const stroke = Math.sin(t * speedBoost + phase) * 0.9;

      dummy.position.set(
        Math.cos(angle) * (radius + stroke * 0.3),
        Math.sin(angle) * (radius + stroke * 0.3),
        stroke
      );

      // Point piston toward central drive axis
      dummy.rotation.z = angle + Math.PI / 2;
      dummy.rotation.x = stroke * 0.15;
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[pistonGeom, undefined, pistonCount]}>
      <meshStandardMaterial
        color="#1f2532"
        metalness={0.92}
        roughness={0.25}
      />
    </instancedMesh>
  );
}
