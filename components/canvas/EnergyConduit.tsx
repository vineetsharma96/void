"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface EnergyConduitProps {
  start: [number, number, number];
  end: [number, number, number];
  midpointOffset?: [number, number, number];
  color?: string;
  active?: boolean;
  speed?: number;
}

/**
 * VOID Procedural Energy Conduit
 * Synthesizes a high-voltage plasma electrical conduit between machine stations.
 * Features armored outer casing, emissive plasma core, and moving energy packet nodes.
 */
export function EnergyConduit({
  start,
  end,
  midpointOffset = [0, 1.2, 0],
  color = "#e5a93c",
  active = true,
  speed = 1.6,
}: EnergyConduitProps) {
  const outerMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const node1Ref = useRef<THREE.Mesh>(null);
  const node2Ref = useRef<THREE.Mesh>(null);
  const node3Ref = useRef<THREE.Mesh>(null);

  const { curve, outerTubeGeom, coreTubeGeom } = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const vMid = new THREE.Vector3()
      .addVectors(vStart, vEnd)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(...midpointOffset));

    const c = new THREE.CatmullRomCurve3([vStart, vMid, vEnd]);
    const outer = new THREE.TubeGeometry(c, 36, 0.085, 8, false);
    const core = new THREE.TubeGeometry(c, 36, 0.045, 8, false);
    return { curve: c, outerTubeGeom: outer, coreTubeGeom: core };
  }, [start, end, midpointOffset]);

  const collarGeom = useMemo(() => new THREE.CylinderGeometry(0.16, 0.16, 0.22, 12), []);
  const packetGeom = useMemo(() => new THREE.SphereGeometry(0.14, 8, 8), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Pulse core emissive intensity
    if (coreMatRef.current && outerMatRef.current) {
      if (active) {
        const pulse = 0.65 + 0.35 * Math.sin(t * 8.0);
        outerMatRef.current.emissiveIntensity = 0.5 + pulse * 0.9;
        coreMatRef.current.opacity = 0.8 + pulse * 0.2;
      } else {
        outerMatRef.current.emissiveIntensity = 0.02;
        coreMatRef.current.opacity = 0.15;
      }
    }

    // Move traveling plasma energy packets along the curve
    if (active && curve) {
      const p1 = (t * speed * 0.35) % 1.0;
      const p2 = (t * speed * 0.35 + 0.333) % 1.0;
      const p3 = (t * speed * 0.35 + 0.666) % 1.0;

      if (node1Ref.current) {
        const pos1 = curve.getPointAt(p1);
        node1Ref.current.position.copy(pos1);
      }
      if (node2Ref.current) {
        const pos2 = curve.getPointAt(p2);
        node2Ref.current.position.copy(pos2);
      }
      if (node3Ref.current) {
        const pos3 = curve.getPointAt(p3);
        node3Ref.current.position.copy(pos3);
      }
    }
  });

  return (
    <group>
      {/* Outer Armored Translucent Conduit Casing */}
      <mesh geometry={outerTubeGeom}>
        <meshStandardMaterial
          ref={outerMatRef}
          color="#0f141d"
          emissive={color}
          emissiveIntensity={active ? 0.8 : 0.02}
          roughness={0.25}
          metalness={0.9}
          transparent={true}
          opacity={active ? 0.75 : 0.4}
        />
      </mesh>

      {/* Inner High-Voltage Plasma Filament Core */}
      <mesh geometry={coreTubeGeom}>
        <meshBasicMaterial
          ref={coreMatRef}
          color={color}
          transparent={true}
          opacity={active ? 0.95 : 0.15}
        />
      </mesh>

      {/* Endpoint Terminal Coupler Collars */}
      <mesh position={start} geometry={collarGeom}>
        <meshStandardMaterial
          color="#1c2432"
          emissive={color}
          emissiveIntensity={active ? 0.6 : 0.05}
          metalness={0.95}
          roughness={0.2}
        />
      </mesh>
      <mesh position={end} geometry={collarGeom}>
        <meshStandardMaterial
          color="#1c2432"
          emissive={color}
          emissiveIntensity={active ? 0.6 : 0.05}
          metalness={0.95}
          roughness={0.2}
        />
      </mesh>

      {/* Moving High-Energy Plasma Packet Nodes */}
      {active && (
        <>
          <mesh ref={node1Ref} geometry={packetGeom}>
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh ref={node2Ref} geometry={packetGeom}>
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh ref={node3Ref} geometry={packetGeom}>
            <meshBasicMaterial color={color} />
          </mesh>
        </>
      )}
    </group>
  );
}
