"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ProceduralStructureEngine } from "@/procedural/structures/StructureEngine";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { worldEngine } from "@/engine/world/WorldEngine";
import { SpatialLabel } from "@/components/canvas/SpatialLabel";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";

export function MachineLattice() {
  const outerRingRef = useRef<THREE.Group>(null);
  const counterRingRef = useRef<THREE.Group>(null);
  const leftPylonRef = useRef<THREE.Group>(null);
  const rightPylonRef = useRef<THREE.Group>(null);
  const leftCoreRef = useRef<THREE.Mesh>(null);
  const rightCoreRef = useRef<THREE.Mesh>(null);
  const leftCageRef = useRef<THREE.Mesh>(null);
  const rightCageRef = useRef<THREE.Mesh>(null);

  const machineState = useWorldStore((s) => s.machineState);
  const engageMachineCapacitor = useWorldStore((s) => s.actions.engageMachineCapacitor);
  const triggerShockwave = useWorldStore((s) => s.actions.triggerShockwave);

  const [capStatus, setCapStatus] = useState<"dormant" | "aware" | "focused" | "unlocked">("dormant");
  const lockAlertRef = useRef<number>(0);

  const handleInteract = useCallback(() => {
    const pistonsReady = useWorldStore.getState().machineState.pistonsEngaged;
    if (!pistonsReady) {
      lockAlertRef.current = 1.0;
      audioEngine.triggerClickFoley();
      return;
    }

    engageMachineCapacitor();
    setCapStatus("unlocked");
    triggerShockwave([8.5, -2.5, 0], 3.0);
    triggerShockwave([-8.5, -2.5, 0], 3.0);
    audioEngine.triggerCapacitorDischarge();
    worldEngine.recordDiscovery("machine_flux_capacitor", "structure");
  }, [engageMachineCapacitor, triggerShockwave]);

  // Register Station 3 with WorldEngine
  useEffect(() => {
    worldEngine.registerObject({
      id: "machine_flux_capacitor",
      name: "MONOLITH FLUX CAPACITOR",
      type: "machine",
      position: new THREE.Vector3(8.5, -2.5, 0),
      radius: 4.8,
      proximityThresholds: {
        aware: 10.5,
        active: 5.5,
      },
      state: "dormant",
      onAware: () => {
        setCapStatus((prev) => (prev === "unlocked" ? "unlocked" : "aware"));
      },
      onLeaveAware: () => {
        setCapStatus((prev) => (prev === "unlocked" ? "unlocked" : "dormant"));
      },
      onFocus: () => {
        setCapStatus((prev) => (prev === "unlocked" ? "unlocked" : "focused"));
      },
      onBlur: () => {
        setCapStatus((prev) => (prev === "unlocked" ? "unlocked" : "aware"));
      },
      onInteract: handleInteract,
    });

    return () => {
      worldEngine.unregisterObject("machine_flux_capacitor");
    };
  }, [handleInteract]);

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

  // Stacked Induction Coils around pylons
  const coilGeoms = useMemo(() => {
    return [0.75, 0.65, 0.55, 0.45].map(
      (r) => new THREE.TorusGeometry(r, 0.06, 12, 32)
    );
  }, []);

  // Dynamic High-Voltage Plasma Arc Geometry (24 segments across 17m gap)
  const arcSegmentCount = 24;
  const arcGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array((arcSegmentCount + 1) * 3);
    for (let i = 0; i <= arcSegmentCount; i++) {
      const t = i / arcSegmentCount;
      positions[i * 3] = -8.5 + t * 17.0;
      positions[i * 3 + 1] = 1.8;
      positions[i * 3 + 2] = 0;
    }
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [arcSegmentCount]);

  const plasmaArcLine = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: "#28f0dc",
      transparent: true,
      opacity: 0.95,
      linewidth: 2,
    });
    return new THREE.Line(arcGeometry, mat);
  }, [arcGeometry]);

  useFrame((state, delta) => {
    // Decay lock alert flash
    if (lockAlertRef.current > 0) {
      lockAlertRef.current = Math.max(0, lockAlertRef.current - delta * 2.5);
    }

    const isEngaged = machineState.capacitorEngaged || capStatus === "unlocked";
    const speedMult = isEngaged ? 3.5 : machineState.pistonsEngaged ? 1.8 : 1.0;

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.15 * speedMult;
    }
    if (counterRingRef.current) {
      counterRingRef.current.rotation.z -= delta * 0.22 * speedMult;
    }

    // Pylons displace upward with smooth hydraulic kinematics when pistons are engaged
    const targetPylonY = machineState.pistonsEngaged ? -4.2 : -6.0;
    if (leftPylonRef.current) {
      leftPylonRef.current.position.y = THREE.MathUtils.lerp(
        leftPylonRef.current.position.y,
        targetPylonY,
        delta * 2.0
      );
    }
    if (rightPylonRef.current) {
      rightPylonRef.current.position.y = THREE.MathUtils.lerp(
        rightPylonRef.current.position.y,
        targetPylonY,
        delta * 2.0
      );
    }

    // Core crystals spin, pulse, and expand
    const t = state.clock.elapsedTime * 3.2;
    if (leftCoreRef.current && rightCoreRef.current) {
      leftCoreRef.current.rotation.y += delta * 1.4;
      leftCoreRef.current.rotation.x = Math.sin(t) * 0.25;
      rightCoreRef.current.rotation.y -= delta * 1.4;
      rightCoreRef.current.rotation.x = Math.cos(t) * 0.25;
    }

    // Outer counter-rotating wireframe cages
    if (leftCageRef.current && rightCageRef.current) {
      const cageScale = isEngaged ? 1.35 : 1.05;
      leftCageRef.current.scale.set(cageScale, cageScale, cageScale);
      rightCageRef.current.scale.set(cageScale, cageScale, cageScale);
      leftCageRef.current.rotation.y -= delta * 0.8;
      rightCageRef.current.rotation.z += delta * 0.6;
    }

    // Dynamic electrical lightning arc jitter
    const posAttr = arcGeometry.attributes.position as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const activeArc = isEngaged || (machineState.pistonsEngaged && Math.random() < 0.15);

    if (activeArc) {
      plasmaArcLine.visible = true;
      (plasmaArcLine.material as THREE.LineBasicMaterial).color.set(isEngaged ? "#28f0dc" : "#e5a93c");
      for (let i = 0; i <= arcSegmentCount; i++) {
        const u = i / arcSegmentCount;
        const arcBaseY = 1.8 + Math.sin(u * Math.PI) * 1.8;
        const jitterY = (Math.random() - 0.5) * (isEngaged ? 0.45 : 0.2);
        const jitterZ = (Math.random() - 0.5) * (isEngaged ? 0.45 : 0.2);
        positions[i * 3] = -8.5 + u * 17.0;
        positions[i * 3 + 1] = arcBaseY + jitterY;
        positions[i * 3 + 2] = jitterZ;
      }
      posAttr.needsUpdate = true;
    } else {
      plasmaArcLine.visible = false;
    }
  });

  const isEngaged = machineState.capacitorEngaged || capStatus === "unlocked";
  const canActivate = machineState.pistonsEngaged;

  return (
    <group>
      {/* Front Outer Rotating Ring Conduit */}
      <group ref={outerRingRef} position={[0, 0, -1.0]}>
        <mesh geometry={portalData.ringGeometry}>
          <meshStandardMaterial
            color="#171d26"
            emissive={isEngaged ? "#28f0dc" : canActivate ? "#e5a93c" : "#000000"}
            emissiveIntensity={isEngaged ? 0.8 : canActivate ? 0.3 : 0}
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
        {portalData.strutGeometries.map((strut, i) => (
          <mesh key={i} geometry={strut}>
            <meshStandardMaterial
              color="#e5a93c"
              metalness={0.8}
              roughness={0.2}
              emissive="#e5a93c"
              emissiveIntensity={isEngaged ? 1.5 : canActivate ? 0.6 : 0.15}
            />
          </mesh>
        ))}
      </group>

      {/* Rear Counter-Rotating Ring Conduit */}
      <group ref={counterRingRef} position={[0, 0, 1.0]}>
        <mesh geometry={portalData.ringGeometry}>
          <meshStandardMaterial
            color="#111620"
            emissive={isEngaged ? "#28f0dc" : "#000000"}
            emissiveIntensity={isEngaged ? 0.8 : 0}
            metalness={0.95}
            roughness={0.25}
          />
        </mesh>
      </group>

      {/* Left Monolith Pylon Assembly */}
      <group
        ref={leftPylonRef}
        position={[-8.5, -6.0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleInteract();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          worldEngine.setFocus("machine_flux_capacitor");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (useWorldStore.getState().focusedObjectId === "machine_flux_capacitor") {
            worldEngine.setFocus(null);
          }
        }}
      >
        <mesh geometry={pylonGeom}>
          <meshStandardMaterial color="#1a202c" metalness={0.75} roughness={0.45} />
        </mesh>

        {/* Stacked Induction Coils */}
        {coilGeoms.map((coil, idx) => (
          <mesh key={idx} geometry={coil} position={[0, 13.2 + idx * 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial
              color="#2a2015"
              emissive={
                lockAlertRef.current > 0
                  ? "#ff2200"
                  : isEngaged
                  ? "#28f0dc"
                  : canActivate
                  ? "#e5a93c"
                  : "#000000"
              }
              emissiveIntensity={
                lockAlertRef.current > 0 ? 2.2 : isEngaged ? 2.5 : canActivate ? 1.0 : 0.05
              }
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
        ))}

        {/* Hyper-Octahedral Plasma Capacitor Core (solid inner crystal) */}
        <mesh ref={leftCoreRef} position={[0, 14.8, 0]}>
          <octahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial
            color="#080c14"
            emissive={
              lockAlertRef.current > 0
                ? "#ff2200"
                : isEngaged
                ? "#28f0dc"
                : canActivate
                ? "#e5a93c"
                : "#334155"
            }
            emissiveIntensity={
              lockAlertRef.current > 0 ? 2.8 : isEngaged ? 2.5 : canActivate ? 1.2 : 0.2
            }
            roughness={0.1}
            metalness={0.95}
          />
        </mesh>

        {/* Outer Counter-Rotating Resonator Cage */}
        <mesh ref={leftCageRef} position={[0, 14.8, 0]}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color="#28f0dc"
            emissive={isEngaged ? "#28f0dc" : canActivate ? "#e5a93c" : "#1e293b"}
            emissiveIntensity={isEngaged ? 1.8 : canActivate ? 0.6 : 0.1}
            wireframe
          />
        </mesh>
      </group>

      {/* Right Monolith Pylon Assembly */}
      <group
        ref={rightPylonRef}
        position={[8.5, -6.0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleInteract();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          worldEngine.setFocus("machine_flux_capacitor");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (useWorldStore.getState().focusedObjectId === "machine_flux_capacitor") {
            worldEngine.setFocus(null);
          }
        }}
      >
        <mesh geometry={pylonGeom}>
          <meshStandardMaterial color="#1a202c" metalness={0.75} roughness={0.45} />
        </mesh>

        {/* Stacked Induction Coils */}
        {coilGeoms.map((coil, idx) => (
          <mesh key={idx} geometry={coil} position={[0, 13.2 + idx * 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial
              color="#2a2015"
              emissive={
                lockAlertRef.current > 0
                  ? "#ff2200"
                  : isEngaged
                  ? "#28f0dc"
                  : canActivate
                  ? "#e5a93c"
                  : "#000000"
              }
              emissiveIntensity={
                lockAlertRef.current > 0 ? 2.2 : isEngaged ? 2.5 : canActivate ? 1.0 : 0.05
              }
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
        ))}

        {/* Hyper-Octahedral Plasma Capacitor Core (solid inner crystal) */}
        <mesh ref={rightCoreRef} position={[0, 14.8, 0]}>
          <octahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial
            color="#080c14"
            emissive={
              lockAlertRef.current > 0
                ? "#ff2200"
                : isEngaged
                ? "#28f0dc"
                : canActivate
                ? "#e5a93c"
                : "#334155"
            }
            emissiveIntensity={
              lockAlertRef.current > 0 ? 2.8 : isEngaged ? 2.5 : canActivate ? 1.2 : 0.2
            }
            roughness={0.1}
            metalness={0.95}
          />
        </mesh>

        {/* Outer Counter-Rotating Resonator Cage */}
        <mesh ref={rightCageRef} position={[0, 14.8, 0]}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color="#28f0dc"
            emissive={isEngaged ? "#28f0dc" : canActivate ? "#e5a93c" : "#1e293b"}
            emissiveIntensity={isEngaged ? 1.8 : canActivate ? 0.6 : 0.1}
            wireframe
          />
        </mesh>
      </group>

      {/* Dynamic High-Voltage Plasma Lightning Arc */}
      <primitive object={plasmaArcLine} />

      {/* In-World Spatial Label */}
      <SpatialLabel
        text="STATION 03 // FLUX CAPACITOR"
        subtext={
          lockAlertRef.current > 0
            ? "ACCESS DENIED // ENGAGE STATION 02 FIRST"
            : isEngaged
            ? "ENERGIZED // GATEWAY STABILIZED"
            : canActivate
            ? "READY // CLICK TO DISCHARGE FLUX"
            : "LOCKED // REQUIRES STAGE 02"
        }
        position={[8.5, 3.4, 0]}
        color={
          lockAlertRef.current > 0
            ? "#ff3333"
            : isEngaged
            ? "#28f0dc"
            : canActivate
            ? "#e5a93c"
            : "#64748b"
        }
        distanceFade={[2.0, 18.0]}
      />
    </group>
  );
}
