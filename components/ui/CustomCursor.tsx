"use client";

import React, { useEffect, useState, useRef } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";

export function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isPointerDown = useWorldStore((s) => s.pointer.isDown);
  const shockwaveTime = useWorldStore((s) => s.shockwave.time);
  const focusedObjectId = useWorldStore((s) => s.focusedObjectId);
  const reticleMode = useWorldStore((s) => s.reticleMode);
  const [rippleActive, setRippleActive] = useState(false);
  const ripplePos = useRef({ x: -100, y: -100 });

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  // Trigger shockwave visual ripple on canvas click/tap
  useEffect(() => {
    if (shockwaveTime > 0) {
      ripplePos.current = { x: mousePos.current.x, y: mousePos.current.y };
      setRippleActive(true);
      const timer = setTimeout(() => setRippleActive(false), 450);
      return () => clearTimeout(timer);
    }
  }, [shockwaveTime]);

  useEffect(() => {
    const checkIsTouch = () => {
      return (
        window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        "ontouchstart" in window
      );
    };

    if (checkIsTouch()) {
      setIsTouchDevice(true);
      return;
    }

    const onTouch = () => setIsTouchDevice(true);
    window.addEventListener("touchstart", onTouch, { once: true, passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      const target = e.target as HTMLElement | null;
      const clickable = Boolean(
        target &&
          (target.tagName === "BUTTON" ||
            target.tagName === "A" ||
            target.closest("button") ||
            target.closest("a"))
      );
      setIsHovered((prev) => (prev !== clickable ? clickable : prev));
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId: number;
    const render = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.22;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.22;

      const isTargeted = isHovered || focusedObjectId !== null;
      const targetSize = isTargeted ? 24 : 16;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x - 3}px, ${mousePos.current.y - 3}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x - targetSize}px, ${
          ringPos.current.y - targetSize
        }px, 0)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered, focusedObjectId]);

  if (isTouchDevice) return null;

  const isFocus = focusedObjectId !== null || reticleMode === "focus";
  const isInteract = reticleMode === "interact";

  return (
    <div className="hidden md:block pointer-events-none fixed inset-0 z-50 overflow-hidden select-none font-sans">
      {/* Central Micro Dot */}
      <div
        ref={dotRef}
        className={`absolute top-0 left-0 w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
          isInteract
            ? "bg-amber-glow scale-150"
            : isFocus
            ? "bg-ion-cyan scale-125"
            : isPointerDown
            ? "bg-amber-glow scale-150"
            : isHovered
            ? "bg-ion-cyan"
            : "bg-void-100"
        }`}
      />

      {/* Trailing Reticle Ring */}
      <div
        ref={ringRef}
        className={`absolute top-0 left-0 rounded-full ring-1 transition-colors duration-200 ease-out flex items-center justify-center ${
          isInteract
            ? "w-12 h-12 ring-amber-glow"
            : isFocus
            ? "w-12 h-12 ring-ion-cyan"
            : isHovered
            ? "w-12 h-12 ring-ion-cyan/80"
            : isPointerDown
            ? "w-8 h-8 ring-amber-glow/90 scale-90"
            : "w-8 h-8 ring-void-400/40"
        }`}
      >
        {isFocus ? (
          <span className="absolute -top-5 text-[10px] font-medium text-ion-cyan bg-void-900 px-2 py-0.5 rounded-full whitespace-nowrap">
            {focusedObjectId || "Target"}
          </span>
        ) : null}
      </div>

      {/* Radiating Shockwave Impulse Ripple */}
      {rippleActive ? (
        <div
          className="absolute top-0 left-0 rounded-full ring-1 ring-amber-glow/80 pointer-events-none transition-opacity duration-300"
          style={{
            transform: `translate3d(${ripplePos.current.x - 24}px, ${ripplePos.current.y - 24}px, 0)`,
            width: "48px",
            height: "48px",
          }}
        />
      ) : null}
    </div>
  );
}
