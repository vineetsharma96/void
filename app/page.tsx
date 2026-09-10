"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { TelemetryHUD } from "@/components/ui/TelemetryHUD";
import { Navigation } from "@/components/ui/Navigation";
import { AudioToggle } from "@/components/ui/AudioToggle";
import { QualitySelector } from "@/components/ui/QualitySelector";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { OpeningSequence } from "@/components/overlay/OpeningSequence";
import { VoidLite } from "@/components/ui/VoidLite";

// Dynamically import Three.js SceneView with ssr: false for client-only WebGL rendering
const SceneView = dynamic(
  () => import("@/components/canvas/SceneView").then((mod) => mod.SceneView),
  { ssr: false }
);

import { transitionManager } from "@/engine/transition/TransitionManager";
import { RealmId } from "@/engine/state/useWorldStore";

export default function VoidExperience() {
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const seed = useWorldStore((s) => s.seed);
  const isLiteFallback = useWorldStore((s) => s.isLiteFallback);
  const toggleLiteFallback = useWorldStore((s) => s.actions.toggleLiteFallback);
  const toggleAudio = useWorldStore((s) => s.actions.toggleAudio);
  const audioVolume = useWorldStore((s) => s.audioVolume);
  const setSeed = useWorldStore((s) => s.actions.setSeed);
  const setRealm = useWorldStore((s) => s.actions.setRealm);

  const screenReaderAnnouncement = useWorldStore((s) => s.screenReaderAnnouncement);
  const setReducedMotion = useWorldStore((s) => s.actions.setReducedMotion);
  const triggerShockwave = useWorldStore((s) => s.actions.triggerShockwave);
  const announce = useWorldStore((s) => s.actions.announce);

  // Detect and synchronize system prefers-reduced-motion setting
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setReducedMotion]);

  // Restore seed & realm from URL query parameters on initial load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlSeed = params.get("seed");
    const urlRealm = params.get("realm");

    if (urlSeed) {
      const parsedSeed = parseInt(urlSeed, 10);
      if (!isNaN(parsedSeed)) setSeed(parsedSeed);
    }
    if (urlRealm && ["origin", "forest", "ocean", "machine", "void"].includes(urlRealm)) {
      setRealm(urlRealm as RealmId);
    }
  }, [setSeed, setRealm]);

  // Synchronize current seed & realm back into URL query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("seed", seed.toString());
    url.searchParams.set("realm", currentRealm);
    window.history.replaceState(null, "", url.toString());
  }, [seed, currentRealm]);

  // Keyboard navigation & accessibility shortcut listeners
  useEffect(() => {
    const realmsOrder: RealmId[] = ["origin", "forest", "ocean", "machine", "void"];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when typing into input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "m" || e.key === "M") {
        const store = useWorldStore.getState();
        const nextState = !store.audioEnabled;
        toggleAudio(nextState);
        audioEngine.setMuted(!nextState, audioVolume);
      } else if (e.key === "l" || e.key === "L") {
        toggleLiteFallback();
      } else if (e.key === "1") {
        transitionManager.transitionTo("origin");
      } else if (e.key === "2") {
        transitionManager.transitionTo("forest");
      } else if (e.key === "3") {
        transitionManager.transitionTo("ocean");
      } else if (e.key === "4") {
        transitionManager.transitionTo("machine");
      } else if (e.key === "5") {
        transitionManager.transitionTo("void");
      } else if (e.key === "ArrowRight") {
        const currIndex = realmsOrder.indexOf(currentRealm);
        const nextIndex = (currIndex + 1) % realmsOrder.length;
        transitionManager.transitionTo(realmsOrder[nextIndex]);
      } else if (e.key === "ArrowLeft") {
        const currIndex = realmsOrder.indexOf(currentRealm);
        const prevIndex = (currIndex - 1 + realmsOrder.length) % realmsOrder.length;
        transitionManager.transitionTo(realmsOrder[prevIndex]);
      } else if (e.code === "Space") {
        e.preventDefault();
        triggerShockwave([0, 0, 0], 28.0);
        audioEngine.triggerShockwaveImpulse(1.5);
        announce("Procedural shockwave detonated.");
      } else if (e.key === "r" || e.key === "R") {
        const newSeed = Math.floor(Math.random() * 900000) + 100000;
        setSeed(newSeed);
        audioEngine.triggerDataRegenArpeggio();
        announce(`Cosmic seed regenerated to ${newSeed}`);
      } else if (e.key === "s" || e.key === "S") {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          audioEngine.triggerClickFoley();
          announce("Cosmic state URL copied to clipboard.");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleAudio, toggleLiteFallback, audioVolume, currentRealm, triggerShockwave, setSeed, announce]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-void-950 font-sans">
      {/* Screen Reader ARIA-Live Announcement Region for Realm Changes & State Events */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {screenReaderAnnouncement}
      </div>

      {/* Accessible Screen Reader Skip Link */}
      <a
        href="#cosmic-viewport"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-void-900 focus:text-amber-glow focus:border focus:border-amber-glow focus:rounded-md focus:font-mono focus:text-xs"
      >
        Skip to Cosmic Canvas
      </a>

      {/* 3D WebGL Scene or 2D VOID LITE Fallback */}
      <div id="cosmic-viewport" className="w-full h-full">
        {isLiteFallback ? <VoidLite /> : <SceneView />}
      </div>

      {/* Subtle CRT Scanline atmospheric texture */}
      <div className="scanline-overlay absolute inset-0 pointer-events-none z-10 opacity-60" />

      {/* Central Identity & Philosophy Watermark */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 pointer-events-none z-10 hidden xl:flex flex-col gap-1 font-mono text-[10px] text-void-500/40 select-none">
        <div>MATRICES: PROCEDURAL GEOMETRY</div>
        <div>ALGORITHM: GOLDEN RATIO GEODESICS</div>
        <div>PHYSICS: DIVERGENCE-FREE CURL FIELDS</div>
        <div>ASSETS: 0.00 KB LOADED</div>
      </div>

      <div className="absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none z-10 hidden xl:flex flex-col items-end gap-1 font-mono text-[10px] text-void-500/40 select-none text-right">
        <div>COSMOS: VOID ENGINE V1.0</div>
        <div>KERNEL: THREE.JS + GLSL</div>
        <div>AUDIO: WEBAUDIO HARMONIC DRIFT</div>
        <div>STATUS: SYNCHRONIZED</div>
      </div>

      {/* Interactive HUD Elements */}
      <TelemetryHUD />
      <AudioToggle />
      <Navigation />
      <QualitySelector />

      {/* Desktop Custom Reactive Cursor */}
      <CustomCursor />

      {/* Cinematic Opening Sequence */}
      <OpeningSequence />
    </main>
  );
}
