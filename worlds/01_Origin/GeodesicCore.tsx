"use client";

import React, { useMemo, useRef } from "react";
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

export function GeodesicCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const pointer = useWorldStore((s) => s.pointer);
  const seed = useWorldStore((s) => s.seed);

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

    // Map pointer to 3D interaction coordinates
    uniforms.uPointer.value.set(pointer.x * 4.5, pointer.y * 3.2, 0);

    // Subtle breathing rotation
    meshRef.current.rotation.y += delta * 0.18;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.12;

    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y -= delta * 0.35;
      innerMeshRef.current.rotation.z += delta * 0.22;
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

      {/* Outer Wireframe Cage */}
      <mesh rotation={[0.4, 0.2, 0]}>
        <icosahedronGeometry args={[2.35, 2]} />
        <meshBasicMaterial
          color="#e2e8f0"
          wireframe={true}
          transparent={true}
          opacity={0.12}
        />
      </mesh>

      {/* Inner Nested Torus Knot Energy Generator */}
      <mesh ref={innerMeshRef}>
        <torusKnotGeometry args={[0.9, 0.22, 128, 32, 2, 3]} />
        <meshStandardMaterial
          color="#0d1117"
          emissive="#e5a93c"
          emissiveIntensity={0.65}
          roughness={0.2}
          metalness={0.9}
          wireframe={true}
        />
      </mesh>
    </group>
  );
}
