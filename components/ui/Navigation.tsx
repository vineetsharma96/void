"use client";

import React from "react";
import { useWorldStore, RealmId, CameraMode } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { Compass, Eye, Video, Footprints, ChevronDown, ChevronUp } from "lucide-react";
import { transitionManager } from "@/engine/transition/TransitionManager";

interface RealmItem {
  id: RealmId;
  label: string;
}

const REALMS: RealmItem[] = [
  { id: "origin", label: "Origin" },
  { id: "forest", label: "Forest" },
  { id: "ocean", label: "Ocean" },
  { id: "machine", label: "Machine" },
  { id: "void", label: "Void" },
];

export function Navigation() {
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const targetRealm = useWorldStore((s) => s.targetRealm);
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const hudCollapsed = useWorldStore((s) => s.hudCollapsed);
  const totalDiscoveries = useWorldStore(
    (s) => s.discoveries.signals.length + s.discoveries.structures.length + s.discoveries.portals.length
  );
  const setCameraMode = useWorldStore((s) => s.actions.setCameraMode);
  const toggleHudCollapsed = useWorldStore((s) => s.actions.toggleHudCollapsed);
  const announce = useWorldStore((s) => s.actions.announce);

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
      className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none select-none max-w-[calc(100vw-1rem)] font-sans"
    >
      {/* Collapsible Cinema / Zen Mode Toggle */}
      <button
        onClick={() => {
          audioEngine.triggerClickFoley();
          toggleHudCollapsed();
        }}
        aria-expanded={!hudCollapsed}
        aria-label={hudCollapsed ? "Show HUD Controls" : "Hide HUD Controls"}
        className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-void-900/90 hover:bg-void-800 text-void-300 hover:text-void-100 text-xs font-medium transition-colors duration-200 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-ion-cyan focus-visible:outline-none"
      >
        {hudCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-ion-cyan" />
            <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-void-400" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {/* Collapsible Dock Container */}
      <div
        className={`flex flex-col items-center gap-1.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          hudCollapsed
            ? "translate-y-32 opacity-0 pointer-events-none h-0 overflow-hidden"
            : "translate-y-0 opacity-100"
        }`}
      >
        {/* Double-Bezel Realm Selection Dock */}
        <div
          role="tablist"
          aria-label="Procedural Realms"
          className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-void-900/95 max-w-full overflow-x-auto no-scrollbar"
        >
          {REALMS.map((realm) => {
            const isActive = currentRealm === realm.id;
            const isTarget = targetRealm === realm.id;

            return (
              <button
                key={realm.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`Enter ${realm.label} Realm`}
                onClick={() => handleRealmClick(realm.id)}
                className={`relative px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 flex items-center gap-2 shrink-0 whitespace-nowrap active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ion-cyan focus-visible:outline-none ${
                  isActive
                    ? "bg-void-800 text-ion-cyan font-semibold"
                    : isTarget
                    ? "bg-void-850 text-amber-glow"
                    : "text-void-300 hover:text-void-100 hover:bg-void-850"
                }`}
              >
                <span>{realm.label}</span>
                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-ion-cyan" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Camera Mode Selector & Discovery Status */}
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Camera Perspective Controls"
            className="pointer-events-auto flex items-center gap-1 text-xs text-void-300 bg-void-900/95 p-1 rounded-full"
          >
            <button
              onClick={() => handleCameraMode("explore")}
              aria-pressed={cameraMode === "explore"}
              aria-label="Switch to Free Explore Camera"
              className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-ion-cyan focus-visible:outline-none ${
                cameraMode === "explore"
                  ? "bg-void-800 text-ion-cyan font-semibold"
                  : "hover:text-void-100 hover:bg-void-850"
              }`}
            >
              <Footprints className="w-3 h-3" />
              <span>Explore</span>
            </button>
            <button
              onClick={() => handleCameraMode("orbit")}
              aria-pressed={cameraMode === "orbit"}
              aria-label="Switch to Orbit Camera"
              className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-ion-cyan focus-visible:outline-none ${
                cameraMode === "orbit"
                  ? "bg-void-800 text-ion-cyan font-semibold"
                  : "hover:text-void-100 hover:bg-void-850"
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Orbit</span>
            </button>
            <button
              onClick={() => handleCameraMode("cinematic")}
              aria-pressed={cameraMode === "cinematic"}
              aria-label="Switch to Cinematic Camera"
              className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-ion-cyan focus-visible:outline-none ${
                cameraMode === "cinematic"
                  ? "bg-void-800 text-ion-cyan font-semibold"
                  : "hover:text-void-100 hover:bg-void-850"
              }`}
            >
              <Video className="w-3 h-3" />
              <span>Cinematic</span>
            </button>
            <button
              onClick={() => handleCameraMode("inspect")}
              aria-pressed={cameraMode === "inspect"}
              aria-label="Switch to Inspect Camera"
              className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-ion-cyan focus-visible:outline-none ${
                cameraMode === "inspect"
                  ? "bg-void-800 text-ion-cyan font-semibold"
                  : "hover:text-void-100 hover:bg-void-850"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Inspect</span>
            </button>
          </div>

          {totalDiscoveries > 0 ? (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-amber-glow bg-void-900/95 px-3 py-1 rounded-full tabular-nums whitespace-nowrap shrink-0">
              <span>{totalDiscoveries} Discovered</span>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
