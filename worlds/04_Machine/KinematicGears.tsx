"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { ProceduralStructureEngine } from "@/procedural/structures/StructureEngine";
import { ProceduralMaterials } from "@/procedural/materials/ProceduralMaterials";
import { worldEngine } from "@/engine/world/WorldEngine";
import { SpatialLabel } from "@/components/canvas/SpatialLabel";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";

export function KinematicGears() {
  const groupRef = useRef<THREE.Group>(null);
  const sunGearRef = useRef<THREE.Mesh>(null);
  const planet1Ref = useRef<THREE.Mesh>(null);
  const planet2Ref = useRef<THREE.Mesh>(null);
  const planet3Ref = useRef<THREE.Mesh>(null);
  const planet4Ref = useRef<THREE.Mesh>(null);

  const pointer = useWorldStore((s) => s.pointer);
  const machineState = useWorldStore((s) => s.machineState);
  const engageMachineGears = useWorldStore((s) => s.actions.engageMachineGears);
  const triggerShockwave = useWorldStore((s) => s.actions.triggerShockwave);

  const [gearStatus, setGearStatus] = useState<"dormant" | "aware" | "focused" | "unlocked">("dormant");

  const handleInteract = useCallback(() => {
    engageMachineGears();
    setGearStatus("unlocked");
    triggerShockwave([0, 0, 0], 2.2);
    audioEngine.triggerMachineGearEngagement();
    worldEngine.recordDiscovery("machine_gear_relay", "structure");
  }, [engageMachineGears, triggerShockwave]);

  // Register Station 1 with WorldEngine
  useEffect(() => {
    worldEngine.registerObject({
      id: "machine_gear_relay",
      name: "KINEMATIC GEAR RELAY",
      type: "machine",
      position: new THREE.Vector3(0, 0, 0),
      radius: 3.8,
      proximityThresholds: {
        aware: 8.5,
        active: 4.2,
      },
      state: "dormant",
      onAware: () => {
        setGearStatus((prev) => (prev === "unlocked" ? "unlocked" : "aware"));
      },
      onLeaveAware: () => {
        setGearStatus((prev) => (prev === "unlocked" ? "unlocked" : "dormant"));
      },
      onFocus: () => {
        setGearStatus((prev) => (prev === "unlocked" ? "unlocked" : "focused"));
      },
      onBlur: () => {
        setGearStatus((prev) => (prev === "unlocked" ? "unlocked" : "aware"));
      },
      onInteract: handleInteract,
    });

    return () => {
      worldEngine.unregisterObject("machine_gear_relay");
    };
  }, [handleInteract]);

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

  const orbitRadius = 3.3;

  useFrame((_, delta) => {
    const isEngaged = machineState.gearsEngaged || gearStatus === "unlocked";
    const isAware = gearStatus !== "dormant";

    // Speed multiplier scales up on engagement
    const baseMult = isEngaged ? 3.8 : isAware ? 1.6 : 0.8;
    const speedMultiplier = baseMult + Math.abs(pointer.x) * 1.5 + (pointer.isDown ? 2.0 : 0);
    const sunDelta = delta * 0.8 * speedMultiplier;

    if (sunGearRef.current) {
      sunGearRef.current.rotation.z += sunDelta;
    }

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

  const isEngaged = machineState.gearsEngaged || gearStatus === "unlocked";

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        handleInteract();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        worldEngine.setFocus("machine_gear_relay");
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (useWorldStore.getState().focusedObjectId === "machine_gear_relay") {
          worldEngine.setFocus(null);
        }
      }}
    >
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

      {/* In-World Spatial Label */}
      <SpatialLabel
        text="STATION 01 // KINEMATIC RELAY"
        subtext={isEngaged ? "TORQUE COUPLED // 100%" : "CLICK TO ENGAGE TORQUE"}
        position={[0, 4.4, 0]}
        color={isEngaged ? "#e5a93c" : "#28f0dc"}
        distanceFade={[2.0, 16.0]}
      />
    </group>
  );
}
