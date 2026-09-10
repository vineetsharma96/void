"use client";

import React from "react";
import { useWorldStore, RealmId, CameraMode } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { Compass, Eye, Video } from "lucide-react";

import { transitionManager } from "@/engine/transition/TransitionManager";

interface RealmItem {
  id: RealmId;
  label: string;
  number: string;
  available: boolean;
}

const REALMS: RealmItem[] = [
  { id: "origin", label: "ORIGIN", number: "01", available: true },
  { id: "forest", label: "FOREST", number: "02", available: true },
  { id: "ocean", label: "OCEAN", number: "03", available: true },
  { id: "machine", label: "MACHINE", number: "04", available: true },
  { id: "void", label: "VOID", number: "05", available: true },
];

export function Navigation() {
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const targetRealm = useWorldStore((s) => s.targetRealm);
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const setCameraMode = useWorldStore((s) => s.actions.setCameraMode);

  const handleSelectRealm = (realm: RealmItem) => {
    if (!realm.available) return;
    transitionManager.transitionTo(realm.id);
  };

  const handleCameraMode = (mode: CameraMode) => {
    audioEngine.triggerClickFoley();
    setCameraMode(mode);
  };

  return (
    <nav
      aria-label="Cosmic Navigation & Camera"
      className="pointer-events-none fixed inset-x-0 bottom-3 sm:bottom-6 z-20 flex flex-col items-center gap-2 sm:gap-3 px-2 sm:px-4 font-mono select-none"
    >
      {/* Realm Navigator Bar */}
      <div
        role="tablist"
        aria-label="Cosmological Realms"
        className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-void-950/90 border border-void-700/60 backdrop-blur-xl shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto no-scrollbar"
      >
        {REALMS.map((r) => {
          const isTarget = targetRealm === r.id;
          const isActive = isTarget || (!targetRealm && currentRealm === r.id);
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`Realm ${r.number}: ${r.label}`}
              onClick={() => handleSelectRealm(r)}
              disabled={!r.available}
              className={`relative px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium tracking-wider transition-all flex items-center gap-1 sm:gap-2 shrink-0 focus-visible:ring-2 focus-visible:ring-amber-glow focus-visible:outline-none ${
                isTarget
                  ? "bg-void-800 text-amber-glow border border-amber-glow animate-pulse"
                  : isActive
                  ? "bg-void-700 text-void-100 shadow-inner border border-void-500/50"
                  : r.available
                  ? "text-void-400 hover:text-void-100 hover:bg-void-850"
                  : "text-void-600 opacity-50 cursor-not-allowed"
              }`}
            >
              <span className={`text-[8px] sm:text-[9px] ${isActive ? "text-amber-glow" : "text-void-500"}`}>
                {r.number}
              </span>
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Camera Mode Selector */}
      <div
        role="group"
        aria-label="Camera Perspective Controls"
        className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-void-400 bg-void-950/75 border border-void-800/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md"
      >
        <span className="text-void-600 mr-1 sm:mr-1.5 uppercase tracking-wider text-[8px] sm:text-[9px]">CAM:</span>
        <button
          onClick={() => handleCameraMode("cinematic")}
          aria-pressed={cameraMode === "cinematic"}
          aria-label="Switch to Cinematic Camera"
          className={`px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 transition-colors focus-visible:ring-1 focus-visible:ring-ion-cyan focus-visible:outline-none ${
            cameraMode === "cinematic" ? "bg-void-700 text-ion-cyan font-bold" : "hover:text-void-200"
          }`}
        >
          <Video className="w-2.5 h-2.5" /> CINEMATIC
        </button>
        <button
          onClick={() => handleCameraMode("orbit")}
          aria-pressed={cameraMode === "orbit"}
          aria-label="Switch to Orbit Camera"
          className={`px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 transition-colors focus-visible:ring-1 focus-visible:ring-ion-cyan focus-visible:outline-none ${
            cameraMode === "orbit" ? "bg-void-700 text-ion-cyan font-bold" : "hover:text-void-200"
          }`}
        >
          <Compass className="w-2.5 h-2.5" /> ORBIT
        </button>
        <button
          onClick={() => handleCameraMode("inspect")}
          aria-pressed={cameraMode === "inspect"}
          aria-label="Switch to Inspect Camera"
          className={`px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 transition-colors focus-visible:ring-1 focus-visible:ring-ion-cyan focus-visible:outline-none ${
            cameraMode === "inspect" ? "bg-void-700 text-ion-cyan font-bold" : "hover:text-void-200"
          }`}
        >
          <Eye className="w-2.5 h-2.5" /> INSPECT
        </button>
      </div>
    </nav>
  );
}
