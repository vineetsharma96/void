"use client";

import React, { useState } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { RefreshCw, Activity, Cpu, Layers, Share2, Check, Edit3 } from "lucide-react";

const REALM_LABELS: Record<string, string> = {
  origin: "Origin",
  forest: "Forest",
  ocean: "Ocean",
  machine: "Machine",
  void: "Void",
};

export function TelemetryHUD() {
  const telemetry = useWorldStore((s) => s.activeTelemetry);
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const seed = useWorldStore((s) => s.seed);
  const quality = useWorldStore((s) => s.quality);
  const isLiteFallback = useWorldStore((s) => s.isLiteFallback);
  const showTelemetry = useWorldStore((s) => s.showTelemetry);
  const hudCollapsed = useWorldStore((s) => s.hudCollapsed);
  const gyroActive = useWorldStore((s) => s.gyro.active);
  const dollyOffset = useWorldStore((s) => s.dollyOffset);
  const randomizeSeed = useWorldStore((s) => s.actions.randomizeSeed);
  const setSeed = useWorldStore((s) => s.actions.setSeed);
  const toggleTelemetry = useWorldStore((s) => s.actions.toggleTelemetry);

  const [isEditingSeed, setIsEditingSeed] = useState(false);
  const [seedInput, setSeedInput] = useState(seed.toString());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRandomize = () => {
    audioEngine.triggerDataRegenArpeggio();
    randomizeSeed();
  };

  const handleSaveSeed = () => {
    const num = parseInt(seedInput, 10);
    if (!isNaN(num) && num > 0) {
      setSeed(num);
      audioEngine.triggerDataRegenArpeggio();
    }
    setIsEditingSeed(false);
  };

  const handleSeedKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveSeed();
    } else if (e.key === "Escape") {
      setSeedInput(seed.toString());
      setIsEditingSeed(false);
    }
  };

  const handleShare = () => {
    audioEngine.triggerClickFoley();
    if (typeof window === "undefined") return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?seed=${seed}&realm=${currentRealm}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setToastMessage("Cosmos link copied to clipboard");
        setTimeout(() => setToastMessage(null), 2400);
      })
      .catch(() => {
        setToastMessage("Cosmos link: " + shareUrl);
        setTimeout(() => setToastMessage(null), 3000);
      });
  };

  if (hudCollapsed) return null;

  return (
    <>
      {/* Toast Notification */}
      {toastMessage ? (
        <div className="fixed top-14 sm:top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none font-sans text-xs font-medium bg-void-900 text-amber-glow px-4 py-2 rounded-full flex items-center gap-2 transition-opacity duration-200">
          <Check className="w-3.5 h-3.5 text-amber-glow" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* Responsive Top Bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 p-3 sm:p-5 z-20 flex justify-between items-center font-sans text-xs text-void-300 select-none">
        {/* Left: Brand Wordmark & Unboxed Realm Metadata */}
        <div className="flex items-center gap-2 pointer-events-auto bg-void-900/90 px-3.5 py-1.5 rounded-full">
          <span className="font-display text-void-100 font-bold text-sm tracking-tight whitespace-nowrap shrink-0">
            VOID
          </span>
          <span aria-hidden="true" className="text-void-500">
            ·
          </span>
          <span className="text-ion-cyan font-medium whitespace-nowrap shrink-0">
            {REALM_LABELS[currentRealm] || "Origin"}
          </span>
          {isLiteFallback ? (
            <>
              <span aria-hidden="true" className="text-void-500">
                ·
              </span>
              <span className="text-amber-glow font-medium whitespace-nowrap shrink-0">
                2D Canvas
              </span>
            </>
          ) : null}
        </div>

        {/* Right: Telemetry Expand/Collapse Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={toggleTelemetry}
            aria-label={showTelemetry ? "Hide Telemetry HUD" : "Show Telemetry HUD"}
            className="text-xs font-medium text-void-300 hover:text-void-100 bg-void-900/90 hover:bg-void-800 px-3.5 py-1.5 rounded-full transition-colors duration-200 flex items-center gap-1.5 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-amber-glow focus-visible:outline-none"
          >
            <Activity className="w-3.5 h-3.5 text-amber-glow" />
            <span>{showTelemetry ? "Hide Telemetry" : "Telemetry"}</span>
          </button>
        </div>
      </div>

      {/* Double-Bezel Telemetry Drawer */}
      {showTelemetry ? (
        <div className="pointer-events-auto fixed top-14 sm:top-16 inset-x-3 sm:inset-x-auto sm:right-5 max-w-sm z-20 mx-auto sm:mx-0 bg-void-900/95 p-1.5 rounded-[1.25rem] font-sans text-xs tabular-nums">
          <div className="bg-void-850 rounded-[calc(1.25rem-0.375rem)] p-3.5 flex flex-col gap-2.5">
            {/* Row 1: Real-time GPU & Engine Metrics */}
            <div className="flex items-center justify-between bg-void-900 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-amber-glow" />
                <span>
                  FPS{" "}
                  <strong
                    className={
                      telemetry.fps >= 50
                        ? "text-green-400"
                        : telemetry.fps >= 30
                        ? "text-amber-300"
                        : "text-red-400"
                    }
                  >
                    {telemetry.fps}
                  </strong>
                </span>
                <span aria-hidden="true" className="text-void-600">
                  ·
                </span>
                <span className="text-ion-cyan font-semibold capitalize">{quality}</span>
              </div>

              <div className="flex items-center gap-2 text-void-300">
                <Layers className="w-3.5 h-3.5 text-ion-cyan" />
                <span>{telemetry.drawCalls} draws</span>
                <span aria-hidden="true" className="text-void-600">
                  ·
                </span>
                <span>{(telemetry.triangles / 1000).toFixed(1)}k tris</span>
              </div>
            </div>

            {/* Row 2: Seed Controls */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-ion-cyan" />
                <span className="text-void-400">Seed</span>
                {isEditingSeed ? (
                  <input
                    type="number"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value)}
                    onKeyDown={handleSeedKeyDown}
                    onBlur={handleSaveSeed}
                    autoFocus
                    className="w-24 bg-void-900 text-void-100 px-2 py-0.5 text-xs rounded outline-none font-semibold tabular-nums"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setSeedInput(seed.toString());
                      setIsEditingSeed(true);
                    }}
                    className="text-void-100 font-semibold hover:text-ion-cyan transition-colors duration-200 flex items-center gap-1 tabular-nums"
                    title="Click to edit seed"
                  >
                    <span>{seed}</span>
                    <Edit3 className="w-3 h-3 text-void-500" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleRandomize}
                  aria-label="Regenerate Cosmic Seed"
                  className="text-void-300 hover:text-amber-glow bg-void-900 hover:bg-void-800 transition-colors duration-200 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium active:scale-[0.98] whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>New Seed</span>
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Copy Deep-Link to Clipboard"
                  className="text-void-300 hover:text-ion-cyan bg-void-900 hover:bg-void-800 transition-colors duration-200 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium active:scale-[0.98] whitespace-nowrap shrink-0"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Row 3: Camera & Sensor Status */}
            <div className="flex items-center justify-between text-xs text-void-400 px-1">
              <span>
                Gyro{" "}
                <span className={gyroActive ? "text-green-400 font-semibold" : "text-void-500"}>
                  {gyroActive ? "Synced" : "Off"}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Dolly{" "}
                <span className="text-amber-glow font-medium">
                  {dollyOffset > 0 ? `+${dollyOffset.toFixed(1)}m` : `${dollyOffset.toFixed(1)}m`}
                </span>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
