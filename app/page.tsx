"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useWorldStore, RealmId } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { transitionManager } from "@/engine/transition/TransitionManager";
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

const REALMS_ORDER: RealmId[] = ["origin", "forest", "ocean", "machine", "void"];

export default function VoidExperience() {
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const seed = useWorldStore((s) => s.seed);
  const isLiteFallback = useWorldStore((s) => s.isLiteFallback);
  const toggleLiteFallback = useWorldStore((s) => s.actions.toggleLiteFallback);
  const toggleAudio = useWorldStore((s) => s.actions.toggleAudio);
  const audioVolume = useWorldStore((s) => s.audioVolume);
  const setSeed = useWorldStore((s) => s.actions.setSeed);
  const setRealm = useWorldStore((s) => s.actions.setRealm);
  const toggleHudCollapsed = useWorldStore((s) => s.actions.toggleHudCollapsed);

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
    if (urlRealm && REALMS_ORDER.includes(urlRealm as RealmId)) {
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "m" || e.key === "M") {
        const store = useWorldStore.getState();
        const nextState = !store.audioEnabled;
        toggleAudio(nextState);
        audioEngine.setMuted(!nextState, audioVolume);
      } else if (e.key === "h" || e.key === "H") {
        toggleHudCollapsed();
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
        const currIndex = REALMS_ORDER.indexOf(currentRealm);
        const nextIndex = (currIndex + 1) % REALMS_ORDER.length;
        transitionManager.transitionTo(REALMS_ORDER[nextIndex]);
      } else if (e.key === "ArrowLeft") {
        const currIndex = REALMS_ORDER.indexOf(currentRealm);
        const prevIndex = (currIndex - 1 + REALMS_ORDER.length) % REALMS_ORDER.length;
        transitionManager.transitionTo(REALMS_ORDER[prevIndex]);
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
  }, [toggleAudio, toggleHudCollapsed, toggleLiteFallback, audioVolume, currentRealm, triggerShockwave, setSeed, announce]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-void-950 font-sans">
      {/* Screen Reader ARIA-Live Announcement Region for Realm Changes & State Events */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {screenReaderAnnouncement}
      </div>

      {/* Accessible Screen Reader Skip Link */}
      <a
        href="#cosmic-viewport"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-void-800 focus:text-amber-glow focus:rounded-md focus:font-sans focus:text-xs"
      >
        Skip to Cosmic Canvas
      </a>

      {/* 3D WebGL Scene or 2D VOID LITE Fallback */}
      <div id="cosmic-viewport" className="w-full h-full">
        {isLiteFallback ? <VoidLite /> : <SceneView />}
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
