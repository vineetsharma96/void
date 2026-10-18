"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useFrame, useThree } from "@react-three/fiber";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { performanceGovernor } from "@/engine/performance/PerformanceMonitor";
import { CameraRig } from "./CameraRig";
import { WorldManager } from "@/worlds/WorldManager";

export function Experience() {
  const { gl, scene } = useThree();
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const targetRealm = useWorldStore((s) => s.targetRealm);
  const transitionProgress = useWorldStore((s) => s.transitionProgress);
  const quality = useWorldStore((s) => s.quality);
  const updateTelemetry = useWorldStore((s) => s.actions.updateTelemetry);
  const setQuality = useWorldStore((s) => s.actions.setQuality);

  const frameCounter = useRef(0);

  // Initialize zero-dependency procedural studio environment map for PBR reflections
  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    return () => {
      envTarget.dispose();
    };
  }, [gl, scene]);

  useFrame(() => {
    const { fps, recommendedTier } = performanceGovernor.recordFrame();

    // Throttle React telemetry store updates to ~4Hz (every 15 frames) to avoid 60Hz HUD re-renders
    frameCounter.current++;
    if (frameCounter.current % 15 === 0) {
      const info = gl.info;
      updateTelemetry({
        fps,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
      });
    }

    if (recommendedTier && recommendedTier !== quality) {
      setQuality(recommendedTier);
    }
  });

  // Smooth fog interpolation during transitions
  const activeFogRealm = targetRealm && transitionProgress > 0.5 ? targetRealm : currentRealm;
  const fogColor =
    activeFogRealm === "void"
      ? "#010204"
      : activeFogRealm === "machine"
      ? "#080a10"
      : activeFogRealm === "ocean"
      ? "#020610"
      : activeFogRealm === "forest"
      ? "#040b08"
      : "#050608";

  return (
    <>
      {/* Decoupled Camera Rig */}
      <CameraRig />

      {/* Warm/Cool Studio Hemisphere & Key Lighting */}
      <hemisphereLight args={["#c8f0ee", "#050608", 0.35]} />
      <directionalLight position={[8, 12, 6]} intensity={0.75} color="#fff4e0" />

      {/* Background Fog tailored per environment */}
      <color attach="background" args={[fogColor]} />
      <fog
        attach="fog"
        args={[
          fogColor,
          activeFogRealm === "void"
            ? 16
            : activeFogRealm === "machine"
            ? 14
            : activeFogRealm === "ocean"
            ? 12
            : activeFogRealm === "forest"
            ? 10
            : 8,
          activeFogRealm === "void"
            ? 45
            : activeFogRealm === "machine"
            ? 34
            : activeFogRealm === "ocean"
            ? 38
            : activeFogRealm === "forest"
            ? 32
            : 28,
        ]}
      />

      {/* Unified World Metamorphosis Manager */}
      <WorldManager />
    </>
  );
}
