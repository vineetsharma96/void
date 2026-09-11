"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { worldEngine } from "@/engine/world/WorldEngine";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { SpatialLabel } from "@/components/canvas/SpatialLabel";

export function MotherTree() {
  const seed = useWorldStore((s) => s.seed);
  const forestState = useWorldStore((s) => s.forestState);
  const awakenBioCore = useWorldStore((s) => s.actions.awakenBioCore);
  const addDiscovery = useWorldStore((s) => s.actions.addDiscovery);
  const triggerShockwave = useWorldStore((s) => s.actions.triggerShockwave);

  const innerCoreRef = useRef<THREE.Mesh>(null);
  const outerCageRef = useRef<THREE.Mesh>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const pulseRingsRef = useRef<THREE.Mesh>(null);

  const isAwakened = forestState.bioCoreAwakened;

  const handleInteract = () => {
    if (!isAwakened) {
      awakenBioCore();
      addDiscovery("station_01_biocore", "core");
      triggerShockwave([0, 2.8, 0], 2.5);
      audioEngine.triggerBioCorePulse();
    } else {
      audioEngine.triggerBioCorePulse();
    }
  };

  // 1. Procedural Massive Ancient Trunk with Twisted Ribs
  const trunkGeometry = useMemo(() => {
    const height = 8.5;
    const radialSegments = 24;
    const heightSegments = 36;
    const geom = new THREE.CylinderGeometry(0.55, 2.2, height, radialSegments, heightSegments, true);
    const pos = geom.attributes.position;

    // Organic bark fluting and root buttress deformation
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const normalizedY = (y + height / 2) / height; // 0 (bottom) to 1 (top)

      // 5 massive buttress roots flaring out at the base
      const buttress = Math.pow(1.0 - normalizedY, 2.5) * Math.cos(angle * 5) * 0.85;
      // Bark spiral striation
      const barkSpiral = Math.sin(angle * 8 + y * 2.0) * 0.08;

      const currentRadius = Math.sqrt(pos.getX(i) * pos.getX(i) + pos.getZ(i) * pos.getZ(i));
      const targetRadius = Math.max(0.3, currentRadius + buttress + barkSpiral);

      pos.setX(i, Math.cos(angle) * targetRadius);
      pos.setZ(i, Math.sin(angle) * targetRadius);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 2. Procedural Sprawling Surface Roots (5 main arteries leading outward)
  const rootArteries = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = [];
    const rootCount = 5;

    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI * 2 + (seed % 100) * 0.01;
      const points: THREE.Vector3[] = [];
      const length = 7.5;
      const steps = 14;

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const r = 2.0 + t * length;
        const curveAngle = angle + Math.sin(t * Math.PI * 1.5) * 0.35;
        const x = Math.cos(curveAngle) * r;
        const z = Math.sin(curveAngle) * r;
        const y = Math.exp(-t * 2.5) * 0.7 - 0.15;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 24, 0.22, 8, false);
      geometries.push(tube);
    }

    return geometries;
  }, [seed]);

  // Register central Bio-Core with WorldEngine
  useEffect(() => {
    worldEngine.registerObject({
      id: "station_01_biocore",
      name: "BIO-CORE // ANCIENT HEART",
      type: "core",
      position: new THREE.Vector3(0, 2.8, 0),
      radius: 3.5,
      proximityThresholds: {
        aware: 9.0,
        active: 4.5,
      },
      state: isAwakened ? "unlocked" : "dormant",
    });

    return () => {
      worldEngine.unregisterObject("station_01_biocore");
    };
  }, [isAwakened]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Floating Bio-Core levitation & dual rotation
    if (innerCoreRef.current) {
      innerCoreRef.current.position.y = 2.8 + Math.sin(t * 1.8) * 0.12;
      innerCoreRef.current.rotation.y += delta * (isAwakened ? 1.6 : 0.4);
      innerCoreRef.current.rotation.x = Math.sin(t * 0.8) * 0.2;
    }

    if (outerCageRef.current) {
      outerCageRef.current.position.y = 2.8 + Math.sin(t * 1.8) * 0.12;
      outerCageRef.current.rotation.y -= delta * (isAwakened ? 0.9 : 0.25);
      outerCageRef.current.rotation.z = Math.cos(t * 1.1) * 0.25;
    }

    // Dynamic core light pulse
    if (coreLightRef.current) {
      const pulseSpeed = isAwakened ? 3.5 : 1.2;
      const baseIntensity = isAwakened ? 3.8 : 1.5;
      coreLightRef.current.intensity = baseIntensity + Math.sin(t * pulseSpeed) * 0.8;
      coreLightRef.current.color.set(isAwakened ? "#2eed86" : "#38bdf8");
    }

    // Bio-pulse expansion rings
    if (pulseRingsRef.current) {
      const ringScale = 1.0 + ((t * (isAwakened ? 1.8 : 0.8)) % 2.5);
      pulseRingsRef.current.scale.set(ringScale, ringScale, ringScale);
      const ringMat = pulseRingsRef.current.material as THREE.MeshBasicMaterial;
      if (ringMat) {
        ringMat.opacity = Math.max(0, 1.0 - (ringScale - 1.0) / 2.5) * (isAwakened ? 0.6 : 0.25);
      }
    }
  });

  return (
    <group position={[0, -1.2, 0]}>
      {/* Ancient Fluted Trunk */}
      <mesh geometry={trunkGeometry} position={[0, 4.0, 0]}>
        <meshStandardMaterial
          color="#0f1512"
          roughness={0.92}
          metalness={0.12}
        />
      </mesh>

      {/* Surface Root Arteries */}
      {rootArteries.map((geom, idx) => (
        <mesh key={idx} geometry={geom}>
          <meshStandardMaterial
            color="#141c17"
            emissive={isAwakened ? "#2eed86" : "#0d3824"}
            emissiveIntensity={isAwakened ? 0.65 : 0.12}
            roughness={0.88}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Hollow Shrine Chamber Opening (Dark inner cavity) */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshBasicMaterial color="#030806" side={THREE.BackSide} />
      </mesh>

      {/* Inner Bio-Core Crystal (Clickable Target) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleInteract();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          worldEngine.setFocus("station_01_biocore");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (useWorldStore.getState().focusedObjectId === "station_01_biocore") {
            worldEngine.setFocus(null);
          }
        }}
      >
        <mesh ref={innerCoreRef} position={[0, 2.8, 0]}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color="#062215"
            emissive={isAwakened ? "#2eed86" : "#38bdf8"}
            emissiveIntensity={isAwakened ? 2.8 : 1.2}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>

        {/* Outer Faceted Geodesic Cage */}
        <mesh ref={outerCageRef} position={[0, 2.8, 0]}>
          <icosahedronGeometry args={[0.82, 0]} />
          <meshStandardMaterial
            color="#1b2820"
            emissive={isAwakened ? "#38ef7d" : "#28f0dc"}
            emissiveIntensity={isAwakened ? 1.1 : 0.4}
            wireframe
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* Resonant Energy Pulse Shockwave Ring */}
        <mesh ref={pulseRingsRef} position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 0.98, 32]} />
          <meshBasicMaterial
            color={isAwakened ? "#2eed86" : "#38bdf8"}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Point Light Emitting from Bio-Core */}
      <pointLight
        ref={coreLightRef}
        position={[0, 2.8, 0]}
        color={isAwakened ? "#2eed86" : "#38bdf8"}
        intensity={2.5}
        distance={16}
      />

      {/* Spatial Label */}
      <SpatialLabel
        text="STATION 01 // MOTHER TREE"
        subtext={
          isAwakened
            ? "BIO-CORE HARMONIZED // SAP SURGE ENGAGED"
            : "CLICK TO AWAKEN MYCELIAL NETWORK"
        }
        position={[0, 4.8, 0]}
        color={isAwakened ? "#2eed86" : "#38bdf8"}
        distanceFade={[2.0, 18.0]}
      />
    </group>
  );
}
