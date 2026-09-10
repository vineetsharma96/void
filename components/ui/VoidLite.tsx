"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { interactionEngine } from "@/engine/interaction/InteractionEngine";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { perlin3D } from "@/engine/math/noise";

interface Shockwave2D {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export function VoidLite() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const seed = useWorldStore((s) => s.seed);
  const pointer = useWorldStore((s) => s.pointer);
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  const toggleLiteFallback = useWorldStore((s) => s.actions.toggleLiteFallback);

  const activeRipples = useRef<Shockwave2D[]>([]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      interactionEngine.handlePointerMove(e.clientX, e.clientY, rect);
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      interactionEngine.triggerShockwave(normX, normY, 1.0);

      // Spawn 2D visual shockwave ripple
      activeRipples.current.push({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
        radius: 4,
        maxRadius: 180,
        alpha: 0.9,
      });
    },
    []
  );

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    interactionEngine.handleTouchStart(e);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    interactionEngine.handleTouchMove(e);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    interactionEngine.handleTouchEnd(e);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // 2D Particle System for VOID LITE
    const particleCount = 450;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: 1.2 + Math.random() * 2,
      baseAlpha: 0.2 + Math.random() * 0.6,
      angle: (i / particleCount) * Math.PI * 2,
      radius: 50 + Math.random() * (Math.min(width, height) * 0.4),
      speed: 0.002 + Math.random() * 0.005,
    }));

    let time = 0;

    const render = () => {
      // Time delta scaled by reducedMotion setting
      const dt = reducedMotion ? 0.004 : 0.016;
      time += dt;

      // Dark background clear with subtle trail persistence
      ctx.fillStyle = "rgba(5, 6, 8, 0.25)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      ctx.save();
      ctx.translate(cx, cy);

      // Concentric orbital circles
      ctx.strokeStyle = "rgba(58, 65, 80, 0.25)";
      ctx.lineWidth = 1;
      for (let r = 80; r <= 320; r += 60) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (currentRealm === "forest") {
        // 2D Recursive Botanical Fractal Tree
        ctx.strokeStyle = "rgba(46, 237, 134, 0.75)";
        ctx.lineWidth = 1.8;

        const drawBranch2D = (x: number, y: number, length: number, angle: number, depth: number) => {
          if (depth <= 0) {
            ctx.fillStyle = "rgba(152, 247, 197, 0.85)";
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            return;
          }

          const endX = x + Math.cos(angle) * length;
          const endY = y + Math.sin(angle) * length;

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          const sway = reducedMotion ? 0 : Math.sin(time * 1.5 + depth) * 0.08 + pointer.x * 0.05;
          drawBranch2D(endX, endY, length * 0.72, angle - 0.45 + sway, depth - 1);
          drawBranch2D(endX, endY, length * 0.72, angle + 0.45 + sway, depth - 1);
        };

        const treeBaseY = height * 0.35;
        drawBranch2D(-width * 0.25, treeBaseY, height * 0.18, -Math.PI / 2, 5);
        drawBranch2D(0, treeBaseY + 20, height * 0.22, -Math.PI / 2, 6);
        drawBranch2D(width * 0.25, treeBaseY, height * 0.18, -Math.PI / 2, 5);
      } else if (currentRealm === "ocean") {
        // 2D Multi-Octave Mathematical Gerstner Ocean Waves
        const waveLayers = [
          { amp: 28, freq: 0.008, speed: 2.2, color: "rgba(0, 255, 204, 0.7)", yOff: -20 },
          { amp: 20, freq: 0.015, speed: -1.8, color: "rgba(8, 56, 77, 0.85)", yOff: 10 },
          { amp: 14, freq: 0.025, speed: 3.1, color: "rgba(200, 240, 238, 0.8)", yOff: 35 },
        ];

        waveLayers.forEach((w) => {
          ctx.strokeStyle = w.color;
          ctx.lineWidth = 2;
          ctx.beginPath();

          for (let x = -width / 2; x <= width / 2; x += 6) {
            const waveSpeed = reducedMotion ? w.speed * 0.2 : w.speed;
            const waveY =
              Math.sin(x * w.freq + time * waveSpeed) * w.amp +
              Math.cos(x * w.freq * 2.2 - time * 1.2) * (w.amp * 0.4) +
              w.yOff +
              pointer.y * 15;

            if (x === -width / 2) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        });
      } else if (currentRealm === "machine") {
        // 2D Synchronized Mechanical Gear Schematic
        const drawGear2D = (gcx: number, gcy: number, r: number, teeth: number, rot: number, color: string) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const step = (Math.PI * 2) / teeth;

          for (let i = 0; i < teeth; i++) {
            const a = i * step + rot;
            const rOut = r * 1.15;
            const rIn = r * 0.88;

            const x1 = gcx + Math.cos(a) * rIn;
            const y1 = gcy + Math.sin(a) * rIn;
            const x2 = gcx + Math.cos(a + step * 0.25) * rOut;
            const y2 = gcy + Math.sin(a + step * 0.25) * rOut;
            const x3 = gcx + Math.cos(a + step * 0.55) * rOut;
            const y3 = gcy + Math.sin(a + step * 0.55) * rOut;
            const x4 = gcx + Math.cos(a + step * 0.8) * rIn;
            const y4 = gcy + Math.sin(a + step * 0.8) * rIn;

            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.lineTo(x4, y4);
          }
          ctx.closePath();
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(gcx, gcy, r * 0.35, 0, Math.PI * 2);
          ctx.stroke();
        };

        const gearSpeed = time * (reducedMotion ? 0.4 : 1.5 + Math.abs(pointer.x) * 2.0);
        drawGear2D(0, 0, 75, 18, gearSpeed, "rgba(229, 169, 60, 0.85)");
        const pDist = 125;
        drawGear2D(pDist, 0, 42, 10, -gearSpeed * 1.8, "rgba(200, 240, 238, 0.75)");
        drawGear2D(-pDist, 0, 42, 10, -gearSpeed * 1.8, "rgba(200, 240, 238, 0.75)");
        drawGear2D(0, pDist, 42, 10, -gearSpeed * 1.8, "rgba(200, 240, 238, 0.75)");
        drawGear2D(0, -pDist, 42, 10, -gearSpeed * 1.8, "rgba(200, 240, 238, 0.75)");
      } else if (currentRealm === "void") {
        // 2D Relativistic Singularity & Event Horizon
        const singularityRadius = 55;

        ctx.strokeStyle = "rgba(229, 169, 60, 0.75)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 8; a += 0.1) {
          const r = singularityRadius + a * 14;
          const spiralAngle = a - time * (reducedMotion ? 0.4 : 1.8);
          const x = Math.cos(spiralAngle) * r;
          const y = Math.sin(spiralAngle) * r * 0.45;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = "rgba(200, 240, 238, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, singularityRadius * 1.35, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(0, 0, singularityRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Harmonic Lissajous Origin Core
        ctx.strokeStyle = "rgba(226, 232, 240, 0.65)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const lissajousPoints = 200;
        const aFreq = 3;
        const bFreq = 4;
        const deltaPhase = time * (reducedMotion ? 0.2 : 0.8) + (seed % 100) * 0.05;
        const scale = Math.min(width, height) * 0.22;

        for (let i = 0; i <= lissajousPoints; i++) {
          const theta = (i / lissajousPoints) * Math.PI * 2;
          const noiseVal = perlin3D(theta * 2, time * 0.5, seed * 0.01) * 25;
          const x = (scale + noiseVal) * Math.sin(aFreq * theta + deltaPhase) + pointer.x * 20;
          const y = (scale + noiseVal) * Math.sin(bFreq * theta) - pointer.y * 20;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Amber Core Ring
        ctx.strokeStyle = "rgba(229, 169, 60, 0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const innerScale = scale * 0.45;
        for (let i = 0; i <= 60; i++) {
          const theta = (i / 60) * Math.PI * 2;
          const x = innerScale * Math.cos(theta + time * 0.5);
          const y = innerScale * Math.sin(theta + time * 0.5);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 2. Render 2D Vector Flow Particles
      particles.forEach((p) => {
        p.angle += reducedMotion ? p.speed * 0.25 : p.speed;
        const targetX = Math.cos(p.angle) * p.radius + pointer.x * 35;
        const targetY = Math.sin(p.angle) * p.radius - pointer.y * 35;

        const mouseScreenX = pointer.x * (width / 2);
        const mouseScreenY = -pointer.y * (height / 2);
        const dx = targetX - mouseScreenX;
        const dy = targetY - mouseScreenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let finalX = targetX;
        let finalY = targetY;
        if (dist < 120) {
          const repel = (1 - dist / 120) * 35;
          finalX += (dx / dist) * repel;
          finalY += (dy / dist) * repel;
        }

        ctx.fillStyle = dist < 120 ? "rgba(229, 169, 60, 0.9)" : `rgba(200, 240, 238, ${p.baseAlpha})`;
        ctx.beginPath();
        ctx.arc(finalX, finalY, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Render 2D Expanding Shockwave Ripples
      for (let i = activeRipples.current.length - 1; i >= 0; i--) {
        const r = activeRipples.current[i];
        r.radius += 5.5;
        r.alpha *= 0.93;

        ctx.save();
        ctx.strokeStyle = `rgba(229, 169, 60, ${r.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (r.radius > r.maxRadius || r.alpha < 0.02) {
          activeRipples.current.splice(i, 1);
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentRealm, seed, pointer, reducedMotion]);

  return (
    <div className="relative w-full h-full inset-0 overflow-hidden bg-void-950 select-none touch-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* VOID LITE Information Badge */}
      <div className="absolute top-20 left-6 z-20 pointer-events-auto bg-void-950/80 border border-void-700/80 backdrop-blur-md p-3 rounded text-[11px] font-mono text-void-300 max-w-xs shadow-xl">
        <div className="text-amber-glow font-bold tracking-wider mb-1 flex items-center justify-between">
          <span>// VOID LITE ACTIVE</span>
          <button
            onClick={() => toggleLiteFallback(false)}
            className="text-void-400 hover:text-ion-cyan border border-void-700 px-1.5 py-0.5 text-[9px] rounded transition-colors focus-visible:ring-2 focus-visible:ring-amber-glow focus-visible:outline-none"
            aria-label="Switch from 2D Canvas fallback to 3D WebGL experience"
          >
            SWITCH TO 3D
          </button>
        </div>
        <p className="text-void-400 leading-relaxed text-[10px]">
          Rendering via high-precision 2D Canvas mathematics and parametric harmonic oscillators. Zero 3D models.
        </p>
      </div>
    </div>
  );
}
