"use client";

import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { explorerController } from "@/engine/player/ExplorerController";
import { raycastManager } from "@/engine/interaction/RaycastManager";

export function CameraRig() {
  const { camera } = useThree();
  const pointer = useWorldStore((s) => s.pointer);
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const isOpeningComplete = useWorldStore((s) => s.isOpeningComplete);
  const transitionProgress = useWorldStore((s) => s.transitionProgress);
  const dollyOffset = useWorldStore((s) => s.dollyOffset);
  const gyro = useWorldStore((s) => s.gyro);
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  const setMoveInput = useWorldStore((s) => s.actions.setMoveInput);

  // Spherical orbital angles (azimuth: unbounded 360 deg, elevation: vertical pitch)
  const azimuth = useRef(0);
  const elevation = useRef(0.22);
  const targetAzimuth = useRef(0);
  const targetElevation = useRef(0.22);
  const prevPointer = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Target positions & rotations
  const currentPos = useRef(new THREE.Vector3(0, 0, 16));
  const targetPos = useRef(new THREE.Vector3(0, 0, 7.5));
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Keyboard state for spatial movement in EXPLORE mode & orbital rotation in ORBIT mode
  useEffect(() => {
    camera.position.set(0, 0, 16);

    const keysDown = new Set<string>();

    const updateMovement = () => {
      let forward = 0;
      let right = 0;
      let up = 0;

      if (keysDown.has("w") || keysDown.has("W") || keysDown.has("ArrowUp")) forward += 1;
      if (keysDown.has("s") || keysDown.has("S") || keysDown.has("ArrowDown")) forward -= 1;
      if (keysDown.has("d") || keysDown.has("D") || keysDown.has("ArrowRight")) right += 1;
      if (keysDown.has("a") || keysDown.has("A") || keysDown.has("ArrowLeft")) right -= 1;
      if (keysDown.has("e") || keysDown.has("E") || keysDown.has(" ")) up += 1;
      if (keysDown.has("q") || keysDown.has("Q") || keysDown.has("Shift")) up -= 1;

      setMoveInput({ forward, right, up });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const store = useWorldStore.getState();
      if (store.cameraMode === "explore") {
        keysDown.add(e.key);
        updateMovement();
      } else {
        // Orbit mode keyboard rotation
        if (e.key === "a" || e.key === "A") {
          targetAzimuth.current -= 0.18;
        } else if (e.key === "d" || e.key === "D") {
          targetAzimuth.current += 0.18;
        } else if (e.key === "w" || e.key === "W") {
          targetElevation.current = THREE.MathUtils.clamp(targetElevation.current + 0.12, -1.42, 1.42);
        } else if (e.key === "s" || e.key === "S") {
          targetElevation.current = THREE.MathUtils.clamp(targetElevation.current - 0.12, -1.42, 1.42);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key);
      updateMovement();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [camera, setMoveInput]);

  useFrame((state, delta) => {
    // Update central raycaster testing against interactive structures
    raycastManager.update(camera);

    // Responsive camera position based on opening phase
    if (!isOpeningComplete) {
      // Intro camera zoom
      const introDrift = reducedMotion ? 0 : state.clock.elapsedTime * 0.2;
      targetPos.current.set(
        Math.sin(introDrift) * 1.5,
        Math.cos(introDrift * 0.75) * 1.0,
        14.0
      );
      currentPos.current.lerp(targetPos.current, 0.05);
      camera.position.copy(currentPos.current);
      camera.lookAt(0, 0, 0);
      return;
    }

    if (transitionProgress > 0.001) {
      if (reducedMotion) {
        // Simple cut without acceleration or banking
        targetPos.current.set(0, 0, 7.5);
        camera.rotation.z = 0;
      } else {
        // Inter-dimensional warp flight trajectory
        const warpZ = 7.5 - Math.sin(transitionProgress * Math.PI) * 5.5;
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
      currentPos.current.lerp(targetPos.current, 0.08);
      camera.position.copy(currentPos.current);
      camera.lookAt(0, 0, 0);
      return;
    }

    // Reset camera roll & FOV after transition
    camera.rotation.z = 0;
    if ("fov" in camera && (camera as THREE.PerspectiveCamera).fov !== 55) {
      (camera as THREE.PerspectiveCamera).fov = 55;
      camera.updateProjectionMatrix();
    }

    // ─────────────────────────────────────────────────────────────
    // FREE EXPLORATION MODE (WASD + Mouse-Look + Spatial Kinematics)
    // ─────────────────────────────────────────────────────────────
    if (cameraMode === "explore") {
      if (pointer.isDown) {
        if (!isDragging.current) {
          isDragging.current = true;
          prevPointer.current = { x: pointer.x, y: pointer.y };
        } else {
          const dx = (pointer.x - prevPointer.current.x) * 450;
          const dy = (pointer.y - prevPointer.current.y) * 450;
          prevPointer.current = { x: pointer.x, y: pointer.y };
          explorerController.addLookDelta(dx, dy);
        }
      } else {
        isDragging.current = false;
      }

      // Kinematic update
      const { cameraPosition, lookDirection } = explorerController.update(delta);
      currentPos.current.lerp(cameraPosition, 0.15);
      camera.position.copy(currentPos.current);

      const lookTargetPoint = currentPos.current.clone().add(lookDirection);
      lookTarget.current.lerp(lookTargetPoint, 0.18);
      camera.lookAt(lookTarget.current);
      return;
    }

    // Interactive 360-Degree Spherical Drag Control
    if (pointer.isDown) {
      if (!isDragging.current) {
        isDragging.current = true;
        prevPointer.current = { x: pointer.x, y: pointer.y };
      } else {
        const dx = pointer.x - prevPointer.current.x;
        const dy = pointer.y - prevPointer.current.y;
        prevPointer.current = { x: pointer.x, y: pointer.y };

        // Continuous 360-degree horizontal azimuth & clamped vertical pitch
        targetAzimuth.current -= dx * 3.6;
        targetElevation.current = THREE.MathUtils.clamp(
          targetElevation.current - dy * 2.6,
          -1.42,
          1.42
        );
      }
    } else {
      isDragging.current = false;

      // Gentle continuous 360 auto-rotation when idle
      if (!reducedMotion && cameraMode !== "inspect") {
        const autoSpeed = cameraMode === "orbit" ? 0.06 : 0.038;
        targetAzimuth.current += delta * autoSpeed;
      }
    }

    // Gyroscopic tilt contribution
    const gyroAzimuth = gyro.active && !reducedMotion ? (gyro.gamma / 45) * 0.35 : 0;
    const gyroElevation = gyro.active && !reducedMotion ? (gyro.beta / 45) * 0.25 : 0;

    // Smooth spherical angle interpolation
    azimuth.current = THREE.MathUtils.lerp(
      azimuth.current,
      targetAzimuth.current + gyroAzimuth,
      0.08
    );
    elevation.current = THREE.MathUtils.lerp(
      elevation.current,
      targetElevation.current + gyroElevation,
      0.08
    );

    // Dynamic distance radius with dolly zoom
    const baseRadius = cameraMode === "inspect" ? 4.5 : 7.6;
    const radius = THREE.MathUtils.clamp(baseRadius + dollyOffset, 2.8, 22.0);

    // Full 360 Spherical to Cartesian coordinate transformation
    const cosElev = Math.cos(elevation.current);
    const sinElev = Math.sin(elevation.current);
    const sinAzim = Math.sin(azimuth.current);
    const cosAzim = Math.cos(azimuth.current);

    targetPos.current.set(
      radius * cosElev * sinAzim,
      radius * sinElev,
      radius * cosElev * cosAzim
    );

    // Smoothly apply position to camera
    currentPos.current.lerp(targetPos.current, 0.08);
    camera.position.copy(currentPos.current);

    // Subtle lookAt micro-parallax
    const focusX = !isDragging.current ? pointer.x * 0.2 : 0;
    const focusY = !isDragging.current ? pointer.y * 0.15 : 0;
    lookTarget.current.lerp(new THREE.Vector3(focusX, focusY, 0), 0.06);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
