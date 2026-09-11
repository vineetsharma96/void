"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KinematicGears } from "./KinematicGears";
import { PistonLattice } from "./PistonLattice";
import { MachineLattice } from "./MachineLattice";
import { MachineParticles } from "./MachineParticles";
import { WorldPortal } from "@/components/canvas/WorldPortal";
import { EnergyConduit } from "@/components/canvas/EnergyConduit";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { worldEngine } from "@/engine/world/WorldEngine";

export function MachineWorld() {
  const coreLightRef = useRef<THREE.PointLight>(null);
  const surgeLightRef = useRef<THREE.PointLight>(null);
  const portalLightRef = useRef<THREE.PointLight>(null);
  const foundationDeckRef = useRef<THREE.Group>(null);

  const machineState = useWorldStore((s) => s.machineState);

  // Record gateway discovery once all 3 mechanical stages are energized
  useEffect(() => {
    if (machineState.capacitorEngaged) {
      worldEngine.recordDiscovery("portal_machine_to_void", "structure");
    }
  }, [machineState.capacitorEngaged]);

  // Procedural Industrial Brutalist Deck Foundation
  const strutGeometries = useMemo(() => {
    const struts: THREE.BufferGeometry[] = [];
    const strutCount = 8;
    for (let i = 0; i < strutCount; i++) {
      const geom = new THREE.BoxGeometry(0.35, 0.5, 11.5);
      const angle = (i / strutCount) * Math.PI;
      geom.rotateY(angle);
      geom.translate(0, -6.3, 0);
      struts.push(geom);
    }
    return struts;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime * 4.0;
    const powerLevel = machineState.capacitorEngaged
      ? 2.6
      : machineState.pistonsEngaged
      ? 1.7
      : machineState.gearsEngaged
      ? 1.3
      : 1.0;

    if (coreLightRef.current) {
      coreLightRef.current.intensity = (2.8 + Math.sin(t) * 0.9) * powerLevel;
      coreLightRef.current.color.set(
        machineState.capacitorEngaged ? "#28f0dc" : "#e5a93c"
      );
    }

    if (surgeLightRef.current) {
      const targetSurgeIntensity = machineState.capacitorEngaged
        ? 2.8
        : machineState.pistonsEngaged
        ? 1.2
        : 0.4;
      surgeLightRef.current.intensity = THREE.MathUtils.lerp(
        surgeLightRef.current.intensity,
        targetSurgeIntensity,
        delta * 3.0
      );
      surgeLightRef.current.color.set(
        machineState.capacitorEngaged ? "#28f0dc" : "#e5a93c"
      );
    }

    if (portalLightRef.current) {
      const targetIntensity = machineState.capacitorEngaged ? 4.5 : 0.0;
      portalLightRef.current.intensity = THREE.MathUtils.lerp(
        portalLightRef.current.intensity,
        targetIntensity,
        delta * 3.0
      );
    }

    // Subtle foundation vibration when machinery operates
    if (foundationDeckRef.current) {
      foundationDeckRef.current.rotation.y +=
        delta * (machineState.capacitorEngaged ? 0.008 : 0.002);
    }
  });

  return (
    <group>
      {/* Central Synchronized Planetary Gear Train (Station 1) */}
      <KinematicGears />

      {/* Reciprocating Hydraulic Piston Array (Station 2) */}
      <PistonLattice />

      {/* Outer Monolithic Pylons and Flux Capacitor (Station 3) */}
      <MachineLattice />

      {/* Procedural High-Voltage Energy Conduits */}
      {/* Station 1 (Gears) -> Station 2 (Pistons Manifold Intake) */}
      <EnergyConduit
        start={[0, 0, 0]}
        end={[0, -5.0, 0]}
        midpointOffset={[0, -2.5, 0.8]}
        color="#e5a93c"
        active={machineState.gearsEngaged}
      />
      {/* Station 2 (Pistons) -> Station 3 Right Pylon */}
      <EnergyConduit
        start={[0, -5.0, 0]}
        end={[8.5, -2.5, 0]}
        midpointOffset={[4.2, -4.0, 1.2]}
        color="#e5a93c"
        active={machineState.pistonsEngaged}
      />
      {/* Station 2 (Pistons) -> Station 3 Left Pylon */}
      <EnergyConduit
        start={[0, -5.0, 0]}
        end={[-8.5, -2.5, 0]}
        midpointOffset={[-4.2, -4.0, 1.2]}
        color="#e5a93c"
        active={machineState.pistonsEngaged}
      />
      {/* Station 3 Right Pylon -> Station 4 Void Portal */}
      <EnergyConduit
        start={[8.5, -2.5, 0]}
        end={[0, 0.5, 6.8]}
        midpointOffset={[4.5, -0.5, 3.8]}
        color="#28f0dc"
        active={machineState.capacitorEngaged}
      />
      {/* Station 3 Left Pylon -> Station 4 Void Portal */}
      <EnergyConduit
        start={[-8.5, -2.5, 0]}
        end={[0, 0.5, 6.8]}
        midpointOffset={[-4.5, -0.5, 3.8]}
        color="#28f0dc"
        active={machineState.capacitorEngaged}
      />

      {/* High-Velocity Mechanical Plasma Sparks */}
      <MachineParticles />

      {/* Gateway Portal to Realm 05: VOID (Station 4) */}
      <WorldPortal
        id="portal_machine_to_void"
        name="VOID CONDUIT"
        targetRealm="void"
        position={[0, 0.5, 6.8]}
        color={machineState.capacitorEngaged ? "#28f0dc" : "#e5a93c"}
        locked={!machineState.capacitorEngaged}
        lockedSubtext="LOCKED // DISCHARGE STAGE 03 FIRST"
      />

      {/* Procedural Heavy Industrial Platform Deck */}
      <group ref={foundationDeckRef} position={[0, 0, 0]}>
        {/* Main Circular Brutalist Foundation Slab */}
        <mesh position={[0, -6.5, 0]}>
          <cylinderGeometry args={[12.2, 12.6, 0.5, 64]} />
          <meshStandardMaterial
            color="#0e131b"
            metalness={0.88}
            roughness={0.4}
          />
        </mesh>

        {/* Concentric Machine Rail Rings */}
        {[5.4, 8.5, 11.2].map((r, idx) => (
          <mesh key={idx} position={[0, -6.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r - 0.08, r + 0.08, 64]} />
            <meshStandardMaterial
              color="#1c2432"
              emissive={
                machineState.capacitorEngaged
                  ? "#28f0dc"
                  : machineState.pistonsEngaged
                  ? "#e5a93c"
                  : "#121824"
              }
              emissiveIntensity={
                machineState.capacitorEngaged ? 0.8 : machineState.pistonsEngaged ? 0.35 : 0.05
              }
              metalness={0.92}
              roughness={0.25}
            />
          </mesh>
        ))}

        {/* Radial Support Truss Struts */}
        {strutGeometries.map((geom, idx) => (
          <mesh key={idx} geometry={geom}>
            <meshStandardMaterial
              color="#141a24"
              metalness={0.8}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* High-Contrast Brutalist Machine Lighting */}
      <ambientLight color="#080c14" intensity={0.7} />
      <directionalLight position={[10, 20, 15]} color="#c8f0ee" intensity={1.5} />
      <directionalLight position={[-15, -10, -10]} color="#1e2638" intensity={1.0} />
      <pointLight ref={coreLightRef} position={[0, 0, 0.5]} color="#e5a93c" intensity={3.0} distance={18} />
      <pointLight ref={surgeLightRef} position={[0, -4, 2]} color="#e5a93c" intensity={0.4} distance={14} />
      <pointLight ref={portalLightRef} position={[0, 0.5, 7.2]} color="#28f0dc" intensity={0} distance={16} />
    </group>
  );
}
