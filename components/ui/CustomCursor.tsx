"use client";

import React, { useEffect, useState, useRef } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";

export function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pointer = useWorldStore((s) => s.pointer);
  const shockwave = useWorldStore((s) => s.shockwave);
  const [rippleActive, setRippleActive] = useState(false);
  const ripplePos = useRef({ x: -100, y: -100 });

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  // Trigger shockwave visual ripple on canvas click/tap
  useEffect(() => {
    if (shockwave.time > 0) {
      ripplePos.current = { x: mousePos.current.x, y: mousePos.current.y };
      setRippleActive(true);
      const timer = setTimeout(() => setRippleActive(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shockwave.time]);

  useEffect(() => {
    // Detect touch primary device
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Detect if hovering over clickable elements
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "BUTTON" || target.tagName === "A" || target.closest("button") || target.closest("a"))) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    const render = () => {
      // Smooth lerp for trailing ring
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x - 3}px, ${mousePos.current.y - 3}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x - (isHovered ? 24 : 16)}px, ${
          ringPos.current.y - (isHovered ? 24 : 16)
        }px, 0)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered]);

  if (isTouchDevice) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* Central Micro Dot */}
      <div
        ref={dotRef}
        className={`absolute top-0 left-0 w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
          pointer.isDown ? "bg-amber-glow scale-150" : isHovered ? "bg-ion-cyan" : "bg-void-100"
        }`}
      />

      {/* Trailing Reticle Ring */}
      <div
        ref={ringRef}
        className={`absolute top-0 left-0 rounded-full border transition-all duration-200 ease-out ${
          isHovered
            ? "w-12 h-12 border-ion-cyan/80 border-dashed animate-spin"
            : pointer.isDown
            ? "w-8 h-8 border-amber-glow/90 scale-90"
            : "w-8 h-8 border-void-400/40"
        }`}
      />

      {/* Radiating Shockwave Impulse Ripple */}
      {rippleActive && (
        <div
          className="absolute top-0 left-0 rounded-full border border-amber-glow/80 pointer-events-none animate-ping"
          style={{
            transform: `translate3d(${ripplePos.current.x - 28}px, ${ripplePos.current.y - 28}px, 0)`,
            width: "56px",
            height: "56px",
            animationDuration: "0.45s",
          }}
        />
      )}
    </div>
  );
}
