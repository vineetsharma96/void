"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SingularityField } from "./SingularityField";
import { VoidParticles } from "./VoidParticles";

export function VoidWorld() {
  const pulseLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (pulseLightRef.current) {
      // Infrasonic quantum pulse
      const t = state.clock.elapsedTime * 0.8;
      pulseLightRef.current.intensity = 2.0 + Math.sin(t) * 0.8;
    }
  });

  return (
    <group>
      {/* Central Black Hole Singularity & Accretion Disk */}
      <SingularityField />

      {/* 30,000+ Quantum Particles Spatially Converging */}
      <VoidParticles />

      {/* Relativistic Lighting */}
      <ambientLight color="#020306" intensity={0.4} />
      <pointLight
        ref={pulseLightRef}
        position={[0, 0, 0]}
        color="#e5a93c"
        intensity={2.2}
        distance={30}
      />
      <directionalLight position={[0, 15, 10]} color="#c8f0ee" intensity={1.2} />
    </group>
  );
}
