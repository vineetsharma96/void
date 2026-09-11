"use client";

import React from "react";
import { useWorldStore, RealmId, CameraMode } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { Compass, Eye, Video, Footprints } from "lucide-react";

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
  const discoveries = useWorldStore((s) => s.discoveries);
  const setCameraMode = useWorldStore((s) => s.actions.setCameraMode);
  const announce = useWorldStore((s) => s.actions.announce);

  const totalDiscoveries =
    discoveries.signals.length + discoveries.structures.length + discoveries.portals.length;

  const handleRealmClick = (id: RealmId) => {
    if (targetRealm || currentRealm === id) return;
    audioEngine.triggerRealmTransition();
    transitionManager.transitionTo(id);
  };

  const handleCameraMode = (mode: CameraMode) => {
    setCameraMode(mode);
    audioEngine.triggerUIHoverBeep();
    announce(`Camera mode set to ${mode}`);
  };

  return (
    <nav
      aria-label="Realms and Navigation Controls"
      className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 sm:gap-2 pointer-events-none select-none max-w-[calc(100vw-1rem)]"
    >
      {/* Realm Selection Dock */}
      <div
        role="tablist"
        aria-label="Procedural Realms"
        className="pointer-events-auto flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-full bg-void-950/75 border border-void-800/80 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] max-w-full overflow-x-auto no-scrollbar"
      >
        {REALMS.map((realm) => {
          const isActive = currentRealm === realm.id;
          const isTarget = targetRealm === realm.id;

          return (
            <button
              key={realm.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`Enter Realm ${realm.number}: ${realm.label}`}
              onClick={() => handleRealmClick(realm.id)}
              className={`relative px-2.5 sm:px-4 py-1 sm:py-2 rounded-full font-mono text-[10px] sm:text-xs tracking-wider transition-all duration-300 flex items-center gap-1 sm:gap-2 shrink-0 focus-visible:ring-2 focus-visible:ring-ion-cyan focus-visible:outline-none ${
                isActive
                  ? "bg-void-800 text-ion-cyan border border-ion-cyan/40 shadow-[0_0_12px_rgba(40,240,220,0.2)]"
                  : isTarget
                  ? "bg-void-900 text-ion-amber animate-pulse border border-ion-amber/30"
                  : "text-void-400 hover:text-void-100 hover:bg-void-900/60"
              }`}
            >
              <span className="text-[8px] sm:text-[10px] opacity-60">{realm.number}</span>
              <span className="font-sans font-medium tracking-normal text-[11px] sm:text-xs">
                {realm.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-ion-cyan shadow-[0_0_6px_rgba(40,240,220,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Camera Mode Selector & Discovery Status */}
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Camera Perspective Controls"
          className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-void-400 bg-void-950/75 border border-void-800/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md"
        >
          <span className="text-void-600 mr-1 sm:mr-1.5 uppercase tracking-wider text-[8px] sm:text-[9px]">CAM:</span>
          <button
            onClick={() => handleCameraMode("explore")}
            aria-pressed={cameraMode === "explore"}
            aria-label="Switch to Free Explore Camera"
            className={`px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 transition-colors focus-visible:ring-1 focus-visible:ring-ion-cyan focus-visible:outline-none ${
              cameraMode === "explore" ? "bg-void-700 text-ion-cyan font-bold" : "hover:text-void-200"
            }`}
          >
            <Footprints className="w-2.5 h-2.5" /> EXPLORE
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

        {totalDiscoveries > 0 && (
          <div className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-ion-amber bg-void-950/80 border border-ion-amber/40 px-2 py-0.5 rounded-full backdrop-blur-md animate-pulse">
            <span>✦</span> {totalDiscoveries} UNLOCKED
          </div>
        )}
      </div>
    </nav>
  );
}
