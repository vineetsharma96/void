"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";

export function VirtualJoystick() {
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const setMoveInput = useWorldStore((s) => s.actions.setMoveInput);

  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const radius = 42; // Max pixel displacement

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      setIsActive(true);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rawDx = touch.clientX - centerX;
      const rawDy = touch.clientY - centerY;
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      const angle = Math.atan2(rawDy, rawDx);
      const clampedDist = Math.min(dist, radius);

      const x = Math.cos(angle) * clampedDist;
      const y = Math.sin(angle) * clampedDist;

      setKnobPos({ x, y });
      setMoveInput({
        right: x / radius,
        forward: -y / radius,
      });
    },
    [radius, setMoveInput]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!isActive || touchIdRef.current === null || !containerRef.current) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const rawDx = touch.clientX - centerX;
          const rawDy = touch.clientY - centerY;
          const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
          const angle = Math.atan2(rawDy, rawDx);
          const clampedDist = Math.min(dist, radius);

          const x = Math.cos(angle) * clampedDist;
          const y = Math.sin(angle) * clampedDist;

          setKnobPos({ x, y });
          setMoveInput({
            right: x / radius,
            forward: -y / radius,
          });
          break;
        }
      }
    },
    [isActive, radius, setMoveInput]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (touchIdRef.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setIsActive(false);
          setKnobPos({ x: 0, y: 0 });
          setMoveInput({ forward: 0, right: 0 });
          break;
        }
      }
    },
    [setMoveInput]
  );

  // Auto-reset if mode switches away from explore
  useEffect(() => {
    if (cameraMode !== "explore") {
      setKnobPos({ x: 0, y: 0 });
      setIsActive(false);
      setMoveInput({ forward: 0, right: 0 });
    }
  }, [cameraMode, setMoveInput]);

  if (cameraMode !== "explore") return null;

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-24 left-5 z-40 w-24 h-24 rounded-full border border-void-700/60 bg-void-950/70 backdrop-blur-md flex items-center justify-center pointer-events-auto touch-none select-none transition-opacity duration-300 md:hidden ${
        isActive ? "opacity-95 ring-2 ring-ion-cyan/40" : "opacity-65"
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      aria-label="Virtual Movement Joystick"
    >
      {/* Joystick Center Crosshair */}
      <div className="absolute w-8 h-8 rounded-full border border-void-800/80 pointer-events-none" />

      {/* Dynamic Thumb Knob */}
      <div
        className="w-10 h-10 rounded-full bg-gradient-to-br from-ion-cyan/70 to-void-700/80 border border-ion-cyan/80 shadow-[0_0_12px_rgba(40,240,220,0.35)] pointer-events-none transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
        }}
      />
    </div>
  );
}
