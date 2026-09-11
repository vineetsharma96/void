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
import { MetamorphosisStream } from "@/components/canvas/MetamorphosisStream";

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
    // In-place mathematical dissolution and reconstitution
    if (targetRealm) {
      const t = transitionProgress; // 0 to 1

      if (currentGroupRef.current) {
        // Outgoing realm dissolves into the metamorphosis stream during t in [0, 0.45]
        if (t <= 0.45) {
          const dissolveScale = 1.0 - (t / 0.45);
          currentGroupRef.current.scale.setScalar(Math.max(0.001, dissolveScale));
          currentGroupRef.current.position.y = -t * 4.0;
        } else {
          currentGroupRef.current.scale.setScalar(0.001);
        }
      }

      if (targetGroupRef.current) {
        // Incoming realm materializes out of the stream during t in [0.55, 1.0]
        if (t >= 0.55) {
          const materializeScale = (t - 0.55) / 0.45;
          targetGroupRef.current.scale.setScalar(Math.max(0.001, materializeScale));
          targetGroupRef.current.position.y = (1.0 - materializeScale) * 4.0;
        } else {
          targetGroupRef.current.scale.setScalar(0.001);
        }
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

      {/* Real-time 12,000-Particle Analytical Metamorphosis Stream */}
      <MetamorphosisStream />

      {/* Inter-Dimensional Quantum Warp Transit Tunnel */}
      <TransitTunnel />
    </>
  );
}
