"use client";

import React, { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { performanceGovernor } from "@/engine/performance/PerformanceMonitor";
import { CameraRig } from "./CameraRig";
import { WorldManager } from "@/worlds/WorldManager";

export function Experience() {
  const { gl } = useThree();
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const targetRealm = useWorldStore((s) => s.targetRealm);
  const transitionProgress = useWorldStore((s) => s.transitionProgress);
  const quality = useWorldStore((s) => s.quality);
  const updateTelemetry = useWorldStore((s) => s.actions.updateTelemetry);
  const setQuality = useWorldStore((s) => s.actions.setQuality);

  useFrame(() => {
    // Record performance & evaluate adaptive quality
    const { fps, recommendedTier } = performanceGovernor.recordFrame();

    // Query WebGL renderer stats
    const info = gl.info;
    updateTelemetry({
      fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
    });

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

      {/* Background Fog tailored per environment */}
      <color attach="background" args={[fogColor]} />
      <fog
        attach="fog"
        args={[
          fogColor,
          activeFogRealm === "void" ? 16 : activeFogRealm === "machine" ? 14 : activeFogRealm === "ocean" ? 12 : activeFogRealm === "forest" ? 10 : 8,
          activeFogRealm === "void" ? 45 : activeFogRealm === "machine" ? 34 : activeFogRealm === "ocean" ? 38 : activeFogRealm === "forest" ? 32 : 28,
        ]}
      />

      {/* Unified World Metamorphosis Manager */}
      <WorldManager />
    </>
  );
}
