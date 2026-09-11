"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { noise3DGLSL } from "@/shaders/chunks/noise3D.glsl";
import { fresnelGLSL } from "@/shaders/chunks/fresnel.glsl";

const coreVertexShader = /* glsl */ `
${noise3DGLSL}

uniform float uTime;
uniform vec3 uPointer;
uniform float uDisplacement;
uniform float uSeed;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vNoise;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  // Multi-octave 3D noise displacement
  vec3 noiseCoord = position * 0.85 + vec3(uSeed * 0.1, uTime * 0.25, uSeed * 0.05);
  float n1 = snoise(noiseCoord);
  float n2 = snoise(noiseCoord * 2.1 - vec3(uTime * 0.15)) * 0.5;
  float totalNoise = (n1 + n2) * uDisplacement;
  vNoise = totalNoise;

  // Pointer interaction deflection
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  
  float distToPointer = distance(worldPos.xyz, uPointer);
  float repulseFactor = smoothstep(3.5, 0.0, distToPointer) * 0.65;
  vec3 repulseDir = normalize(worldPos.xyz - uPointer);

  // Displaced position
  vec3 newPosition = position + normal * (totalNoise + repulseFactor);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const coreFragmentShader = /* glsl */ `
${fresnelGLSL}

uniform vec3 uColorBase;
uniform vec3 uColorEdge;
uniform vec3 uColorCore;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vNoise;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  
  // Dynamic chromatic Fresnel rim
  vec3 shadedColor = getIridescentFresnel(vNormal, viewDir, 3.2, uColorBase, uColorEdge);
  
  // Accentuate noise crests
  float crest = smoothstep(0.1, 0.45, vNoise);
  vec3 finalColor = mix(shadedColor, uColorCore, crest * 0.7);

  // Subtle interior pulse
  float pulse = 0.5 + 0.5 * sin(uTime * 1.5);
  finalColor += uColorEdge * (pulse * 0.08);

  gl_FragColor = vec4(finalColor, 0.95);
}
`;

import { worldEngine } from "@/engine/world/WorldEngine";
import { SpatialLabel } from "@/components/canvas/SpatialLabel";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";

export function GeodesicCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const cageRef = useRef<THREE.Mesh>(null);
  const coreNodeRef = useRef<THREE.Mesh>(null);

  const pointer = useWorldStore((s) => s.pointer);
  const seed = useWorldStore((s) => s.seed);
  const triggerShockwave = useWorldStore((s) => s.actions.triggerShockwave);

  const [coreState, setCoreState] = useState<"dormant" | "aware" | "focused" | "unlocked">("dormant");
  const [proximityDist, setProximityDist] = useState(999);

  // Register with WorldEngine
  useEffect(() => {
    worldEngine.registerObject({
      id: "origin_core",
      name: "MONUMENTAL GEODESIC CORE",
      type: "core",
      position: new THREE.Vector3(0, 0, 0),
      radius: 2.8,
      proximityThresholds: {
        aware: 9.0,
        active: 4.5,
      },
      state: "dormant",
      onAware: (dist) => {
        setProximityDist(dist);
        setCoreState((prev) => (prev === "unlocked" ? "unlocked" : prev === "focused" ? "focused" : "aware"));
      },
      onLeaveAware: () => {
        setProximityDist(999);
        setCoreState((prev) => (prev === "unlocked" ? "unlocked" : "dormant"));
      },
      onFocus: () => {
        setCoreState((prev) => (prev === "unlocked" ? "unlocked" : "focused"));
      },
      onBlur: () => {
        setCoreState((prev) => (prev === "unlocked" ? "unlocked" : "aware"));
      },
      onInteract: () => {
        setCoreState("unlocked");
        triggerShockwave([0, 0, 0], 2.8);
        audioEngine.triggerShockwaveImpulse(1.8);
        worldEngine.recordDiscovery("origin_core", "core");
      },
    });

    return () => {
      worldEngine.unregisterObject("origin_core");
    };
  }, [triggerShockwave]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector3() },
      uDisplacement: { value: 0.32 },
      uSeed: { value: seed },
      uColorBase: { value: new THREE.Color("#0c0f16") },
      uColorEdge: { value: new THREE.Color("#e2e8f0") },
      uColorCore: { value: new THREE.Color("#e5a93c") },
    }),
    [seed]
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    uniforms.uTime.value += delta;
    uniforms.uSeed.value = seed;

    // Reactivity parameters
    const isAware = coreState !== "dormant";
    const isFocused = coreState === "focused" || coreState === "unlocked";
    const isUnlocked = coreState === "unlocked";

    // Dynamic displacement based on awareness
    const targetDisp = isUnlocked ? 0.55 : isFocused ? 0.44 : isAware ? 0.38 : 0.28;
    uniforms.uDisplacement.value = THREE.MathUtils.lerp(
      uniforms.uDisplacement.value,
      targetDisp,
      0.08
    );

    // Map pointer to 3D interaction coordinates
    uniforms.uPointer.value.set(pointer.x * 4.5, pointer.y * 3.2, 0);

    // Rotation speeds adapt to explorer proximity
    const rotSpeed = isUnlocked ? 0.45 : isAware ? 0.28 : 0.14;
    meshRef.current.rotation.y += delta * rotSpeed;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.12;

    // Outer cage expands on focus / unlock
    if (cageRef.current) {
      cageRef.current.rotation.y -= delta * 0.22;
      cageRef.current.rotation.x += delta * 0.11;
      const targetCageScale = isUnlocked ? 1.35 : isFocused ? 1.2 : 1.0;
      cageRef.current.scale.lerp(new THREE.Vector3(targetCageScale, targetCageScale, targetCageScale), 0.08);
    }

    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y -= delta * 0.55 * (isAware ? 1.8 : 1.0);
      innerMeshRef.current.rotation.z += delta * 0.35;
    }

    if (coreNodeRef.current) {
      coreNodeRef.current.rotation.x += delta * 0.8;
      coreNodeRef.current.rotation.y += delta * 0.6;
      const targetNodeScale = isUnlocked ? 1.0 : 0.001;
      coreNodeRef.current.scale.lerp(new THREE.Vector3(targetNodeScale, targetNodeScale, targetNodeScale), 0.06);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Procedural Geodesic Sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.2, 5]} />
        <shaderMaterial
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          uniforms={uniforms}
          wireframe={false}
          transparent={true}
        />
      </mesh>

      {/* Outer Expandable Wireframe Cage */}
      <mesh ref={cageRef} rotation={[0.4, 0.2, 0]}>
        <icosahedronGeometry args={[2.35, 2]} />
        <meshBasicMaterial
          color={coreState === "unlocked" ? "#e5a93c" : "#e2e8f0"}
          wireframe={true}
          transparent={true}
          opacity={coreState === "unlocked" ? 0.45 : 0.18}
        />
      </mesh>

      {/* Inner Nested Torus Knot Energy Generator */}
      <mesh ref={innerMeshRef}>
        <torusKnotGeometry args={[0.9, 0.22, 128, 32, 2, 3]} />
        <meshStandardMaterial
          color="#0d1117"
          emissive={coreState === "unlocked" ? "#28f0dc" : "#e5a93c"}
          emissiveIntensity={coreState === "unlocked" ? 1.5 : 0.65}
          roughness={0.2}
          metalness={0.9}
          wireframe={true}
        />
      </mesh>

      {/* Emergent Hyper-Octahedral Core Node (Unlocks on Interaction) */}
      <mesh ref={coreNodeRef} scale={0.001}>
        <octahedronGeometry args={[0.75, 0]} />
        <meshBasicMaterial
          color="#28f0dc"
          wireframe={true}
          transparent={true}
          opacity={0.9}
        />
      </mesh>

      {/* Spatial Information Tag */}
      <SpatialLabel
        text="PROCEDURAL CORE // ORIGIN"
        subtext={
          coreState === "unlocked"
            ? "ANOMALY HARMONIZED // 100%"
            : coreState === "focused"
            ? "CLICK TO ENERGIZE"
            : coreState === "aware"
            ? `PROXIMITY: ${proximityDist.toFixed(1)}M`
            : "IDLE // APPROACH"
        }
        position={[0, 3.4, 0]}
        color={coreState === "unlocked" ? "#28f0dc" : coreState === "focused" ? "#e5a93c" : "#94a3b8"}
        distanceFade={[2.0, 16.0]}
      />
    </group>
  );
}
