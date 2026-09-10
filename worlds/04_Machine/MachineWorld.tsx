"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KinematicGears } from "./KinematicGears";
import { PistonLattice } from "./PistonLattice";
import { MachineLattice } from "./MachineLattice";
import { MachineParticles } from "./MachineParticles";

export function MachineWorld() {
  const coreLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (coreLightRef.current) {
      // Dynamic mechanical pulse
      const t = state.clock.elapsedTime * 4.0;
      coreLightRef.current.intensity = 2.8 + Math.sin(t) * 0.9;
    }
  });

  return (
    <group>
      {/* Central Synchronized Planetary Gear Train */}
      <KinematicGears />

      {/* Reciprocating Hydraulic Piston Array */}
      <PistonLattice />

      {/* Outer Monolithic Pylons and Portal Conduits */}
      <MachineLattice />

      {/* High-Velocity Mechanical Plasma Sparks */}
      <MachineParticles />

      {/* High-Contrast Brutalist Machine Lighting */}
      <ambientLight color="#080c14" intensity={0.7} />
      <directionalLight position={[10, 20, 15]} color="#c8f0ee" intensity={1.5} />
      <directionalLight position={[-15, -10, -10]} color="#1e2638" intensity={1.0} />
      <pointLight ref={coreLightRef} position={[0, 0, 0.5]} color="#e5a93c" intensity={3.0} distance={18} />
      <pointLight position={[0, -4, 2]} color="#ff4400" intensity={2.2} distance={12} />
    </group>
  );
}
