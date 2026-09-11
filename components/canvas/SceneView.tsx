"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { interactionEngine } from "@/engine/interaction/InteractionEngine";
import { raycastManager } from "@/engine/interaction/RaycastManager";
import { VirtualJoystick } from "@/components/ui/VirtualJoystick";
import { Experience } from "./Experience";
import { Effects } from "./Effects";

export function SceneView() {
  const quality = useWorldStore((s) => s.quality);
  const isLiteFallback = useWorldStore((s) => s.isLiteFallback);
  const toggleLiteFallback = useWorldStore((s) => s.actions.toggleLiteFallback);

  const dpr = useMemo(() => {
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || /Android|iPhone|iPad/i.test(navigator.userAgent));

    if (isMobile) {
      return quality === "ultra" ? 1.25 : quality === "low" ? 0.75 : 1.0;
    }

    switch (quality) {
      case "ultra": return Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 2, 2.0);
      case "high": return 1.5;
      case "medium": return 1.0;
      case "low": return 0.85;
      default: return 1.0;
    }
  }, [quality]);

  // Periodic velocity decay update
  useEffect(() => {
    let animId: number;
    const tick = () => {
      interactionEngine.updateDecay();
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      interactionEngine.handlePointerMove(e.clientX, e.clientY, rect);
    },
    []
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    interactionEngine.handlePointerDown(e.clientX, e.clientY, rect);
  }, []);

  const handlePointerUp = useCallback(() => {
    interactionEngine.handlePointerUp();
  }, []);

  // Click/tap generates a physical shockwave impulse & triggers object interaction if focused
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const interacted = raycastManager.handleInteraction();
    if (!interacted) {
      const rect = e.currentTarget.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      interactionEngine.triggerShockwave(normX, normY, 1.0);
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    interactionEngine.handleWheel(e);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    interactionEngine.handleTouchStart(e);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    interactionEngine.handleTouchMove(e);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    interactionEngine.handleTouchEnd(e);
  }, []);

  if (isLiteFallback) {
    return null; // Fallback canvas is rendered by VoidLite.tsx in page.tsx
  }

  return (
    <div
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none touch-none"
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <Canvas
        camera={{ position: [0, 0, 16], fov: 55, near: 0.1, far: 60 }}
        dpr={dpr}
        gl={{
          antialias: quality !== "low",
          powerPreference: "high-performance",
          alpha: false,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            console.warn("WebGL Context Lost. Activating VOID LITE fallback.");
            toggleLiteFallback(true);
          });
        }}
      >
        <Experience />
        <Effects />
      </Canvas>

      {/* Mobile Virtual Joystick for spatial flight in Explore mode */}
      <VirtualJoystick />
    </div>
  );
}
