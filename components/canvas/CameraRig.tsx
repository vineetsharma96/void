"use client";

import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";

export function CameraRig() {
  const { camera } = useThree();
  const pointer = useWorldStore((s) => s.pointer);
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const isOpeningComplete = useWorldStore((s) => s.isOpeningComplete);
  const transitionProgress = useWorldStore((s) => s.transitionProgress);
  const dollyOffset = useWorldStore((s) => s.dollyOffset);
  const gyro = useWorldStore((s) => s.gyro);
  const reducedMotion = useWorldStore((s) => s.reducedMotion);

  // Target positions & rotations
  const currentPos = useRef(new THREE.Vector3(0, 0, 16));
  const targetPos = useRef(new THREE.Vector3(0, 0, 7.2));
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));
  const orbitAngle = useRef({ theta: 0, phi: 0 });

  useEffect(() => {
    // Initial camera placement
    camera.position.set(0, 0, 16);
  }, [camera]);

  useFrame((state, delta) => {
    // Responsive camera position based on opening phase
    if (!isOpeningComplete) {
      // Intro camera zoom
      const introDrift = reducedMotion ? 0 : state.clock.elapsedTime * 0.2;
      targetPos.current.set(
        Math.sin(introDrift) * 1.5,
        Math.cos(introDrift * 0.75) * 1.0,
        14.0
      );
    } else if (transitionProgress > 0.001) {
      if (reducedMotion) {
        // Simple linear cut without acceleration or banking
        targetPos.current.set(0, 0, 7.2);
        camera.rotation.z = 0;
      } else {
        // Inter-dimensional warp flight trajectory
        const warpZ = 7.2 - Math.sin(transitionProgress * Math.PI) * 5.5;
        const warpRoll = Math.sin(transitionProgress * Math.PI) * 0.35;
        targetPos.current.set(
          Math.sin(transitionProgress * Math.PI * 2) * 2.0,
          Math.cos(transitionProgress * Math.PI) * 1.2,
          warpZ
        );
        camera.rotation.z = warpRoll;

        // Dynamic FOV Expansion
        if ("fov" in camera) {
          const persCamera = camera as THREE.PerspectiveCamera;
          persCamera.fov = 55 + Math.sin(transitionProgress * Math.PI) * 24;
          persCamera.updateProjectionMatrix();
        }
      }
    } else {
      // Gyroscopic tilt contribution
      const gyroTiltX = gyro.active && !reducedMotion ? (gyro.gamma / 45) * 1.4 : 0;
      const gyroTiltY = gyro.active && !reducedMotion ? (gyro.beta / 45) * 1.0 : 0;

      camera.rotation.z = gyro.active && !reducedMotion ? (gyro.gamma / 45) * 0.12 : 0;

      if ("fov" in camera && (camera as THREE.PerspectiveCamera).fov !== 55) {
        (camera as THREE.PerspectiveCamera).fov = 55;
        camera.updateProjectionMatrix();
      }

      // Free exploration / interactive mode with gyro blend
      const parallaxX = pointer.x * 2.2 + gyroTiltX;
      const parallaxY = pointer.y * 1.6 + gyroTiltY;

      // Clamped dolly distance
      const effectiveDollyZ = THREE.MathUtils.clamp(7.2 + dollyOffset, 3.5, 20.0);

      if (cameraMode === "cinematic") {
        const time = state.clock.elapsedTime * 0.2;
        targetPos.current.set(
          Math.sin(time) * 1.8 + parallaxX,
          Math.cos(time * 0.8) * 0.8 + parallaxY,
          effectiveDollyZ + Math.sin(time * 0.5) * 0.6
        );
      } else if (cameraMode === "orbit") {
        orbitAngle.current.theta += pointer.x * delta * 0.5;
        orbitAngle.current.phi = THREE.MathUtils.clamp(
          orbitAngle.current.phi + pointer.y * delta * 0.5,
          -Math.PI / 4,
          Math.PI / 4
        );

        const radius = THREE.MathUtils.clamp(7.5 + dollyOffset, 3.8, 20.0);
        targetPos.current.set(
          radius * Math.sin(orbitAngle.current.theta) * Math.cos(orbitAngle.current.phi),
          radius * Math.sin(orbitAngle.current.phi) + 0.5,
          radius * Math.cos(orbitAngle.current.theta) * Math.cos(orbitAngle.current.phi)
        );
      } else {
        // Inspect mode: close up with dolly
        targetPos.current.set(parallaxX * 0.8, parallaxY * 0.8, THREE.MathUtils.clamp(4.6 + dollyOffset, 2.5, 14.0));
      }
    }

    // Exponential smoothing for fluid cinematic motion
    currentPos.current.lerp(targetPos.current, 0.05);
    camera.position.copy(currentPos.current);

    // LookAt interpolation
    lookTarget.current.lerp(new THREE.Vector3(pointer.x * 0.4, pointer.y * 0.3, 0), 0.05);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
