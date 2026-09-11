"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { noise3DGLSL } from "@/shaders/chunks/noise3D.glsl";

const particleVertexShader = /* glsl */ `
${noise3DGLSL}

uniform float uTime;
uniform vec3 uPointer;
uniform float uSeed;
uniform float uPointerDown;
uniform vec3 uShockwaveCenter;
uniform float uShockwaveTime;
uniform float uShockwaveStrength;

// Explorer Spatial Disturbance Field
uniform vec3 uPlayerPos;
uniform vec3 uPlayerVel;
uniform float uPlayerSpeed;

attribute float aRandom;
attribute float aSpeed;
attribute float aSize;

varying float vAlpha;
varying vec3 vColor;

void main() {
  vec3 pos = position;

  // Orbit rotation around origin
  float angle = uTime * 0.15 * aSpeed + aRandom * 6.28;
  float cosA = cos(angle);
  float sinA = sin(angle);
  vec3 rotated = vec3(
    pos.x * cosA - pos.z * sinA,
    pos.y,
    pos.x * sinA + pos.z * cosA
  );

  // 3D Curl noise flow field perturbation
  vec3 curl = curlNoise(rotated * 0.25 + vec3(uSeed * 0.1, uTime * 0.12 * aSpeed, uSeed * 0.05));
  vec3 currentPos = rotated + curl * (1.2 + aRandom * 0.8);

  // Pointer repulsion
  float distToPointer = distance(currentPos, uPointer);
  float repulseRadius = uPointerDown > 0.5 ? 5.5 : 3.0;
  float repulseFactor = smoothstep(repulseRadius, 0.0, distToPointer);
  vec3 repulseDir = normalize(currentPos - uPointer);
  currentPos += repulseDir * repulseFactor * (uPointerDown > 0.5 ? 3.0 : 1.4);

  // Explorer Spatial Disturbance Field (Physical wake repulsion & swirl)
  float distToPlayer = distance(currentPos, uPlayerPos);
  float playerRadius = 3.6;
  if (distToPlayer < playerRadius) {
    float playerDisturbFactor = smoothstep(playerRadius, 0.0, distToPlayer);
    vec3 disturbDir = normalize(currentPos - uPlayerPos + vec3(0.001));
    vec3 swirlDir = cross(disturbDir, vec3(0.0, 1.0, 0.0));
    currentPos += (disturbDir * 2.2 + swirlDir * (uPlayerSpeed + 0.5) * 0.6) * playerDisturbFactor;
  }

  // Dynamic Physical Shockwave Wavefront Displacement
  float waveRadius = uShockwaveTime * 14.0;
  float shockFactor = 0.0;
  if (uShockwaveTime < 2.0 && waveRadius < 26.0) {
    float distToWave = distance(currentPos, uShockwaveCenter);
    float deltaR = distToWave - waveRadius;
    float waveProfile = exp(-(deltaR * deltaR) / 4.5);
    float waveDecay = exp(-1.8 * uShockwaveTime);
    shockFactor = waveProfile * waveDecay * uShockwaveStrength;
    vec3 waveDir = normalize(currentPos - uShockwaveCenter + vec3(0.001));
    currentPos += waveDir * shockFactor * 4.5;
  }

  // Convergence toward center (gravitational drift)
  float distFromOrigin = length(currentPos);
  vAlpha = smoothstep(12.0, 3.0, distFromOrigin) * (0.3 + aRandom * 0.6 + shockFactor * 0.5);

  // Color gradient: Core amber to outer cyan-white
  vec3 colorCore = vec3(0.9, 0.66, 0.24); // Amber
  vec3 colorEdge = vec3(0.78, 0.94, 0.93); // Ion cyan
  vColor = mix(colorCore, colorEdge, smoothstep(2.0, 7.5, distFromOrigin));

  vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
  gl_PointSize = aSize * (35.0 / -mvPosition.z) * (1.0 + repulseFactor * 0.5 + shockFactor * 1.5);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const particleFragmentShader = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;

void main() {
  // Soft circular particle point
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float strength = 1.0 - smoothstep(0.0, 0.5, dist);
  strength = pow(strength, 1.8);

  gl_FragColor = vec4(vColor, vAlpha * strength);
}
`;

export function OriginParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useWorldStore((s) => s.quality);
  const pointer = useWorldStore((s) => s.pointer);
  const seed = useWorldStore((s) => s.seed);
  const shockwave = useWorldStore((s) => s.shockwave);

  const particleCount = useMemo(() => {
    switch (quality) {
      case "ultra": return 45000;
      case "high": return 25000;
      case "medium": return 14000;
      case "low": return 6000;
      case "lite": return 1000;
    }
  }, [quality]);

  const { positions, randoms, speeds, sizes } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const rnd = new Float32Array(particleCount);
    const spd = new Float32Array(particleCount);
    const sz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Stratified spherical distribution around core
      const radius = 2.0 + Math.pow(Math.random(), 1.6) * 7.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7; // Flattened disk
      pos[i * 3 + 2] = radius * Math.cos(phi);

      rnd[i] = Math.random();
      spd[i] = 0.4 + Math.random() * 0.8;
      sz[i] = 2.0 + Math.random() * 3.5;
    }

    return { positions: pos, randoms: rnd, speeds: spd, sizes: sz };
  }, [particleCount]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector3() },
      uSeed: { value: seed },
      uPointerDown: { value: 0 },
      uShockwaveCenter: { value: new THREE.Vector3() },
      uShockwaveTime: { value: 999.0 },
      uShockwaveStrength: { value: 0.0 },
      uPlayerPos: { value: new THREE.Vector3(0, 0, 7.5) },
      uPlayerVel: { value: new THREE.Vector3(0, 0, 0) },
      uPlayerSpeed: { value: 0.0 },
    }),
    [seed]
  );

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    uniforms.uTime.value += delta;
    uniforms.uSeed.value = seed;
    uniforms.uPointer.value.set(pointer.x * 5.0, pointer.y * 3.5, 0);
    uniforms.uPointerDown.value = pointer.isDown ? 1 : 0;

    // Disturbance Field values from player
    const playerPos = useWorldStore.getState().playerPosition;
    const playerVel = useWorldStore.getState().playerVelocity;
    uniforms.uPlayerPos.value.set(playerPos[0], playerPos[1], playerPos[2]);
    uniforms.uPlayerVel.value.set(playerVel[0], playerVel[1], playerVel[2]);
    const speed = Math.sqrt(
      playerVel[0] * playerVel[0] + playerVel[1] * playerVel[1] + playerVel[2] * playerVel[2]
    );
    uniforms.uPlayerSpeed.value = speed;

    const now = typeof performance !== "undefined" ? performance.now() * 0.001 : 0;
    const elapsed = now - shockwave.time;
    uniforms.uShockwaveCenter.value.set(shockwave.center[0], shockwave.center[1], shockwave.center[2]);
    uniforms.uShockwaveTime.value = elapsed >= 0 ? elapsed : 999.0;
    uniforms.uShockwaveStrength.value = shockwave.strength;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          args={[randoms, 1]}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          args={[speeds, 1]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
