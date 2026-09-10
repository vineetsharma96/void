"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import {
  singularityVertexShader,
  singularityFragmentShader,
  accretionDiskFragmentShader,
} from "@/shaders/void/singularity.glsl";

export function SingularityField() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pointer = useWorldStore((s) => s.pointer);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (diskRef.current) {
      diskRef.current.rotation.z += delta * 0.4;
      const mat = diskRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) mat.uniforms.uTime.value = time;
    }

    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 0.15;
      const mat = sphereRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.uTime.value = time;
        mat.uniforms.uPointer.value.set(pointer.x * 4, pointer.y * 3, 0);
      }
    }

    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 3 + Math.sin(time * 0.2) * 0.1;
      ringRef.current.rotation.y = time * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Negative-Space Event Horizon Sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <shaderMaterial
          vertexShader={singularityVertexShader}
          fragmentShader={singularityFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uPointer: { value: new THREE.Vector3() },
            uSeed: { value: 847291 },
          }}
          transparent={true}
        />
      </mesh>

      {/* 2. Absolute Pitch Black Core Occlusion Sphere */}
      <mesh>
        <sphereGeometry args={[2.42, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* 3. Relativistic Accretion Disk (Tilted at 65 degrees) */}
      <mesh ref={diskRef} rotation={[Math.PI / 2.8, 0, 0]}>
        <planeGeometry args={[10.5, 10.5]} />
        <shaderMaterial
          vertexShader={singularityVertexShader}
          fragmentShader={accretionDiskFragmentShader}
          uniforms={{
            uTime: { value: 0 },
          }}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Photon Sphere Critical Radius Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[3.75, 0.018, 16, 128]} />
        <meshBasicMaterial color="#c8f0ee" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}
