"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ProceduralStructureEngine } from "@/procedural/structures/StructureEngine";

export function MachineLattice() {
  const outerRingRef = useRef<THREE.Group>(null);
  const counterRingRef = useRef<THREE.Group>(null);

  // Procedural Portal Rings
  const portalData = useMemo(() => {
    return ProceduralStructureEngine.generatePortal({
      radius: 6.8,
      tubeRadius: 0.22,
      strutCount: 8,
    });
  }, []);

  // Monumental support pylons
  const pylonGeom = useMemo(() => {
    return ProceduralStructureEngine.generateMonolithTower({
      height: 14.0,
      baseWidth: 1.8,
      topWidth: 0.9,
      tiers: 4,
    });
  }, []);

  useFrame((_, delta) => {
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.15;
    }
    if (counterRingRef.current) {
      counterRingRef.current.rotation.z -= delta * 0.22;
    }
  });

  return (
    <group>
      {/* Front Outer Rotating Ring Conduit */}
      <group ref={outerRingRef} position={[0, 0, -1.0]}>
        <mesh geometry={portalData.ringGeometry}>
          <meshStandardMaterial color="#171d26" metalness={0.9} roughness={0.3} />
        </mesh>
        {portalData.strutGeometries.map((strut, i) => (
          <mesh key={i} geometry={strut}>
            <meshStandardMaterial color="#e5a93c" metalness={0.8} roughness={0.2} emissive="#e5a93c" emissiveIntensity={0.2} />
          </mesh>
        ))}
      </group>

      {/* Rear Counter-Rotating Ring Conduit */}
      <group ref={counterRingRef} position={[0, 0, 1.0]}>
        <mesh geometry={portalData.ringGeometry}>
          <meshStandardMaterial color="#111620" metalness={0.95} roughness={0.25} />
        </mesh>
      </group>

      {/* Dual Flanking Monumental Pylons */}
      <mesh geometry={pylonGeom} position={[-8.5, -6.0, 0]}>
        <meshStandardMaterial color="#1a202c" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh geometry={pylonGeom} position={[8.5, -6.0, 0]}>
        <meshStandardMaterial color="#1a202c" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  );
}
