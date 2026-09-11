"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { metamorphosisEngine } from "@/engine/metamorphosis/MetamorphosisEngine";
import { MorphGeometries } from "@/engine/metamorphosis/MorphGeometries";

/**
 * VOID Procedural Metamorphosis Stream
 * 12,000 GPU particles executing real-time in-place mathematical transmutation
 * between cosmological archetypes (Botanical dissolution, crystalline freeze, singularity collapse).
 */
export function MetamorphosisStream() {
  const pointsRef = useRef<THREE.Points>(null);
  const transitionProgress = useWorldStore((s) => s.transitionProgress);
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const targetRealm = useWorldStore((s) => s.targetRealm);

  const pointCount = MorphGeometries.POINT_COUNT;

  // Dynamic particle buffers
  const { positions, colors } = useMemo(() => {
    return {
      positions: new Float32Array(pointCount * 3),
      colors: new Float32Array(pointCount * 3),
    };
  }, [pointCount]);

  useFrame((state) => {
    if (!pointsRef.current || !targetRealm) return;

    const morphState = metamorphosisEngine.getState();
    const sourceCloud = metamorphosisEngine.getSourceCloud();
    const targetCloud = metamorphosisEngine.getTargetCloud();

    if (!sourceCloud || !targetCloud) return;

    const srcPos = sourceCloud.positions;
    const tgtPos = targetCloud.positions;
    const srcCol = sourceCloud.colors;
    const tgtCol = targetCloud.colors;

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colArray = pointsRef.current.geometry.attributes.color.array as Float32Array;

    const t = transitionProgress;
    const pair = metamorphosisEngine.getArchetypePair();
    const time = state.clock.elapsedTime;

    // Smooth cubic S-curve easing
    const smoothT = t * t * (3 - 2 * t);
    // Transmutation intensity peaks at mid-transition (t = 0.5)
    const turbulence = Math.sin(t * Math.PI);

    for (let i = 0; i < pointCount; i++) {
      const idx = i * 3;
      const x0 = srcPos[idx];
      const y0 = srcPos[idx + 1];
      const z0 = srcPos[idx + 2];

      const x1 = tgtPos[idx];
      const y1 = tgtPos[idx + 1];
      const z1 = tgtPos[idx + 2];

      // Base spatial interpolation
      let curX = THREE.MathUtils.lerp(x0, x1, smoothT);
      let curY = THREE.MathUtils.lerp(y0, y1, smoothT);
      let curZ = THREE.MathUtils.lerp(z0, z1, smoothT);

      // Archetypal Transmutation Dynamics
      if (pair === "forest_to_ocean") {
        // Botanical Dissolution -> Fluid Cascade -> Ocean Waves
        // Leaves melt downward under gravity, then spread across horizontal ocean surface
        const downwardMelt = turbulence * -3.5 * Math.sin((i / pointCount) * Math.PI);
        const ripple = turbulence * Math.sin(curX * 0.8 + time * 6.0) * 0.6;
        curY += downwardMelt + ripple;
      } else if (pair === "ocean_to_machine") {
        // Crystalline Freezing & Mechanical Gear Snapping
        // Waves freeze into stepped polygonal heights, then rotate radially into gear teeth
        const freezeStep = Math.floor(curY * 4.0) / 4.0;
        const angle = Math.atan2(curZ, curX) + turbulence * 1.5;
        const radius = Math.sqrt(curX * curX + curZ * curZ);
        curX = Math.cos(angle) * radius;
        curZ = Math.sin(angle) * radius;
        curY = THREE.MathUtils.lerp(curY, freezeStep, turbulence * 0.7);
      } else if (pair === "machine_to_void") {
        // Kinetic Overload -> Accretion Spiral -> Singularity Collapse
        // Machine structures spin up, break apart, and spiral inward into black hole
        const angle = Math.atan2(curZ, curX) + turbulence * time * 5.0;
        const inwardPull = 1.0 - turbulence * 0.65;
        const radius = Math.sqrt(curX * curX + curZ * curZ) * inwardPull;
        curX = Math.cos(angle) * radius;
        curZ = Math.sin(angle) * radius;
        curY *= inwardPull;
      } else if (pair === "void_to_origin") {
        // Quantum Singularity Compression -> Cosmic Big Bang Shockwave
        if (t < 0.4) {
          // Collapse to point
          const compress = 1.0 - (t / 0.4);
          curX *= compress;
          curY *= compress;
          curZ *= compress;
        } else {
          // Explosive Big Bang expansion to icosahedron
          const expand = (t - 0.4) / 0.6;
          const bangShock = (1.0 - expand) * Math.sin(expand * Math.PI * 3.0) * 2.5;
          curX += curX * bangShock;
          curY += curY * bangShock;
          curZ += curZ * bangShock;
        }
      } else if (pair === "origin_to_forest") {
        // Geodesic Matrix -> Recursive L-System Branch Sprouting
        const sproutProgress = Math.max(0, (t - 0.2) / 0.8);
        const sproutUpward = (1.0 - sproutProgress) * -2.0;
        curY += sproutUpward;
      } else {
        // General cosmological flux perturbation
        const noiseX = Math.sin(y0 * 2.0 + time * 4.0) * turbulence * 1.2;
        const noiseY = Math.cos(z0 * 2.0 + time * 4.0) * turbulence * 1.2;
        const noiseZ = Math.sin(x0 * 2.0 + time * 4.0) * turbulence * 1.2;
        curX += noiseX;
        curY += noiseY;
        curZ += noiseZ;
      }

      posArray[idx] = curX;
      posArray[idx + 1] = curY;
      posArray[idx + 2] = curZ;

      // Dynamic Color Transmutation
      const r = THREE.MathUtils.lerp(srcCol[idx], tgtCol[idx], smoothT);
      const g = THREE.MathUtils.lerp(srcCol[idx + 1], tgtCol[idx + 1], smoothT);
      const b = THREE.MathUtils.lerp(srcCol[idx + 2], tgtCol[idx + 2], smoothT);

      // High-energy white flash during peak transmutation phase
      const flash = Math.pow(turbulence, 3.0) * 0.45;
      colArray[idx] = Math.min(1.0, r + flash);
      colArray[idx + 1] = Math.min(1.0, g + flash);
      colArray[idx + 2] = Math.min(1.0, b + flash);
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  // Only render during active metamorphosis
  const isMorphing = Boolean(targetRealm && transitionProgress > 0.005 && transitionProgress < 0.995);
  if (!isMorphing) return null;

  // Bell-curve opacity envelope
  const morphOpacity = Math.sin(transitionProgress * Math.PI);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        vertexColors
        transparent
        opacity={morphOpacity * 0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
