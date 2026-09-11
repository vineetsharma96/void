"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GeodesicCore } from "./GeodesicCore";
import { OrbitalRings } from "./OrbitalRings";
import { OriginParticles } from "./OriginParticles";
import { WorldPortal } from "@/components/canvas/WorldPortal";

export function OriginWorld() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group>
      {/* Central Monumental Procedural Core */}
      <GeodesicCore />

      {/* Gyroscopic Precession Rings */}
      <OrbitalRings />

      {/* 25,000+ Procedural Particles */}
      <OriginParticles />

      {/* Spatial Inter-World Portal to Realm 02 (Forest) */}
      <WorldPortal
        id="portal_origin_to_forest"
        name="VERDANT RIFT"
        targetRealm="forest"
        position={[6.5, 0.2, -4.5]}
        color="#38ef7d"
      />

      {/* Atmospheric Concentric Distance Rings */}
      <group ref={gridRef} position={[0, -2.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[4, 6.5, 9, 12, 16].map((radius, idx) => (
          <mesh key={idx}>
            <ringGeometry args={[radius - 0.015, radius, 96]} />
            <meshBasicMaterial
              color="#3a4150"
              transparent
              opacity={0.18 - idx * 0.03}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Dynamic Environmental Lights */}
      <pointLight position={[0, 0, 0]} color="#e5a93c" intensity={2.5} distance={15} />
      <directionalLight position={[8, 12, 10]} color="#c8f0ee" intensity={1.2} />
      <ambientLight color="#080c14" intensity={0.6} />
    </group>
  );
}
