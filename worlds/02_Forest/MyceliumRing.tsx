"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { worldEngine } from "@/engine/world/WorldEngine";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { SpatialLabel } from "@/components/canvas/SpatialLabel";

interface MyceliumRingProps {
  position?: [number, number, number];
}

export function MyceliumRing({ position = [-7.5, -1.1, 4.2] }: MyceliumRingProps) {
  const forestState = useWorldStore((s) => s.forestState);
  const pulseMycelium = useWorldStore((s) => s.actions.pulseMycelium);
  const addDiscovery = useWorldStore((s) => s.actions.addDiscovery);
  const triggerShockwave = useWorldStore((s) => s.actions.triggerShockwave);

  const altarRef = useRef<THREE.Mesh>(null);
  const sporeLightRef = useRef<THREE.PointLight>(null);
  const capsMeshRef = useRef<THREE.InstancedMesh>(null);
  const lockAlertRef = useRef(0);

  const canActivate = forestState.bioCoreAwakened;
  const isPulsing = forestState.myceliumPulsing;

  const mushroomCount = 16;
  const ringRadius = 2.8;

  const handleInteract = () => {
    if (!canActivate) {
      lockAlertRef.current = 1.0;
      audioEngine.triggerClickFoley();
      return;
    }

    if (!isPulsing) {
      pulseMycelium();
      addDiscovery("station_02_mycelium", "structure");
      triggerShockwave([position[0], position[1] + 0.8, position[2]], 2.5);
      audioEngine.triggerFungalChime();
    } else {
      audioEngine.triggerFungalChime();
    }
  };

  // 1. Procedural Mushroom Geometries (Cap + Stalk)
  const { capGeom, stalkGeom, capMatrices, stalkMatrices } = useMemo(() => {
    const cGeom = new THREE.ConeGeometry(0.38, 0.28, 12);
    const sGeom = new THREE.CylinderGeometry(0.06, 0.09, 0.75, 8);

    const cMats: THREE.Matrix4[] = [];
    const sMats: THREE.Matrix4[] = [];

    for (let i = 0; i < mushroomCount; i++) {
      const angle = (i / mushroomCount) * Math.PI * 2 + (i * 0.1);
      const r = ringRadius + Math.sin(i * 3.7) * 0.4;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = 0.35;

      const scale = 0.8 + (Math.sin(i * 2.1) + 1.0) * 0.25;

      // Stalk transform
      const sMat = new THREE.Matrix4();
      const sPos = new THREE.Vector3(x, y, z);
      const sEuler = new THREE.Euler(
        Math.sin(i * 1.5) * 0.15,
        angle,
        Math.cos(i * 1.5) * 0.15
      );
      sMat.compose(sPos, new THREE.Quaternion().setFromEuler(sEuler), new THREE.Vector3(scale, scale, scale));
      sMats.push(sMat);

      // Cap transform (atop stalk)
      const cMat = new THREE.Matrix4();
      const cPos = new THREE.Vector3(x, y + 0.45 * scale, z);
      cMat.compose(cPos, new THREE.Quaternion().setFromEuler(sEuler), new THREE.Vector3(scale, scale, scale));
      cMats.push(cMat);
    }

    return {
      capGeom: cGeom,
      stalkGeom: sGeom,
      capMatrices: cMats,
      stalkMatrices: sMats,
    };
  }, []);

  // Register center Altar with WorldEngine
  useEffect(() => {
    worldEngine.registerObject({
      id: "station_02_mycelium",
      name: "MYCELIAL SPORE ALTAR",
      type: "structure",
      position: new THREE.Vector3(position[0], position[1] + 0.8, position[2]),
      radius: 4.5,
      proximityThresholds: {
        aware: 9.5,
        active: 5.0,
      },
      state: isPulsing ? "unlocked" : "dormant",
    });

    return () => {
      worldEngine.unregisterObject("station_02_mycelium");
    };
  }, [isPulsing, position]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (lockAlertRef.current > 0) {
      lockAlertRef.current = Math.max(0, lockAlertRef.current - delta * 2.0);
    }

    // Altar levitation & pulsing
    if (altarRef.current) {
      altarRef.current.position.y = 0.8 + Math.sin(t * 2.2) * 0.08;
      altarRef.current.rotation.y += delta * (isPulsing ? 2.2 : 0.6);
    }

    // Dynamic Spore Light
    if (sporeLightRef.current) {
      const pulseSpeed = isPulsing ? 4.0 : canActivate ? 2.0 : 0.8;
      const baseIntensity = isPulsing ? 3.5 : canActivate ? 1.4 : 0.4;
      sporeLightRef.current.intensity = baseIntensity + Math.sin(t * pulseSpeed) * 0.6;
      sporeLightRef.current.color.set(
        lockAlertRef.current > 0
          ? "#ff2200"
          : isPulsing
          ? "#2eed86"
          : canActivate
          ? "#38bdf8"
          : "#1e3a29"
      );
    }
  });

  return (
    <group position={position}>
      {/* Mushroom Stalks */}
      <instancedMesh
        args={[stalkGeom, undefined, mushroomCount]}
        onUpdate={(self) => {
          stalkMatrices.forEach((matrix, i) => self.setMatrixAt(i, matrix));
          self.instanceMatrix.needsUpdate = true;
        }}
      >
        <meshStandardMaterial color="#1a251e" roughness={0.8} metalness={0.2} />
      </instancedMesh>

      {/* Bioluminescent Mushroom Caps */}
      <instancedMesh
        ref={capsMeshRef}
        args={[capGeom, undefined, mushroomCount]}
        onUpdate={(self) => {
          capMatrices.forEach((matrix, i) => self.setMatrixAt(i, matrix));
          self.instanceMatrix.needsUpdate = true;
        }}
      >
        <meshStandardMaterial
          color="#0d2417"
          emissive={
            lockAlertRef.current > 0
              ? "#ff2200"
              : isPulsing
              ? "#2eed86"
              : canActivate
              ? "#38bdf8"
              : "#0c301d"
          }
          emissiveIntensity={
            lockAlertRef.current > 0 ? 2.5 : isPulsing ? 2.2 : canActivate ? 0.9 : 0.2
          }
          roughness={0.35}
          metalness={0.75}
        />
      </instancedMesh>

      {/* Center Altar Node (Clickable Target) */}
      <mesh
        ref={altarRef}
        position={[0, 0.8, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleInteract();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          worldEngine.setFocus("station_02_mycelium");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (useWorldStore.getState().focusedObjectId === "station_02_mycelium") {
            worldEngine.setFocus(null);
          }
        }}
      >
        <dodecahedronGeometry args={[0.48, 0]} />
        <meshStandardMaterial
          color="#061f13"
          emissive={
            lockAlertRef.current > 0
              ? "#ff2200"
              : isPulsing
              ? "#2eed86"
              : canActivate
              ? "#38bdf8"
              : "#0d2b1c"
          }
          emissiveIntensity={
            lockAlertRef.current > 0 ? 3.0 : isPulsing ? 2.8 : canActivate ? 1.4 : 0.25
          }
          wireframe={!isPulsing}
          metalness={0.88}
          roughness={0.2}
        />
      </mesh>

      {/* Altar Pedestal Stone */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.65, 0.95, 0.4, 8]} />
        <meshStandardMaterial color="#121815" roughness={0.9} metalness={0.15} />
      </mesh>

      {/* Spore Light Source */}
      <pointLight
        ref={sporeLightRef}
        position={[0, 1.2, 0]}
        color={isPulsing ? "#2eed86" : "#38bdf8"}
        intensity={1.5}
        distance={12}
      />

      {/* In-World Spatial Readout */}
      <SpatialLabel
        text="STATION 02 // MYCELIUM RING"
        subtext={
          lockAlertRef.current > 0
            ? "ACCESS DENIED // AWAKEN MOTHER TREE FIRST"
            : isPulsing
            ? "NETWORK HARMONIZED // SPORES ASCENDING"
            : canActivate
            ? "READY // CLICK TO HARMONIZE SPORES"
            : "LOCKED // REQUIRES STAGE 01 (MOTHER TREE)"
        }
        position={[0, 2.2, 0]}
        color={
          lockAlertRef.current > 0
            ? "#ff3333"
            : isPulsing
            ? "#2eed86"
            : canActivate
            ? "#38bdf8"
            : "#64748b"
        }
        distanceFade={[2.0, 16.0]}
      />
    </group>
  );
}
