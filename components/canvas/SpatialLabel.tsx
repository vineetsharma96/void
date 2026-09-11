"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SpatialLabelProps {
  text: string;
  subtext?: string;
  position: [number, number, number];
  color?: string;
  distanceFade?: [number, number]; // [minDist, maxDist]
}

/**
 * VOID Procedural Spatial Label
 * In-world holographic 3D typography synthesized in real-time onto an offscreen canvas texture.
 * Zero external font files or bitmap textures.
 */
export function SpatialLabel({
  text,
  subtext,
  position,
  color = "#28f0dc",
  distanceFade = [2.0, 18.0],
}: SpatialLabelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  // Procedurally generate crisp 512x128 canvas texture
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, 512, 128);

    // Glowing border frame
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 496, 112);

    // Corner brackets
    ctx.fillStyle = color;
    ctx.fillRect(4, 4, 16, 4);
    ctx.fillRect(4, 4, 4, 16);
    ctx.fillRect(492, 4, 16, 4);
    ctx.fillRect(504, 4, 4, 16);
    ctx.fillRect(4, 120, 16, 4);
    ctx.fillRect(4, 108, 4, 16);
    ctx.fillRect(492, 120, 16, 4);
    ctx.fillRect(504, 108, 4, 16);

    // Main Header Text
    ctx.font = "bold 44px 'Courier New', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillText(text.toUpperCase(), 256, subtext ? 50 : 64);

    // Subtext
    if (subtext) {
      ctx.font = "18px 'Courier New', monospace";
      ctx.fillStyle = color;
      ctx.shadowBlur = 6;
      ctx.fillText(subtext.toUpperCase(), 256, 92);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text, subtext, color]);

  useFrame(({ camera }) => {
    if (!meshRef.current || !materialRef.current) return;

    // Billboard lookAt camera
    meshRef.current.quaternion.copy(camera.quaternion);

    // Distance-based alpha fade
    const worldPos = new THREE.Vector3(...position);
    const dist = camera.position.distanceTo(worldPos);
    const alpha = THREE.MathUtils.smoothstep(dist, distanceFade[1], distanceFade[0]);
    materialRef.current.opacity = alpha * 0.92;
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[2.8, 0.7]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
