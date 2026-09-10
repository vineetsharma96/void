"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { OriginWorld } from "./01_Origin/OriginWorld";
import { ForestWorld } from "./02_Forest/ForestWorld";
import { OceanWorld } from "./03_Ocean/OceanWorld";
import { MachineWorld } from "./04_Machine/MachineWorld";
import { VoidWorld } from "./05_Void/VoidWorld";

function TransitTunnel() {
  const pointsRef = useRef<THREE.Points>(null);
  const transitionProgress = useWorldStore((s) => s.transitionProgress);

  const tunnelCount = 3500;
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(tunnelCount * 3);
    const col = new Float32Array(tunnelCount * 3);

    for (let i = 0; i < tunnelCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 8.0;
      const z = (Math.random() - 0.5) * 50;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = z;

      // Streaking photon colors
      col[i * 3] = 0.8 + Math.random() * 0.2;     // R
      col[i * 3 + 1] = 0.9 + Math.random() * 0.1; // G
      col[i * 3 + 2] = 1.0;                      // B
    }

    return { positions: pos, colors: col };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

    // Fast warp streak forward
    for (let i = 0; i < tunnelCount; i++) {
      posArray[i * 3 + 2] += delta * 60;
      if (posArray[i * 3 + 2] > 25) {
        posArray[i * 3 + 2] = -25;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Bell-curve opacity peak at transitionProgress = 0.5
  const tunnelOpacity = Math.sin(transitionProgress * Math.PI) * 0.9;
  if (tunnelOpacity <= 0.01) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={tunnelOpacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function WorldManager() {
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const targetRealm = useWorldStore((s) => s.targetRealm);
  const transitionProgress = useWorldStore((s) => s.transitionProgress);

  const currentGroupRef = useRef<THREE.Group>(null);
  const targetGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    // Continuous morphing scale and position offsets during transition
    if (targetRealm) {
      const outgoingProgress = transitionProgress; // 0 to 1
      const incomingProgress = 1 - transitionProgress; // 1 to 0

      if (currentGroupRef.current) {
        currentGroupRef.current.position.z = -outgoingProgress * 15;
        currentGroupRef.current.scale.setScalar(Math.max(0.001, 1.0 - outgoingProgress * 0.5));
      }

      if (targetGroupRef.current) {
        targetGroupRef.current.position.z = incomingProgress * 20;
        targetGroupRef.current.scale.setScalar(Math.max(0.001, 1.0 - incomingProgress * 0.5));
      }
    } else {
      if (currentGroupRef.current) {
        currentGroupRef.current.position.set(0, 0, 0);
        currentGroupRef.current.scale.setScalar(1.0);
      }
    }
  });

  const renderRealm = (realm: string) => {
    switch (realm) {
      case "origin": return <OriginWorld />;
      case "forest": return <ForestWorld />;
      case "ocean": return <OceanWorld />;
      case "machine": return <MachineWorld />;
      case "void": return <VoidWorld />;
      default: return null;
    }
  };

  return (
    <>
      {/* Current Active Realm */}
      <group ref={currentGroupRef}>
        {renderRealm(currentRealm)}
      </group>

      {/* Target Incoming Realm during metamorphosis */}
      {targetRealm && (
        <group ref={targetGroupRef}>
          {renderRealm(targetRealm)}
        </group>
      )}

      {/* Inter-Dimensional Quantum Warp Transit Tunnel */}
      <TransitTunnel />
    </>
  );
}
