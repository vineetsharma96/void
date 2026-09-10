"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GerstnerWater } from "./GerstnerWater";
import { OceanParticles } from "./OceanParticles";

export function OceanWorld() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      // Swelling light matching main Gerstner wave cadence
      const t = state.clock.elapsedTime * 0.9;
      lightRef.current.position.y = 2.0 + Math.sin(t) * 0.8;
      lightRef.current.intensity = 2.2 + Math.sin(t * 1.3) * 0.6;
    }
  });

  return (
    <group>
      {/* 4-Octave Gerstner Wave Water Surface */}
      <GerstnerWater />

      {/* Phosphorescent Spray & Mist Particles */}
      <OceanParticles />

      {/* Atmospheric Ocean Lighting */}
      <ambientLight color="#020817" intensity={0.8} />
      <directionalLight position={[15, 20, 10]} color="#b2f5ea" intensity={1.8} />
      <pointLight ref={lightRef} position={[0, 2.5, 0]} color="#00ffcc" intensity={2.5} distance={25} />
      <pointLight position={[-12, -1.5, -8]} color="#08384d" intensity={3.0} distance={20} />
    </group>
  );
}
