"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { worldEngine } from "@/engine/world/WorldEngine";
import { SpatialLabel } from "@/components/canvas/SpatialLabel";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";

export function PistonLattice() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const sleeveMeshRef = useRef<THREE.InstancedMesh>(null);
  const feedMeshRef = useRef<THREE.InstancedMesh>(null);
  const ventMeshRef = useRef<THREE.InstancedMesh>(null);
  const manifoldRef = useRef<THREE.Mesh>(null);
  const gaugeNeedleRef = useRef<THREE.Mesh>(null);
  const lockAlertRef = useRef<number>(0);

  const pointer = useWorldStore((s) => s.pointer);
  const machineState = useWorldStore((s) => s.machineState);
  const engageMachinePistons = useWorldStore((s) => s.actions.engageMachinePistons);
  const triggerShockwave = useWorldStore((s) => s.actions.triggerShockwave);

  const [pistonStatus, setPistonStatus] = useState<"dormant" | "aware" | "focused" | "unlocked">("dormant");

  const pistonCount = 16;
  const radius = 5.4;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const sleeveDummy = useMemo(() => new THREE.Object3D(), []);
  const feedDummy = useMemo(() => new THREE.Object3D(), []);
  const ventDummy = useMemo(() => new THREE.Object3D(), []);

  // Moving piston rod geometry
  const pistonGeom = useMemo(() => new THREE.CylinderGeometry(0.15, 0.17, 2.7, 12), []);
  // Outer stationary hydraulic sleeve cylinder
  const sleeveGeom = useMemo(() => new THREE.CylinderGeometry(0.26, 0.28, 2.0, 12), []);
  // Radial fluid feed lines linking manifold to sleeves
  const feedGeom = useMemo(() => new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), []);
  // Steam exhaust flare ring
  const ventGeom = useMemo(() => new THREE.TorusGeometry(0.22, 0.03, 8, 16), []);

  const handleInteract = useCallback(() => {
    const gearsReady = useWorldStore.getState().machineState.gearsEngaged;
    if (!gearsReady) {
      lockAlertRef.current = 1.0;
      audioEngine.triggerClickFoley();
      return;
    }

    engageMachinePistons();
    setPistonStatus("unlocked");
    triggerShockwave([0, -radius * 0.7, 0], 2.6);
    audioEngine.triggerPistonPressureSurge();
    worldEngine.recordDiscovery("machine_piston_array", "structure");
  }, [engageMachinePistons, radius, triggerShockwave]);

  // Register Station 2 with WorldEngine
  useEffect(() => {
    worldEngine.registerObject({
      id: "machine_piston_array",
      name: "HYDRAULIC PISTON ARRAY",
      type: "machine",
      position: new THREE.Vector3(0, -radius * 0.6, 0),
      radius: 5.5,
      proximityThresholds: {
        aware: 10.0,
        active: 5.5,
      },
      state: "dormant",
      onAware: () => {
        setPistonStatus((prev) => (prev === "unlocked" ? "unlocked" : "aware"));
      },
      onLeaveAware: () => {
        setPistonStatus((prev) => (prev === "unlocked" ? "unlocked" : "dormant"));
      },
      onFocus: () => {
        setPistonStatus((prev) => (prev === "unlocked" ? "unlocked" : "focused"));
      },
      onBlur: () => {
        setPistonStatus((prev) => (prev === "unlocked" ? "unlocked" : "aware"));
      },
      onInteract: handleInteract,
    });

    return () => {
      worldEngine.unregisterObject("machine_piston_array");
    };
  }, [handleInteract, radius]);

  // Initial placement of stationary cylinder sleeves and feed pipes
  useEffect(() => {
    if (!sleeveMeshRef.current || !feedMeshRef.current) return;

    for (let i = 0; i < pistonCount; i++) {
      const angle = (i / pistonCount) * Math.PI * 2;
      
      // Stationary sleeves
      sleeveDummy.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
      sleeveDummy.rotation.z = angle + Math.PI / 2;
      sleeveDummy.updateMatrix();
      sleeveMeshRef.current.setMatrixAt(i, sleeveDummy.matrix);

      // Feeder pipes extending inward to inner manifold
      feedDummy.position.set(
        Math.cos(angle) * (radius - 0.9),
        Math.sin(angle) * (radius - 0.9),
        0
      );
      feedDummy.rotation.z = angle + Math.PI / 2;
      feedDummy.updateMatrix();
      feedMeshRef.current.setMatrixAt(i, feedDummy.matrix);
    }
    sleeveMeshRef.current.instanceMatrix.needsUpdate = true;
    feedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [pistonCount, radius, sleeveDummy, feedDummy]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const isEngaged = machineState.pistonsEngaged || pistonStatus === "unlocked";
    const isGearsActive = machineState.gearsEngaged;
    const isAware = pistonStatus !== "dormant";

    // Decay lock alert flash
    if (lockAlertRef.current > 0) {
      lockAlertRef.current = Math.max(0, lockAlertRef.current - delta * 2.5);
    }

    const baseSpeed = isEngaged ? 5.6 : isGearsActive ? 3.2 : isAware ? 1.8 : 0.9;
    const t = state.clock.elapsedTime * baseSpeed;
    const speedBoost = 1.0 + Math.abs(pointer.x) * 1.5;

    for (let i = 0; i < pistonCount; i++) {
      const angle = (i / pistonCount) * Math.PI * 2;
      const phase = (i * Math.PI * 2) / 4; // Quadrature harmonic pattern

      // Reciprocating stroke sliding through outer sleeves
      const strokeMult = isEngaged ? 1.45 : isGearsActive ? 1.0 : 0.6;
      const stroke = Math.sin(t * speedBoost + phase) * strokeMult;

      dummy.position.set(
        Math.cos(angle) * (radius + stroke * 0.35),
        Math.sin(angle) * (radius + stroke * 0.35),
        stroke * 0.8
      );

      // Point piston toward central drive axis
      dummy.rotation.z = angle + Math.PI / 2;
      dummy.rotation.x = stroke * 0.18;
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Vent flare rings pulse at peak compression stroke
      if (ventMeshRef.current) {
        const peak = Math.max(0, Math.sin(t * speedBoost + phase) - 0.7) / 0.3;
        const scale = isEngaged ? 0.8 + peak * 0.8 : peak * 0.4;
        ventDummy.position.set(
          Math.cos(angle) * (radius + 1.1),
          Math.sin(angle) * (radius + 1.1),
          0
        );
        ventDummy.rotation.z = angle + Math.PI / 2;
        ventDummy.scale.set(scale, scale, scale);
        ventDummy.updateMatrix();
        ventMeshRef.current.setMatrixAt(i, ventDummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (ventMeshRef.current) {
      ventMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Pulse hydraulic manifold ring
    if (manifoldRef.current) {
      manifoldRef.current.rotation.z += (isEngaged ? 0.008 : 0.002);
    }

    // Rotate pressure gauge needle toward 100% when active
    if (gaugeNeedleRef.current) {
      const targetAngle = isEngaged ? -Math.PI * 0.75 : isGearsActive ? -Math.PI * 0.25 : 0;
      gaugeNeedleRef.current.rotation.z = THREE.MathUtils.lerp(
        gaugeNeedleRef.current.rotation.z,
        targetAngle,
        delta * 3.5
      );
    }
  });

  const isEngaged = machineState.pistonsEngaged || pistonStatus === "unlocked";
  const canActivate = machineState.gearsEngaged;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        handleInteract();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        worldEngine.setFocus("machine_piston_array");
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (useWorldStore.getState().focusedObjectId === "machine_piston_array") {
          worldEngine.setFocus(null);
        }
      }}
    >
      {/* Reciprocating Chrome Piston Rods */}
      <instancedMesh ref={meshRef} args={[pistonGeom, undefined, pistonCount]}>
        <meshStandardMaterial
          color="#384252"
          emissive={
            lockAlertRef.current > 0
              ? "#ff2200"
              : isEngaged
              ? "#e5a93c"
              : canActivate
              ? "#28f0dc"
              : "#000000"
          }
          emissiveIntensity={
            lockAlertRef.current > 0 ? 0.9 : isEngaged ? 0.45 : canActivate ? 0.18 : 0
          }
          metalness={0.96}
          roughness={0.15}
        />
      </instancedMesh>

      {/* Stationary Hydraulic Cylinder Sleeves */}
      <instancedMesh ref={sleeveMeshRef} args={[sleeveGeom, undefined, pistonCount]}>
        <meshStandardMaterial
          color="#151b24"
          emissive={isEngaged ? "#e5a93c" : "#000000"}
          emissiveIntensity={isEngaged ? 0.2 : 0}
          metalness={0.9}
          roughness={0.35}
        />
      </instancedMesh>

      {/* Radial Fluid Feeder Lines */}
      <instancedMesh ref={feedMeshRef} args={[feedGeom, undefined, pistonCount]}>
        <meshStandardMaterial
          color="#1b2330"
          emissive={isEngaged ? "#e5a93c" : canActivate ? "#28f0dc" : "#0f141c"}
          emissiveIntensity={isEngaged ? 0.6 : canActivate ? 0.25 : 0.05}
          metalness={0.88}
          roughness={0.3}
        />
      </instancedMesh>

      {/* Peak-Compression Exhaust Vent Jet Rings */}
      <instancedMesh ref={ventMeshRef} args={[ventGeom, undefined, pistonCount]}>
        <meshBasicMaterial
          color={isEngaged ? "#ffaa33" : "#28f0dc"}
          transparent
          opacity={isEngaged ? 0.85 : 0.3}
        />
      </instancedMesh>

      {/* Circular Hydraulic Pressure Manifold Pipe */}
      <mesh ref={manifoldRef}>
        <torusGeometry args={[radius, 0.14, 16, 64]} />
        <meshStandardMaterial
          color="#121720"
          emissive={
            lockAlertRef.current > 0
              ? "#ff2200"
              : isEngaged
              ? "#e5a93c"
              : canActivate
              ? "#28f0dc"
              : "#0f141c"
          }
          emissiveIntensity={
            lockAlertRef.current > 0 ? 0.9 : isEngaged ? 0.85 : canActivate ? 0.35 : 0.05
          }
          metalness={0.92}
          roughness={0.25}
        />
      </mesh>

      {/* Hydraulic Pressure Regulator Hub at bottom intake */}
      <group position={[0, -radius, 0]}>
        {/* Regulator Valve Housing */}
        <mesh>
          <cylinderGeometry args={[0.55, 0.65, 0.5, 16]} />
          <meshStandardMaterial
            color="#1c2330"
            metalness={0.9}
            roughness={0.25}
            emissive={isEngaged ? "#e5a93c" : canActivate ? "#28f0dc" : "#000000"}
            emissiveIntensity={isEngaged ? 0.4 : 0.1}
          />
        </mesh>
        {/* Pressure Gauge Bezel */}
        <mesh position={[0, 0, 0.3]}>
          <ringGeometry args={[0.26, 0.34, 24]} />
          <meshBasicMaterial color={isEngaged ? "#e5a93c" : canActivate ? "#28f0dc" : "#475569"} />
        </mesh>
        {/* Needle */}
        <mesh ref={gaugeNeedleRef} position={[0, 0, 0.32]}>
          <planeGeometry args={[0.04, 0.22]} />
          <meshBasicMaterial color={isEngaged ? "#e5a93c" : "#28f0dc"} />
        </mesh>
      </group>

      {/* In-World Spatial Label */}
      <SpatialLabel
        text="STATION 02 // HYDRAULIC ARRAY"
        subtext={
          lockAlertRef.current > 0
            ? "ACCESS DENIED // ENGAGE STATION 01 FIRST"
            : isEngaged
            ? "QUADRATURE HARMONIZED // 100% PRESSURE"
            : canActivate
            ? "READY // CLICK TO SYNCHRONIZE"
            : "LOCKED // REQUIRES STAGE 01 (GEARS)"
        }
        position={[0, -radius - 1.4, 0]}
        color={
          lockAlertRef.current > 0
            ? "#ff3333"
            : isEngaged
            ? "#e5a93c"
            : canActivate
            ? "#28f0dc"
            : "#64748b"
        }
        distanceFade={[2.0, 16.0]}
      />
    </group>
  );
}
