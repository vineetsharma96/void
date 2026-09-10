"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { ProceduralStructureEngine } from "@/procedural/structures/StructureEngine";
import { ProceduralMaterials } from "@/procedural/materials/ProceduralMaterials";

export function KinematicGears() {
  const groupRef = useRef<THREE.Group>(null);
  const sunGearRef = useRef<THREE.Mesh>(null);
  const planet1Ref = useRef<THREE.Mesh>(null);
  const planet2Ref = useRef<THREE.Mesh>(null);
  const planet3Ref = useRef<THREE.Mesh>(null);
  const planet4Ref = useRef<THREE.Mesh>(null);
  const pointer = useWorldStore((s) => s.pointer);

  // Procedural gear geometries: Sun gear (24 teeth), Planet gears (12 teeth)
  const sunGearGeom = useMemo(
    () => ProceduralStructureEngine.generateGear({ radius: 2.2, teeth: 24, thickness: 0.35, holeRadius: 0.7 }),
    []
  );

  const planetGearGeom = useMemo(
    () => ProceduralStructureEngine.generateGear({ radius: 1.1, teeth: 12, thickness: 0.3, holeRadius: 0.35 }),
    []
  );

  const gearMaterial = useMemo(
    () => ProceduralMaterials.createTitaniumSlateMaterial("#12161f", "#e5a93c"),
    []
  );

  const orbitRadius = 3.3; // Distance from sun center to planet centers

  useFrame((_, delta) => {
    // Dynamic gear ratio driven by time and cursor interaction
    const speedMultiplier = 1.0 + Math.abs(pointer.x) * 2.5 + (pointer.isDown ? 3.0 : 0);
    const sunDelta = delta * 0.8 * speedMultiplier;

    if (sunGearRef.current) {
      sunGearRef.current.rotation.z += sunDelta;
    }

    // Planetary gears rotate inversely at 2:1 ratio (24 teeth / 12 teeth = 2)
    const planetDelta = -sunDelta * 2.0;

    if (planet1Ref.current) planet1Ref.current.rotation.z += planetDelta;
    if (planet2Ref.current) planet2Ref.current.rotation.z += planetDelta;
    if (planet3Ref.current) planet3Ref.current.rotation.z += planetDelta;
    if (planet4Ref.current) planet4Ref.current.rotation.z += planetDelta;

    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pointer.y * 0.35, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, pointer.x * 0.35, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Central Sun Gear */}
      <mesh ref={sunGearRef} geometry={sunGearGeom} material={gearMaterial} />

      {/* 4 Interlocking Planetary Gears */}
      <mesh
        ref={planet1Ref}
        geometry={planetGearGeom}
        material={gearMaterial}
        position={[orbitRadius, 0, 0.02]}
      />
      <mesh
        ref={planet2Ref}
        geometry={planetGearGeom}
        material={gearMaterial}
        position={[-orbitRadius, 0, 0.02]}
      />
      <mesh
        ref={planet3Ref}
        geometry={planetGearGeom}
        material={gearMaterial}
        position={[0, orbitRadius, 0.02]}
      />
      <mesh
        ref={planet4Ref}
        geometry={planetGearGeom}
        material={gearMaterial}
        position={[0, -orbitRadius, 0.02]}
      />
    </group>
  );
}
